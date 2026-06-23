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

// --- Google Analytics: injeta no <head> do template do bundler ---
html = html.replace(
  /(<script[^>]*type="__bundler\/template"[^>]*>)([\s\S]*?)(<\/script>)/,
  (full, open, body, close) => {
    let tpl;
    try { tpl = JSON.parse(body.trim()); } catch (e) { return full; }
    if (tpl.includes(GA_ID)) return full;
    const m = tpl.match(/<head[^>]*>/i);
    if (!m) return full;
    const i = m.index + m[0].length;
    tpl = tpl.slice(0, i) + "\n" + GA_TAG + tpl.slice(i);
    counts.ga++;
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
