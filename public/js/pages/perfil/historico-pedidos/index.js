import { carregarHistoricoPedidos } from "./pedidos-service.js";


export async function initOrderHistory() {
  // Aqui você pode adicionar a lógica para inicializar o histórico de pedidos
  await carregarHistoricoPedidos();
}