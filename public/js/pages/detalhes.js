import { getBookById } from "../api/livro.js";
import { renderSkeletonDetalhes } from "../utils/renderBooks.js";
import {
  adicionarLivroListaDesejos,
  removerLivroListaDesejos,
  verificarLivroNaListaDesejos,
} from "../api/lista-desejos.js";
import { obterUserId } from "../utils/auth-utils.js";
import { mostrarModalPadrao } from "../utils/modal-utils.js";
import "./carrinho.js";

function selecionarOpcao(elemento) {
  document
    .querySelectorAll(".opcao")
    .forEach((btn) => btn.classList.remove("ativo"));
  elemento.classList.add("ativo");
}

window.selecionarOpcao = selecionarOpcao;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("id");

  if (!bookId) {
    mostrarModalPadrao(
      "❌",
      "Livro não encontrado",
      "Não foi possível carregar o livro. Tente novamente.",
      "index.html",
      "Ir para a página inicial"
    );
    return;
  }

  const container = document.querySelector(".livro-container");
  renderSkeletonDetalhes(container);

  try {
    const response = await getBookById(bookId);
    if (response.status !== "success") throw new Error();

    const livro = response.data;

    container.innerHTML = `
      <div class="capa-container">
        <div class="capa-livro">
          <img src="${livro.imagem_url}" alt="${livro.titulo}" />
        </div>
      </div>
      <div class="detalhes-container">
        <h1 class="titulo-livro">${livro.titulo}</h1>
        <p class="autor">por ${livro.autor}</p>

        <div class="opcoes-compra">
          <button class="opcao ativo" onclick="selecionarOpcao(this)" data-tipo="ebook">
            E-Book<br>Disponível<br>instantaneamente
          </button>
          <button class="opcao" onclick="selecionarOpcao(this)" data-tipo="fisico">
            Livro Normal<br>Envio por Correios
          </button>
        </div>

        <div class="preco">R$ ${livro.preco}</div>

        <div class="acoes-livro">
          <button class="btn btn-comprar btn-loading" data-id="${livro.id}" data-titulo="${livro.titulo}">
  <span class="btn-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
  </span>
  Comprar
</button>
          <button class="btn-desejo" data-id="${livro.id}">
            💙 Salvar na Lista de Desejos
          </button>
        </div>

        <div class="secao">
          <h2 class="secao-titulo">Descrição</h2>
          <div class="secao-conteudo descricao">
            ${livro.descricao || "Descrição não disponível."}
          </div>
        </div>

        <div class="secao">
          <h2 class="secao-titulo">Informações</h2>
          <div class="secao-conteudo">
            <div class="info-item">
              <span class="info-label">Editora:</span>
              <span class="editora">${
                livro.editora_nome || "Editora não informada."
              }</span>
            </div>
            <div class="info-item">
              <span class="info-label">Gênero:</span>
              <span class="genero-nome">${
                livro.genero_nome || "Gênero não informado."
              }</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.dispatchEvent(new Event("livrosRenderizados"));

    // Botão Lista de Desejos
    const btnDesejo = document.querySelector(".btn-desejo");

    if (!btnDesejo) return;

    const usuarioId = await obterUserId();
    const livroId = livro.id;

    if (!usuarioId) {
      btnDesejo.addEventListener("click", () => {
        mostrarModalPadrao(
          "🔒",
          "Login necessário",
          "Você precisa estar logado para salvar livros na lista de desejos.",
          "login.html",
          "Ir para o login"
        );
      });
      return;
    }

    let estaNaLista = await verificarLivroNaListaDesejos(usuarioId, livroId);

    const atualizarTexto = () => {
      btnDesejo.innerHTML = estaNaLista
        ? "❌ Remover da Lista de Desejos"
        : "💙 Salvar na Lista de Desejos";
    };

    atualizarTexto();

    btnDesejo.addEventListener("click", async () => {
      if (estaNaLista) {
        const res = await removerLivroListaDesejos(livroId);
        if (res.status === "success") {
          estaNaLista = false;
          atualizarTexto();
          mostrarModalPadrao(
            "🗑️",
            "Removido",
            "Livro removido da lista de desejos."
          );
        } else {
          mostrarModalPadrao("❌", "Erro", "Não foi possível remover o livro.");
        }
      } else {
        const res = await adicionarLivroListaDesejos(livroId);
        if (res.status === "success") {
          estaNaLista = true;
          atualizarTexto();
          mostrarModalPadrao(
            "💙",
            "Adicionado",
            "Livro adicionado à lista de desejos!"
          );
        } else {
          mostrarModalPadrao(
            "❌",
            "Erro",
            res.message || "Erro ao adicionar o livro."
          );
        }
      }
    });
  } catch (error) {
    console.error("Erro ao buscar os detalhes do livro:", error);
    container.innerHTML =
      "<p>Erro ao carregar os detalhes do livro. Tente novamente mais tarde.</p>";
  }
});
