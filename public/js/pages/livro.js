import {
  createBook,
  deleteBook,
  updateBook,
  getBooks,
  getBookById,
} from "../api/livro.js";

import { getAllEditoras } from "../api/editora.js";

const modal = document.getElementById("modalCadastroLivro");
const btnAbrirModal = document.querySelector(".btn-add-livro");
const btnFecharModal = modal.querySelector(".close-btn");
const formLivro = modal.querySelector(".form-livro");
const btnLimpar = formLivro.querySelector(".btn.limpar");
const btnSalvar = document.getElementById("btnSalvarLivro");
const modalTitulo = modal.querySelector("h2");
const tbody = document.querySelector(".admin-table tbody");

const modalConfirmarExclusao = document.getElementById(
  "modalConfirmarExclusao"
);
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
const modalSucessoExclusao = document.getElementById("modalSucessoExclusao");

let livroEmEdicaoId = null;
let livroParaExcluirId = null;

// Carregar as editoras quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  await carregarLivros();
  await carregarEditoras();
});

function abrirModal() {
  modal.classList.remove("hidden");
}

function fecharModal() {
  modal.classList.add("hidden");
  limparFormulario();
  livroEmEdicaoId = null;
  btnSalvar.textContent = "SALVAR";
  modalTitulo.textContent = "Cadastro de Livros";
}

function limparFormulario() {
  formLivro.reset();
}

function mostrarModalSucesso() {
  const modalSucesso = document.getElementById("modalSucesso");
  modalSucesso.classList.remove("hidden");

  setTimeout(() => {
    modalSucesso.classList.add("hidden");
  }, 3000);

  modalSucesso.addEventListener("click", () => {
    modalSucesso.classList.add("hidden");
  });
}

function abrirModalConfirmacaoExclusao(id) {
  livroParaExcluirId = id;
  modalConfirmarExclusao.classList.remove("hidden");
}

function fecharModalConfirmacaoExclusao() {
  modalConfirmarExclusao.classList.add("hidden");
  livroParaExcluirId = null;
}

function mostrarModalSucessoExclusao() {
  modalSucessoExclusao.classList.remove("hidden");
  setTimeout(() => {
    modalSucessoExclusao.classList.add("hidden");
  }, 3000);

  modalSucessoExclusao.addEventListener("click", () => {
    modalSucessoExclusao.classList.add("hidden");
  });
}

btnAbrirModal.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);
btnLimpar.addEventListener("click", limparFormulario);

async function carregarEditoras() {
  try {
    const response = await getAllEditoras();
    
    if (response.success) {
      const editoraSelect = document.getElementById('editora');
      
      // Limpar opções existentes (exceto a primeira)
      const firstOption = editoraSelect.options[0];
      editoraSelect.innerHTML = '';
      editoraSelect.appendChild(firstOption);
      
      // Adicionar as editoras como opções
      response.data.forEach(editora => {
        const option = document.createElement('option');
        option.value = editora.id;
        option.textContent = editora.nome;
        editoraSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Erro ao carregar editoras:", error);
  }
}

async function carregarLivros() {
  try {
    const response = await getBooks();
    tbody.innerHTML = "";

    if (response.status === "success") {
      response.data.forEach((livro) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${livro.id}</td>
          <td>${livro.titulo}</td>
          <td>${livro.autor}</td>
          <td>${livro.genero_nome}</td>
          <td>R$ ${livro.preco}</td>
          <td><img src="${livro.imagem_url}" alt="${livro.titulo}" style="height: 50px;" /></td>
          <td>
            <button class="btn visualizar">Visualizar</button>
            <button class="btn editar">Editar</button>
            <button class="btn excluir">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      adicionarEventosTabela();
    }
  } catch (error) {
    alert("Erro ao carregar livros.");
  } finally {
  }
}

function adicionarEventosTabela() {
  console.log("🔧 adicionando eventos de editar/excluir...");
  tbody.querySelectorAll(".btn.excluir").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const btnExcluir = e.target;

      const row = e.target.closest("tr");
      const bookId = row.querySelector("td").textContent.trim();

      abrirModalConfirmacaoExclusao(bookId);
    });
  });

  document.querySelectorAll(".btn.editar").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const btnEditar = e.target;
      const row = btnEditar.closest("tr");
      const bookId = row.querySelector("td").textContent.trim();

      try {
        btnEditar.classList.add("loading");

        const response = await getBookById(bookId);
        if (response.status === "success") {
          const livro = response.data;
          document.getElementById("titulo").value = livro.titulo;
          document.getElementById("autor").value = livro.autor;
          document.getElementById("genero").value = livro.genero_id;
          document.getElementById("preco").value = livro.preco;
          document.getElementById("editora").value = livro.editora_id;
          document.getElementById("descricao").value = livro.descricao;
          document.getElementById("imagem_url").value = livro.imagem_url || "";

          livroEmEdicaoId = livro.id;
          btnSalvar.textContent = "ATUALIZAR";
          modalTitulo.textContent = "Editar Livro";
          abrirModal();
        } else {
          alert("Livro não encontrado.");
        }
      } catch (error) {
        alert("Erro ao carregar dados do livro.");
      } finally {
        btnEditar.classList.remove("loading");
      }
    });
  });

  tbody.querySelectorAll(".btn.visualizar").forEach((button) => {
    button.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      const bookId = row.querySelector("td").textContent.trim();
      window.location.href = `detalhes-livro.html?id=${bookId}`;
    });
  });
}

formLivro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const autor = document.getElementById("autor").value.trim();
  const genero_id = document.getElementById("genero").value;
  const preco = document.getElementById("preco").value.trim();
  const editora_id = document.getElementById("editora").value;
  const descricao = document.getElementById("descricao").value.trim();
  const imagem_url = document.getElementById("imagem_url").value.trim();

  if (!titulo || !autor || !genero_id || !preco || !editora_id || !descricao || !imagem_url) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  btnSalvar.classList.add("loading");
  btnSalvar.innerHTML = livroEmEdicaoId ? "Atualizando..." : "Salvando...";

  try {
    if (livroEmEdicaoId) {
      await updateBook(
        livroEmEdicaoId,
        titulo,
        autor,
        genero_id,
        preco,
        editora_id,
        descricao,
        imagem_url
      );
    } else {
      await createBook(titulo, autor, genero_id, preco, editora_id, descricao, imagem_url);
    }

    await carregarLivros();
    fecharModal();
    mostrarModalSucesso();
  } catch (error) {
    alert("Erro ao salvar livro. Tente novamente!");
    console.error(error);
  } finally {
    btnSalvar.classList.remove("loading");
    btnSalvar.innerHTML = livroEmEdicaoId ? "ATUALIZAR" : "SALVAR";
  }
});

document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    carregarLivros();
    carregarEditoras();
  }
});

btnConfirmarExclusao.addEventListener("click", async () => {
  if (!livroParaExcluirId) return;

  btnConfirmarExclusao.classList.add("loading");

  try {
    await deleteBook(livroParaExcluirId);
    await carregarLivros();
    mostrarModalSucessoExclusao();
  } catch (error) {
    alert("Erro ao excluir o livro: " + error.message);
  } finally {
    fecharModalConfirmacaoExclusao();
    btnConfirmarExclusao.classList.remove("loading");
  }
});

btnCancelarExclusao.addEventListener("click", () => {
  fecharModalConfirmacaoExclusao();
});
