#!/usr/bin/env node
/**
 * aplicar-fixes-index.js
 * ----------------------------------------------------------------------------
 * Sobe uma nova versao do site (export "Grivo.bet - Standalone (N).html") para
 * o index.html do projeto, RE-APLICANDO os ajustes que toda exportacao nova do
 * design zera (porque o conteudo fica em chunks gzip dentro do bundle):
 *
 *   1. Botao "Entrar":            href="#login"  ->  login.html
 *   2. Rodape "Termos de Uso":    href="#"       ->  termos.html
 *   3. Rodape "Politica de ...":  href="#"       ->  privacidade.html
 *   4. Widget de LiveChat: injeta um loader "deferido" antes do </body>.
 *      A home e client-rendered (o bundler faz replaceWith do documento), entao
 *      um <script> normal seria descartado. O loader registra um setInterval
 *      (que sobrevive ao replaceWith por viver no heap) e injeta o livechat
 *      depois que o app monta (#root presente e "Unpacking..." sumiu).
 *
 * USO:
 *   node scripts/aplicar-fixes-index.js "/caminho/para/Grivo.bet - Standalone (6).html"
 *
 * Depois e so revisar e dar commit/push do index.html.
 * ----------------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const LIVECHAT_API_KEY =
  "6901fec7ed6a3fba98a1297e30be0a284518012749ac7ef8bb3db2691006a5ad";
const LIVECHAT_SRC =
  "https://d1svrfmyhkyg8q.cloudfront.net/livechat/prod/livechat.js";

// O export do design traz o menu Suporte com este e-mail; trocamos pelo real.
const EMAIL_DESIGN = "suporte@grivo.bet";
const EMAIL_REAL = "contato@grivo.bet";

// Google Analytics (gtag.js). Vai no <head> do TEMPLATE do bundler — o site
// faz replaceWith do documento, entao uma tag no <head> externo seria descartada.
const GA_ID = "G-KKZK1NVPWP";
const GA_TAG =
  '<!-- Google tag (gtag.js) -->\n' +
  '<script async src="https://www.googletagmanager.com/gtag/js?id=' + GA_ID + '"></scr' + 'ipt>\n' +
  '<script>\n' +
  '  window.dataLayer = window.dataLayer || [];\n' +
  '  function gtag(){dataLayer.push(arguments);}\n' +
  "  gtag('js', new Date());\n" +
  "  gtag('config', '" + GA_ID + "');\n" +
  '</scr' + 'ipt>\n';

// Microsoft Clarity — tambem no <head> do template do bundler.
const CLARITY_ID = "xbn16k3v1u";
const CLARITY_TAG =
  '<!-- Microsoft Clarity -->\n' +
  '<script type="text/javascript">\n' +
  '    (function(c,l,a,r,i,t,y){\n' +
  '        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n' +
  '        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n' +
  '        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n' +
  '    })(window, document, "clarity", "script", "' + CLARITY_ID + '");\n' +
  '</scr' + 'ipt>\n';

// Vercel Web Analytics + Speed Insights (implementacao HTML). Precisa estar
// "Enabled" no painel da Vercel para os caminhos /_vercel/... existirem.
const VERCEL_MARK = "/_vercel/insights/script.js";
const VERCEL_TAG =
  '<!-- Vercel Web Analytics -->\n' +
  '<script>\n' +
  '  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n' +
  '</scr' + 'ipt>\n' +
  '<script defer src="/_vercel/insights/script.js"></scr' + 'ipt>\n' +
  '<!-- Vercel Speed Insights -->\n' +
  '<script>\n' +
  '  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };\n' +
  '</scr' + 'ipt>\n' +
  '<script defer src="/_vercel/speed-insights/script.js"></scr' + 'ipt>\n';

// Sentry (Loader Script) — monitoramento de erros no frontend.
const SENTRY_MARK = "js.sentry-cdn.com/3c85e302cb0e1ad8ce80f8b44c99afc6";
const SENTRY_TAG =
  '<!-- Sentry -->\n' +
  '<script src="https://js.sentry-cdn.com/3c85e302cb0e1ad8ce80f8b44c99afc6.min.js" crossorigin="anonymous"></scr' + 'ipt>\n';

// Meta Pixel — tambem no <head> do template do bundler.
const PIXEL_ID = "1052503187247305";
const PIXEL_TAG =
  '<!-- Meta Pixel Code -->\n' +
  '<script>\n' +
  '!function(f,b,e,v,n,t,s)\n' +
  '{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n' +
  'n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n' +
  "if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n" +
  'n.queue=[];t=b.createElement(e);t.async=!0;\n' +
  't.src=v;s=b.getElementsByTagName(e)[0];\n' +
  "s.parentNode.insertBefore(t,s)}(window, document,'script',\n" +
  "'https://connect.facebook.net/en_US/fbevents.js');\n" +
  "fbq('init', '" + PIXEL_ID + "');\n" +
  "fbq('track', 'PageView');\n" +
  '</scr' + 'ipt>\n' +
  '<noscript><img height="1" width="1" style="display:none"\n' +
  'src="https://www.facebook.com/tr?id=' + PIXEL_ID + '&ev=PageView&noscript=1"\n' +
  '/></noscript>\n' +
  '<!-- End Meta Pixel Code -->\n';

const SRC = process.argv[2];
const OUT = path.join(__dirname, "..", "index.html");

if (!SRC) {
  console.error('Uso: node scripts/aplicar-fixes-index.js "<caminho do Standalone (N).html>"');
  process.exit(1);
}
if (!fs.existsSync(SRC)) {
  console.error("Arquivo nao encontrado: " + SRC);
  process.exit(1);
}

let html = fs.readFileSync(SRC, "utf8");
const counts = { login: 0, termos: 0, privacidade: 0, email: 0, ga: 0 };

// --- Corrige os links dentro dos chunks gzip do(s) manifesto(s) ---
html = html.replace(
  /(<script[^>]*type="__bundler\/manifest"[^>]*>)([\s\S]*?)(<\/script>)/g,
  (full, open, body, close) => {
    let man;
    try { man = JSON.parse(body.trim()); } catch (e) { return full; }
    for (const u of Object.keys(man)) {
      const e = man[u];
      if (!(e && e.compressed && typeof e.data === "string" && e.data.startsWith("H4sI"))) continue;
      let t;
      try { t = zlib.gunzipSync(Buffer.from(e.data, "base64")).toString("utf8"); } catch (_) { continue; }
      const before = t;

      if (t.includes('href="#login"')) {
        t = t.split('href="#login"').join('href="login.html"');
        counts.login++;
      }
      const t1 = t.replace(/(<a\b[^>]*?)href="#"([^>]*>\s*Termos de Uso)/i, '$1href="termos.html"$2');
      if (t1 !== t) counts.termos++;
      t = t1;
      const t2 = t.replace(/(<a\b[^>]*?)href="#"([^>]*>\s*Pol[ií]tica de Privacidade)/i, '$1href="privacidade.html"$2');
      if (t2 !== t) counts.privacidade++;
      t = t2;

      if (t.includes(EMAIL_DESIGN)) {
        t = t.split(EMAIL_DESIGN).join(EMAIL_REAL);
        counts.email++;
      }

      if (t !== before) {
        e.data = zlib.gzipSync(Buffer.from(t, "utf8")).toString("base64");
      }
    }
    return open + JSON.stringify(man) + close;
  }
);

// --- Analytics (GA + Clarity + Vercel Web Analytics/Speed Insights): <head> do template ---
html = html.replace(
  /(<script[^>]*type="__bundler\/template"[^>]*>)([\s\S]*?)(<\/script>)/,
  (full, open, body, close) => {
    let tpl;
    try { tpl = JSON.parse(body.trim()); } catch (e) { return full; }
    const m = tpl.match(/<head[^>]*>/i);
    if (!m) return full;
    let insert = "";
    if (!tpl.includes(GA_ID)) { insert += GA_TAG; counts.ga++; }
    if (!tpl.includes(CLARITY_ID)) { insert += CLARITY_TAG; }
    if (!tpl.includes(VERCEL_MARK)) { insert += VERCEL_TAG; }
    if (!tpl.includes(SENTRY_MARK)) { insert += SENTRY_TAG; }
    if (!tpl.includes(PIXEL_ID)) { insert += PIXEL_TAG; }
    if (!insert) return full;
    const i = m.index + m[0].length;
    tpl = tpl.slice(0, i) + "\n" + insert + tpl.slice(i);
    // Escapa </script> -> <\/script> para nao fechar o <script type="...template">.
    const json = JSON.stringify(tpl).split("</script>").join("<\\/script>");
    return open + json + close;
  }
);

// --- LiveChat deferido, antes do </body> ---
const deferred =
  "<!-- LiveChat (deferido: a home e client-rendered e substitui o body via replaceWith;\n" +
  "     registra um intervalo no heap que sobrevive a troca e injeta apos o app montar) -->\n" +
  "<script>\n" +
  "(function () {\n" +
  "  var KEY = '" + LIVECHAT_API_KEY + "';\n" +
  "  var SRC = '" + LIVECHAT_SRC + "';\n" +
  "  function inject() {\n" +
  "    if (document.querySelector('script[data-api-key]')) return;\n" +
  "    var j = document.createElement('script');\n" +
  "    j.async = true; j.src = SRC; j.setAttribute('data-api-key', KEY);\n" +
  "    (document.body || document.documentElement).appendChild(j);\n" +
  "  }\n" +
  "  var tries = 0;\n" +
  "  var iv = setInterval(function () {\n" +
  "    tries++;\n" +
  "    var mounted = document.getElementById('root') && !document.getElementById('__bundler_loading');\n" +
  "    if (mounted || tries > 60) { inject(); clearInterval(iv); }\n" +
  "  }, 200);\n" +
  "})();\n" +
  "</scr" + "ipt>\n";

const idx = html.lastIndexOf("</body>");
if (idx === -1) {
  console.error("Nao achei </body> no arquivo de origem.");
  process.exit(1);
}
html = html.slice(0, idx) + deferred + html.slice(idx);

fs.writeFileSync(OUT, html);
console.log("index.html gravado (" + html.length + " bytes)");
console.log("Fixes -> login:", counts.login, "| termos:", counts.termos, "| privacidade:", counts.privacidade, "| email-suporte:", counts.email, "| GA:", counts.ga);
if (counts.login === 0) console.warn("AVISO: nenhum href=#login encontrado (o design pode ter mudado o botao de login).");
if (counts.termos === 0 || counts.privacidade === 0) console.warn("AVISO: link de Termos/Privacidade nao encontrado para corrigir.");
