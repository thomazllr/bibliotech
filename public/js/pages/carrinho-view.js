import { obterUserId } from "../utils/auth-utils.js";
import {
  getCarrinhoDoUsuario,
  removerDoCarrinho,
  atualizarQuantidadeNoServidor,
} from "../api/carrinho.js";
import { mostrarModalPadrao } from "../utils/modal-utils.js";

let userId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  const freteEl = document.getElementById("frete");

  if (!container || !subtotalEl || !totalEl || !freteEl) {
    console.warn("Elementos do carrinho não encontrados. Script encerrado.");
    return;
  }

  userId = await obterUserId();
  console.log("User ID:", userId);

  if (!userId) {
    container.innerHTML =
      "<p class='error-msg'>Você precisa estar logado para ver o carrinho.</p>";
    return;
  }

  try {
    console.log("Buscando carrinho...");
    const data = await getCarrinhoDoUsuario(userId);

    if (data.status !== "success") {
      throw new Error(data.message);
    }

    const livros = data.data;

    if (!livros || livros.length === 0) {
      container.innerHTML =
        "<p class='empty-cart'>Seu carrinho está vazio.</p>";
      subtotalEl.textContent = "0,00";
      freteEl.textContent = "R$ 0,00";
      totalEl.textContent = "0,00";
      return;
    }

    container.innerHTML = "";

    livros.forEach((livro) => {
      const item = document.createElement("div");
      item.classList.add("cart-item");
      item.innerHTML = `
        <div class="livro-info">
          <img src="${livro.imagem_url}" alt="${livro.titulo}">
          <div class="livro-detalhes">
            <h3 class="livro-titulo">
  <a class="book-cover-link" href="detalhes-livro.html?id=${livro.livro_id}">
    ${livro.titulo}
  </a>
</h3>
          <p class="livro-autor">por ${livro.autor || "Autor desconhecido"}</p>
            <p class="livro-preco">R$ ${livro.preco}</p>
          </div>
        </div>
        <div class="cart-actions">
          <button class="btn-menor">-</button>
          <span>${livro.quantidade}</span>
          <button class="btn-maior">+</button>
          <button class="btn-remover" data-livro-id="${
            livro.livro_id
          }">🗑️</button>
        </div>
      `;

      const btnMenor = item.querySelector(".btn-menor");
      const btnMaior = item.querySelector(".btn-maior");
      const quantidadeSpan = item.querySelector(".cart-actions span");

      const removerBtn = item.querySelector(".btn-remover");
      removerBtn.addEventListener("click", async () => {
        const livroId = removerBtn.getAttribute("data-livro-id");

        if (!confirm("Deseja remover este item do carrinho?")) return;

        try {
          await removerDoCarrinho(livroId, userId);
          item.remove();
          atualizarResumoCarrinho();
        } catch (err) {
          console.error("Erro ao remover item:", err);
          alert("Erro ao remover item do carrinho.");
        }
      });

      btnMaior.addEventListener("click", async () => {
        let quantidade = parseInt(quantidadeSpan.textContent);
        quantidade++;
        quantidadeSpan.textContent = quantidade;

        await atualizarQuantidadeNoServidor(livro.livro_id, quantidade, userId);
        atualizarResumoCarrinho();
      });

      btnMenor.addEventListener("click", async () => {
        let quantidade = parseInt(quantidadeSpan.textContent);
        const livroId = livro.livro_id;

        if (quantidade > 1) {
          quantidade--;
          quantidadeSpan.textContent = quantidade;

          await atualizarQuantidadeNoServidor(livroId, quantidade, userId);
          atualizarResumoCarrinho();
        } else {
          if (!confirm("Deseja remover este item do carrinho?")) return;

          try {
            await removerDoCarrinho(livroId, userId);
            item.remove();
            atualizarResumoCarrinho();
          } catch (err) {
            console.error("Erro ao remover item:", err);
            alert("Erro ao remover item do carrinho.");
          }
        }
      });

      container.appendChild(item);
    });

    atualizarResumoCarrinho();
  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
    container.innerHTML =
      "<p class='error-msg'>Erro ao carregar os itens do carrinho.</p>";
  }
});

export function atualizarResumoCarrinho() {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  const freteEl = document.getElementById("frete");

  let subtotal = 0;
  let frete = 0;
  let textoFrete = "";

  const itens = container.querySelectorAll(".cart-item");

  itens.forEach((item) => {
    const precoTexto =
      item.querySelector(".livro-preco")?.textContent || "R$ 0";
    const preco = parseFloat(precoTexto.replace("R$", "").replace(",", "."));

    const quantidade = parseInt(
      item.querySelector(".cart-actions span")?.textContent || "1"
    );

    subtotal += preco * quantidade;
  });
  
  if (subtotal === 0) {
    textoFrete = "R$ 0,00";
    frete = 0;
  } else {
    frete = 24.99; 
    textoFrete = `R$ ${frete.toFixed(2).replace(".", ",")}`;
  }

  const total = subtotal + frete;

  subtotalEl.textContent = subtotal.toFixed(2).replace(".", ",");
  freteEl.textContent = textoFrete;
  totalEl.textContent = total.toFixed(2).replace(".", ",");
}

const btnFinalizar = document.getElementById("btnFinalizar");

if (btnFinalizar) {
  btnFinalizar.addEventListener("click", async () => {
    // Verificar se o carrinho não está vazio antes de redirecionar
    const container = document.getElementById("cart-items-container");
    let itemCount = 0;
    if (container) {
        const items = container.querySelectorAll(".cart-item");
        itemCount = items.length;
    }

    if (itemCount === 0) {
      mostrarModalPadrao(
        "⚠️",
        "Carrinho Vazio",
        "Seu carrinho está vazio. Adicione itens antes de finalizar.",
        "carrinho.html"
      );
    }
    window.location.href = "finalizar.html";
  });
}
