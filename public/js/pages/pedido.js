import { finalizarPedido } from "../api/pedido.js"; 
import { getCarrinhoDoUsuario } from "../api/carrinho.js"
import { obterUserId } from "../utils/auth-utils.js"; 

// Função para carregar e exibir o resumo do carrinho na página de finalização
async function carregarResumoDoCarrinho() {
  const orderItemsContainer = document.getElementById("order-items");
  const subtotalEl = document.getElementById("subtotal");
  const freteEl = document.getElementById("frete");
  const totalEl = document.getElementById("total");
  const btnConfirmarFinal = document.getElementById("confirm-order-final");

  if (!orderItemsContainer || !subtotalEl || !freteEl || !totalEl || !btnConfirmarFinal) {
    console.warn("Elementos do resumo do pedido ou botão de confirmação não encontrados na página de finalização.");
    if(btnConfirmarFinal) btnConfirmarFinal.disabled = true;
    return;
  }
  btnConfirmarFinal.disabled = true; // Desabilita por padrão até carregar os itens

  try {
    const userId = await obterUserId();
    if (!userId) {
      orderItemsContainer.innerHTML = "<p>Usuário não autenticado. Faça login para continuar.</p>";
      return;
    }

    const carrinhoData = await getCarrinhoDoUsuario(userId);

    if (carrinhoData.status !== "success" || !carrinhoData.data || carrinhoData.data.length === 0) {
      orderItemsContainer.innerHTML = "<p>Seu carrinho está vazio. Não há itens para finalizar.</p>";
      subtotalEl.textContent = "0,00";
      freteEl.textContent = "R$ 0,00";
      totalEl.textContent = "0,00";
      alert("Seu carrinho está vazio. Você será redirecionado para a página de carrinho.");
      window.location.href = "carrinho.html";
      return;
    }

    const itensCarrinho = carrinhoData.data;
    orderItemsContainer.innerHTML = ""; // Limpa o container antes de adicionar novos itens
    let subtotalCalculado = 0;

    itensCarrinho.forEach((item) => {
      const itemHTML = `
        <div class="item-pedido">
          <img src="${item.imagem_url || '../public/images/placeholder.png'}" alt="${item.titulo}" class="item-img"/>
          <div class="item-info">
            <h3>${item.titulo}</h3>
            <p>Quantidade: ${item.quantidade}</p>
            <p>Preço unitário: R$ ${parseFloat(item.preco).toFixed(2).replace(".", ",")}</p>
          </div>
        </div>
      `;
      orderItemsContainer.insertAdjacentHTML("beforeend", itemHTML);
      subtotalCalculado += parseFloat(item.preco) * item.quantidade;
    });

    let freteCalculado = 24.99;
    let textoFrete = "R$ 24,99"; 
    const totalCalculado = subtotalCalculado + freteCalculado;

    subtotalEl.textContent = subtotalCalculado.toFixed(2).replace(".", ",");
    freteEl.textContent = textoFrete;
    totalEl.textContent = totalCalculado.toFixed(2).replace(".", ",");

    atualizarParcelas(totalCalculado); // Atualiza parcelas com base no total final
    btnConfirmarFinal.disabled = false; // Habilita o botão após carregar os itens

  } catch (error) {
    console.error("Erro ao carregar resumo do carrinho na página de finalização:", error);
    orderItemsContainer.innerHTML = "<p>Erro ao carregar itens do carrinho. Tente recarregar a página.</p>";
  }
}


document
  .getElementById("confirm-order-final")
  .addEventListener("click", async (event) => {
    const btnConfirmar = event.currentTarget;
    btnConfirmar.disabled = true;
    btnConfirmar.classList.add("loading");

    try {
      const res = await finalizarPedido(); 

      if (res.status === "success" && res.pedido_id) {
        alert(`Pedido #${res.pedido_id} confirmado com sucesso!`);
        window.location.href = "perfil.html#historico-pedidos";
      } else {
        throw new Error(res.message || "Erro ao confirmar o pedido. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao confirmar pedido: " + error.message);
      console.error("Erro na confirmação final do pedido:", error);
      btnConfirmar.disabled = false;
      btnConfirmar.classList.remove("loading");
    }
  });

document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(".payment-form").forEach((form) => {
      form.classList.remove("active");
      form.style.display = "none"; // Garante que outros formulários fiquem ocultos
    });

    const selectedForm = document.getElementById(`${radio.value}-form`);
    if (selectedForm) {
      selectedForm.classList.add("active");
      selectedForm.style.display = "block"; // Mostra o formulário selecionado
    }
  });
});

function atualizarParcelas(total) {
  const select = document.getElementById("parcelas");
  if (!select) return;

  select.innerHTML = ""; // Limpa opções anteriores

  // Exemplo: até 3 parcelas sem juros, ou mais com juros (ajuste a lógica)
  for (let i = 1; i <= 3; i++) {
    const valorParcela = (total / i).toFixed(2).replace(".", ",");
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}x de R$ ${valorParcela}`;
    select.appendChild(option);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarResumoDoCarrinho();

  // Garante que o formulário de pagamento padrão (ex: cartão) esteja visível ao carregar
  const formaPagamentoPadrao = document.getElementById('cartao'); // Ou a forma padrão que você definir
  if (formaPagamentoPadrao && formaPagamentoPadrao.checked) {
    const formPadrao = document.getElementById(`${formaPagamentoPadrao.value}-form`);
    if (formPadrao) {
        formPadrao.classList.add('active');
        formPadrao.style.display = 'block';
    }
  } else { // Se nenhuma estiver checada, pode definir uma padrão ou deixar como está
    const primeiroForm = document.querySelector('.payment-form');
    if(primeiroForm) {
        primeiroForm.classList.add('active');
        primeiroForm.style.display = 'block';
        const inputCorrespondente = document.querySelector(`input[name="payment"][value="${primeiroForm.id.replace('-form','')}"]`);
        if(inputCorrespondente) inputCorrespondente.checked = true;
    }
  }
});