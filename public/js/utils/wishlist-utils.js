import {
    getListaDesejos,
    adicionarLivroListaDesejos,
    removerLivroListaDesejos,
  } from "../api/lista-desejos.js";
  import { obterUserId } from "./auth-utils.js";
  import { mostrarModalPadrao } from "./modal-utils.js";
  import { showToast } from "./toast.js";
  
  export async function carregarListaDesejos() {
    const userId = await obterUserId();
    if (!userId) return new Set();
  
    try {
      const resposta = await getListaDesejos(userId);
      const lista = resposta.data || [];
      return new Set(lista.map((id) => parseInt(id)));
    } catch (error) {
      console.error("Erro ao carregar lista de desejos:", error);
      return new Set();
    }
  }
  
  export function configurarBotoesFavoritos(favoritos, botaoSelector) {
    document.querySelectorAll(botaoSelector).forEach((btn) => {
      const livroId = parseInt(btn.dataset.id);
  
      const atualizarBotao = () => {
        if (favoritos.has(livroId)) {
          btn.classList.add("salvo");
          btn.textContent = "❌";
          btn.title = "Remover da Lista de Desejos";
        } else {
          btn.classList.remove("salvo");
          btn.textContent = "💙";
          btn.title = "Salvar na Lista de Desejos";
        }
      };
  
      atualizarBotao();
  
      btn.addEventListener("click", async () => {
        const userId = await obterUserId();
        if (!userId) {
          mostrarModalPadrao(
            "🔒",
            "Login necessário",
            "Você precisa estar logado para salvar livros na lista de desejos.",
            "login.html",
            "Ir para o login"
          );
          return;
        }
  
        if (favoritos.has(livroId)) {
          const res = await removerLivroListaDesejos(livroId);
          if (res.status === "success") {
            favoritos.delete(livroId);
            atualizarBotao();
            showToast("Removido da lista de desejos", "info");
          }
        } else {
          const res = await adicionarLivroListaDesejos(livroId);
          if (res.status === "success") {
            favoritos.add(livroId);
            atualizarBotao();
            showToast("Adicionado à lista de desejos!", "success");
          }
        }
      });
    });
  }