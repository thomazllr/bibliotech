import { initPersonalInfo } from './dados-pessoais/index.js';
import { setupMenuToggle } from './shared/menu-toggle.js';
import { initOrderHistory } from './historico-pedidos/index.js';

//Objeto para gerenciar seções
// AVISO: Para adicionar novas seções (ex.: Lista de Desejos, Pedidos), siga o padrão abaixo:
// - Crie um arquivo correspondente na pasta apropriada (ex.: 'listas-desejos/index.js').
// - Exporte uma função de inicialização (ex.: 'initListaDesejos').
// - Adicione a nova seção ao objeto 'secoes' com 'inicializada: false' e a função 'init'.

const secoes = {
  'dados-pessoais': {
    inicializada: false,
    init: initPersonalInfo
  },
  'historico-pedidos': {
    inicializada: false,
    init: initOrderHistory
  }
};

// Inicialização geral
document.addEventListener("DOMContentLoaded", () => {
  // Configura menu com callback
  setupMenuToggle(async (secaoId) => {
    if (secoes[secaoId] && !secoes[secaoId].inicializada) {
      await secoes[secaoId].init();
      secoes[secaoId].inicializada = true;
    }
  });

  // Carrega a seção padrão (Dados Pessoais)
  document.querySelector('.menu-item[data-section="dados-pessoais"]').click();
});