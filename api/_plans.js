// api/_plans.js — fonte única de verdade dos planos (preço + duração).
// NUNCA confie no valor enviado pelo navegador: o preço é sempre
// recalculado aqui a partir do plan_id.

const PLANS = {
  teste:   { valueCents: 190,   dias: 1,  nome: 'Teste'   },
  semanal: { valueCents: 2700,  dias: 7,  nome: 'Semanal' },
  mensal:  { valueCents: 4700,  dias: 30, nome: 'Mensal'  },
};

function getPlan(planId) {
  return PLANS[planId] || null;
}

module.exports = { PLANS, getPlan };
