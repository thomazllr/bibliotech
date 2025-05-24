import { buscarPedidoCompletoPorId, buscarPedidosDoUsuario } from "../../../api/pedido.js";
import { getBookById } from "../../../api/livro.js";
// Declare a função skeleton antes de usá-la
export function renderSkeletonPedidos() {
  const container = document.querySelector("#section-historico-pedidos .order-list");
  if (!container) return;
  container.innerHTML = `
    <div class="order-skeleton-list">
      ${Array(2).fill(`
        <div class="order-item skeleton">
          <div class="order-header">
            <div class="order-info">
              <span class="order-id skeleton-box" style="width: 120px; height: 20px;"></span>
              <span class="order-date skeleton-box" style="width: 80px; height: 16px;"></span>
            </div>
            <div class="order-status skeleton-box" style="width: 90px; height: 20px;"></div>
          </div>
          <div class="order-books">
            <div class="order-book">
              <span class="order-book-cover skeleton-box" style="width: 60px; height: 90px;"></span>
              <div class="order-book-info">
                <span class="skeleton-box" style="width: 120px; height: 18px;"></span>
                <span class="skeleton-box" style="width: 80px; height: 14px;"></span>
                <span class="skeleton-box" style="width: 60px; height: 14px;"></span>
              </div>
            </div>
          </div>
          <div class="order-summary">
            <span class="skeleton-box" style="width: 80px; height: 16px;"></span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export async function carregarHistoricoPedidos() {
    const container = document.querySelector("#section-historico-pedidos .order-list");
    renderSkeletonPedidos();

    try {
        const pedidos = await buscarPedidosDoUsuario();

        // Aguarda pelo menos 600ms para o skeleton aparecer
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (pedidos.status === "success") {
            // Enriquece cada pedido com os detalhes dos livros
            const pedidosComDetalhes = [];
            
            for (const pedido of pedidos.data) {
                // Se o pedido tem itens, enriquece cada item
                if (pedido.itens && pedido.itens.length > 0) {
                    pedido.itens = await enriquecerItensPedido(pedido.itens);
                }
                pedidosComDetalhes.push(pedido);
            }
            
            preencherTabela(pedidosComDetalhes);
        } else {
            preencherTabela([]);
        }
    } catch (error) {
        preencherTabela([]);
        console.error("Erro ao carregar histórico de pedidos:", error);
    }
}

function preencherTabela(pedidos) {
  const container = document.querySelector("#section-historico-pedidos .order-list");
  if (!container) return;

  if (!pedidos || !pedidos.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <h3>Nenhum pedido realizado</h3>
        <p>Seus pedidos aparecerão aqui quando você fizer compras em nossa loja.</p>
        <a href="home.html" class="btn">Explorar Livros</a>
      </div>
    `;
    return;
  }

  console.log("Pedidos carregados:", JSON.stringify(pedidos)); // Log completo para debug
  
  // Limpa o container antes de preencher
  container.innerHTML = "";
  
  // Preenche o container com os pedidos formatados
  container.innerHTML = `
    <div class="order-list">
      ${pedidos.map(pedido => {
        // Log detalhado do pedido
        console.log("Processando pedido:", pedido.id, JSON.stringify(pedido));
        
        // ID do pedido - pode vir de várias propriedades
        const pedidoId = pedido.id || pedido.pedido_id || "";
        
        // Data formatada - tente diferentes propriedades para a data
        let dataFormatada = "Data não disponível";
        try {
          if (pedido.criado_em) {
            dataFormatada = new Date(pedido.criado_em).toLocaleDateString();
          }
        } catch (e) {
          console.error("Erro ao formatar data:", e);
        }
        
        // Status do pedido - normalize para lowercase para comparações
        const status = (pedido.status || "pendente").toLowerCase();
        const statusFormatado = status.charAt(0).toUpperCase() + status.slice(1);
        const statusClass = 
          status === 'entregue' ? 'delivered' : 
          status === 'processando' ? 'processing' : '';
        
        // Encontrar os itens do pedido - podem estar em várias propriedades
        let itens = [];
        if (Array.isArray(pedido.itens)) {
          itens = pedido.itens;
        } else if (Array.isArray(pedido.items)) {
          itens = pedido.items;
        } else if (Array.isArray(pedido.livros)) {
          itens = pedido.livros;
        }
        
        console.log("Itens do pedido:", itens);
        
        // Calcular subtotal, frete e total com segurança
        let subtotal = 0;
        try {
          if (typeof pedido.subtotal === 'number') {
            subtotal = pedido.subtotal;
          } else if (itens.length > 0) {
            subtotal = itens.reduce((acc, item) => {
              const preco = parseFloat(item.preco_unitario || item.preco || 0);
              const quantidade = parseInt(item.quantidade || 1);
              return acc + (preco * quantidade);
            }, 0);
          }
        } catch (e) {
          console.error("Erro ao calcular subtotal:", e);
        }
        
        let frete = 0;
        try {
          if (subtotal > 0 && subtotal <= 100) {
            frete = 24.99; // Frete de R$ 24,99 para compras até R$ 100
          }
          // Se subtotal > 100, frete permanece 0 (grátis)
        } catch (e) {
          console.error("Erro ao calcular frete:", e);
        }
        
        let total = 0;
        try {
          if (typeof pedido.total === 'number') {
            // Se o pedido já tem um total definido, use-o
            total = pedido.total;
          } else {
            // Senão, calcule o total somando o subtotal + frete
            total = subtotal + frete;
            
            // Verificação adicional para garantir que o frete de 24.99 seja adicionado
            if (subtotal > 0 && subtotal <= 100) {
              // Garanta que o frete seja exatamente 24.99 para pedidos até R$100
              total = subtotal + 24.99;
            }
          }
          
          if (isNaN(total)) total = 0;
        } catch (e) {
          console.error("Erro ao calcular total:", e);
        }
        
        // Código de rastreio
        const rastreio = pedido.rastreio || pedido.codigo_rastreio || "";

        return `
        <div class="order-item">
          <div class="order-header">
            <div class="order-info">
              <span class="order-id">Pedido #${pedidoId}</span>
              <span class="order-date">${dataFormatada}</span>
            </div>
            <div class="order-status ${statusClass}">
              ${statusFormatado}
            </div>
          </div>
          
          <div class="order-books">
            ${itens.length > 0 ? 
              itens.map(item => {
                try {
                  // Extrair dados dos itens com segurança
                  const titulo = item.titulo || item.title || "Título não disponível";
                  const autor = item.autor || item.author || "Autor não disponível";
                  const imagemUrl = item.imagem_url || item.image_url || '/bibliotech/public/images/placeholder-book.png';
                  
                  // Log para debugar o problema
                  console.log("Item:", item);
                  console.log("Tipo de preco_unitario:", typeof item.preco_unitario);
                  
                  // Limpamente definindo o preço
                  let precoUnitario = 0;
                  if (item.preco_unitario !== undefined && item.preco_unitario !== null) {
                    precoUnitario = Number(item.preco_unitario);
                  } else if (item.preco !== undefined && item.preco !== null) {
                    precoUnitario = Number(item.preco);
                  }
                  
                  // Garantir que é número e formatar
                  let precoFormatado = "0,00";
                  if (!isNaN(precoUnitario)) {
                    precoFormatado = precoUnitario.toFixed(2).replace('.', ',');
                  }
                  
                  const quantidade = parseInt(item.quantidade || 1);
                  
                  return `
                  <div class="order-book">
                    <img src="${imagemUrl}" alt="Capa do Livro" class="order-book-cover">
                    <div class="order-book-info">
                      <h4>${titulo}</h4>
                      <p>${autor}</p>
                      <div class="order-book-price">
                        R$ ${precoFormatado}
                        <span class="order-quantity">x${quantidade}</span>
                      </div>
                    </div>
                  </div>
                `;
                } catch (e) {
                  console.error("Erro ao renderizar item:", e);
                  return "<div>Erro ao carregar item</div>";
                }
              }).join("") 
              : "<p>Nenhum livro neste pedido.</p>"
            }
          </div>
          
          <div class="order-summary">
            <div class="summary-item">
              <span>Subtotal:</span>
              <span>R$ ${isNaN(subtotal) ? "0.00" : subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <span>Frete:</span>
              <span>R$ ${isNaN(frete) ? "0.00" : frete.toFixed(2)}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item total">
              <span>Total:</span>
              <span>R$ ${isNaN(total) ? "0.00" : total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="order-footer">
            ${rastreio ? `
              <div class="order-tracking">
                <div class="tracking-info">
                  <span class="tracking-label">Código de rastreio:</span>
                  <span class="tracking-number">${rastreio}</span>
                </div>
              </div>
            ` : ""}
            <button class="btn btn-small ver-detalhes" data-pedido-id="${pedidoId}">Ver Detalhes</button>
          </div>
        </div>
      `}).join("")}
    </div>
  `;

  // Adiciona evento para "Ver Detalhes"
  container.querySelectorAll(".ver-detalhes").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      try {
        const pedidoId = btn.dataset.pedidoId;
        // Mostra o skeleton enquanto carrega
        renderSkeletonPedidos();
        
        const resposta = await buscarPedidoCompletoPorId(pedidoId);
        if (resposta.status === "success") {
          // Normaliza os dados - pode vir como array ou objeto único
          const dados = Array.isArray(resposta.data) ? resposta.data : [resposta.data];
          preencherTabela(dados);
        } else {
          console.error("Erro na resposta da API:", resposta);
          container.innerHTML = `<p>Erro ao carregar detalhes do pedido.</p>`;
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do pedido:", error);
        container.innerHTML = `<p>Erro ao carregar detalhes do pedido.</p>`;
      }
    });
  });
}

async function obterDetalhesLivro(livroId) {
  try {
    const response = await getBookById(livroId);
    if (response.status === "success") {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do livro ${livroId}:`, error);
    return null;
  }
}

// Função para enriquecer os itens do pedido com detalhes dos livros
async function enriquecerItensPedido(itens) {
  if (!itens || !itens.length) return [];
  
  const itensEnriquecidos = [];
  
  for (const item of itens) {
    const livroId = item.livro_id;
    const detalhesLivro = await obterDetalhesLivro(livroId);
    
    itensEnriquecidos.push({
      ...item,
      titulo: detalhesLivro?.titulo || "Título não disponível",
      autor: detalhesLivro?.autor || "Autor não disponível",
      imagem_url: detalhesLivro?.imagem_url || "/bibliotech/public/images/placeholder-book.png"
    });
  }
  
  return itensEnriquecidos;
}