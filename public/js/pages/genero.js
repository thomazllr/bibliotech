import { getGeneros } from "../api/genero.js";
import { searchBooks } from "../api/livro.js";
import { renderBooks, renderSkeletons } from "../utils/renderBooks.js";
import { carregarListaDesejos, configurarBotoesFavoritos } from "../utils/wishlist-utils.js";



export async function carregarGeneros(selectClass) {
  try {
    const generoSelect = document.querySelector(`.${selectClass}`); // Seleciona o elemento pela classe
    if (!generoSelect) {
      console.error(`Elemento com a classe "${selectClass}" não encontrado.`);
      return;
    }

    const response = await getGeneros();

    if (response.status === "success") {
      console.log("Gêneros carregados com sucesso:", response);
      response.data.forEach((genero) => {
        const option = document.createElement("option");
        option.value = genero.id;
        option.textContent = genero.nome;
        generoSelect.appendChild(option);
      });
    } else {
      console.error("Erro ao carregar gêneros:", response.message);
    }
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarGeneros("genero"); // Classe do <select> de gêneros
});

async function carregarLivrosPorGenero() {
  const container = document.getElementById("generos-container");

  try {
    const generosResponse = await getGeneros();
    if (generosResponse.status !== "success") {
      throw new Error("Erro ao carregar gêneros.");
    }

    const generos = generosResponse.data;

    // Carregar lista de desejos
    const favoritos = await carregarListaDesejos();

    for (const genero of generos) {
      // Cria uma seção para o gênero
      const generoSection = document.createElement("section");
      generoSection.classList.add("genero-section");

      // Adiciona o título do gênero
      const generoTitulo = document.createElement("h2");
      generoTitulo.textContent = genero.nome;
      generoTitulo.classList.add("heading-secondary");

      // Cria o contêiner para os livros
      const livrosGrid = document.createElement("div");
      livrosGrid.classList.add("grid", "grid--4-cols");

      // Renderiza os esqueletos enquanto os livros são carregados
      renderSkeletons(livrosGrid, 4);

      // Adiciona o título e os esqueletos à seção
      generoSection.appendChild(generoTitulo);
      generoSection.appendChild(livrosGrid);

      // Adiciona a seção ao contêiner principal
      container.appendChild(generoSection);

      // Busca os livros do gênero
      const livrosResponse = await searchBooks("", genero.id);
      if (livrosResponse.status === "success") {
        const livros = livrosResponse.data;

        if (livros.length > 0) {
          // Substitui os esqueletos pelos livros reais
          livrosGrid.innerHTML = ""; // Limpa os esqueletos
          renderBooks(livrosGrid, livros);

          // Configurar botões de favoritos
          configurarBotoesFavoritos(favoritos, ".btn-favorito");
        } else {
          // Remove a seção se não houver livros
          container.removeChild(generoSection);
        }
      } else {
        // Remove a seção se houver erro ao carregar os livros
        container.removeChild(generoSection);
        console.warn(`Erro ao carregar livros para o gênero ${genero.nome}: ${livrosResponse.message}`);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar livros por gênero:", error);
    container.innerHTML = "<p>Erro ao carregar os livros. Tente novamente mais tarde.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("generos-container");
  const modal = document.getElementById("cadastroModal");

  if (modal) {
    // Fecha o modal ao clicar fora dele
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  if (container) {
    carregarLivrosPorGenero();
    
    // Atualiza a lista de desejos ao voltar do histórico
    window.addEventListener("pageshow", async (event) => {
      if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
        try {
          const favoritos = await carregarListaDesejos();
          configurarBotoesFavoritos(favoritos, ".btn-favorito");
        } catch (error) {
          console.error("Erro ao atualizar a lista de desejos ao voltar:", error);
        }
      }
    });
  } else {
    console.warn("Elemento 'generos-container' não encontrado no DOM.");
  }
});