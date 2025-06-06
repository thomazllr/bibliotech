import { API_BASE } from "../config.js";

// Verifica o status da sessão
export async function verificarSessao() {
  const response = await fetch(`${API_BASE}/session`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Erro ao verificar a sessão");
  }
  console.log(response);

  return response.json();
}

export async function logout() {
  const response = await fetch(`${API_BASE}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao realizar logout");
  }

  return response.json();
}
