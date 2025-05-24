import { API_BASE } from "../config.js";

export async function finalizarPedido() {
  try {
    const response = await fetch(`${API_BASE}/pedido/finalizar`, {
      method: "POST",
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType?.includes("application/json")) {
      const erroTexto = await response.text();
      throw new Error("Erro do servidor: " + erroTexto.slice(0, 100));
    }

    const data = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message);
    }

    return data;
  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);
    throw error;
  }
}

export async function buscarPedidosDoUsuario() {
  try {
    const response = await fetch(`${API_BASE}/pedido`);

    if (!response.ok) {
      throw new Error("Erro ao buscar os pedidos.");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao obter pedidos:", error);
    throw error;
  }
}

export async function buscarPedidoCompletoPorId(pedidoId) {
  try {
    const response = await fetch(`${API_BASE}/pedido/${pedidoId}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhes do pedido.");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao buscar pedido completo:", error);
    throw error;
  }
}

export async function confirmarPedido() {
  try {
    const response = await fetch(`${API_BASE}/pedido/confirmar`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "Erro ao confirmar pedido.");
    }

    return data;
  } catch (error) {
    console.error("Erro ao confirmar pedido:", error);
    throw error;
  }
}
