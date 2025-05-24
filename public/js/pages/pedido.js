import {
  buscarPedidoCompletoPorId,
  buscarPedidosDoUsuario,
} from "../api/pedido.js";
import { confirmarPedido } from "../api/pedido.js";

document
  .getElementById("confirm-order-final")
  .addEventListener("click", async () => {
    try {
      const res = await confirmarPedido();
      alert("Pedido confirmado com sucesso!");
      window.location.href = "home.html";
    } catch (error) {
      alert("Erro ao confirmar pedido: " + error.message);
    }
  });
document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(".payment-form").forEach((form) => {
      form.classList.remove("active");
      form.style.display = "none";
    });

    const selectedForm = document.getElementById(`${radio.value}-form`);
    if (selectedForm) {
      selectedForm.classList.add("active");
      selectedForm.style.display = "block";
    }
  });
});

function atualizarParcelas(total) {
  const select = document.getElementById("parcelas");
  if (!select) return;

  select.innerHTML = "";

  for (let i = 1; i <= 3; i++) {
    const valorParcela = (total / i).toFixed(2).replace(".", ",");
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}x de R$ ${valorParcela}`;
    select.appendChild(option);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const orderItemsContainer = document.getElementById("order-items");

  const pedidoId = localStorage.getItem("pedidoIdFinalizado");
  if (!pedidoId) {
    orderItemsContainer.innerHTML = "<p>Nenhum pedido para finalizar.</p>";
    return;
  }

  try {
    const detalhes = await buscarPedidoCompletoPorId(pedidoId);
    if (detalhes.status !== "success") throw new Error("Erro ao buscar itens.");

    const itens = detalhes.data;

    itens.forEach((item) => {
      const itemHTML = `
        <div class="item-pedido">
          <img src="${item.imagem_url}" alt="${item.titulo}" class="item-img"/>
          <div class="item-info">
            <h3>${item.titulo}</h3>
            <p>Quantidade: ${item.quantidade}</p>
            <p>Preço unitário: R$ ${item.preco_unitario}</p>
          </div>
        </div>
      `;
      orderItemsContainer.insertAdjacentHTML("beforeend", itemHTML);
    });

    const subtotal = itens.reduce(
      (acc, item) => acc + item.quantidade * item.preco_unitario,
      0
    );

    const subtotalFormatado = subtotal.toFixed(2).replace(".", ",");
    document.getElementById("subtotal").textContent = subtotalFormatado;
    document.getElementById("frete").textContent = "0,00";
    document.getElementById("total").textContent = subtotalFormatado;

    atualizarParcelas(subtotal);
  } catch (error) {
    console.error("Erro ao mostrar pedido:", error);
    orderItemsContainer.innerHTML = "<p>Erro ao carregar pedido.</p>";
  }
});
