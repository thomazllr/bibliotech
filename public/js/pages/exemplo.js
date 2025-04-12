import { buscarExemplos, cadastrarExemplo } from "../api/exemplo.js";

const lista = document.getElementById("listaExemplos");
const btn = document.getElementById("btnCadastrar");
const input = document.getElementById("inputNome");

function renderizarExemplos(dados) {
  lista.innerHTML = "";
  dados.forEach((ex) => {
    const li = document.createElement("li");
    li.textContent = `${ex.id} - ${ex.nome}`;
    lista.appendChild(li);
  });
}

async function atualizarLista() {
  console.log("🔄 Chamando buscarExemplos()...");
  const exemplos = await buscarExemplos();
  console.log("📥 Exemplos recebidos:", exemplos);

  renderizarExemplos(exemplos);
}

btn.addEventListener("click", async () => {
  const nome = input.value.trim();
  console.log("🖊️ Nome digitado:", nome);

  if (!nome) return alert("Digite um nome");

  const res = await cadastrarExemplo(nome);
  console.log("📤 Resposta do cadastrarExemplo:", res);

  if (res?.exemplo) {
    input.value = "";
    atualizarLista();
  }
});

atualizarLista();
