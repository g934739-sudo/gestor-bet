# GestorBet — Checklist de Lançamento (fora do Claude)

## 1. Domínio
- [ ] Comprar domínio (ex: gestorbet.com) — Registro.br ou GoDaddy

## 2. Hospedagem
- [ ] Criar conta no Netlify (gratuito) — netlify.com
- [ ] Fazer upload dos arquivos HTML
- [ ] Apontar o domínio comprado para o Netlify

## 3. Pagamento
- [ ] Criar conta na Kiwify, Hotmart ou Stripe
- [ ] Cadastrar os 3 planos (R$49 / R$99 / R$297)
- [ ] Substituir os botões de "Assinar" no site pelos links de pagamento gerados

## 4. E-mail marketing
- [ ] Criar conta no Brevo (gratuito até 300 e-mails/dia) — brevo.com
- [ ] Importar os 3 templates de e-mail (boas-vindas, marketing, primeira compra)
- [ ] Configurar automação:
  - Cadastro novo → dispara `email boas-vindas`
  - Compra confirmada → dispara `email primeira compra`
  - Campanha manual → `email-deploy` (marketing)

## 5. Autenticação de usuários
- [ ] Criar conta no Supabase (gratuito) — supabase.com
- [ ] Ativar Auth (e-mail + senha)
- [ ] Conectar o formulário de `tela-login-cadastro.html` ao Supabase

## 6. Antes de lançar
- [ ] Testar fluxo completo: site → cadastro → app → pagamento
- [ ] Testar os 3 e-mails automáticos
- [ ] Adicionar links reais de pagamento no site
- [ ] Adicionar link de termos de uso e política de privacidade
- [ ] Configurar domínio de e-mail (ex: contato@gestorbet.com)
