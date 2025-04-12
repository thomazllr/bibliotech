const API_BASE = "/bibliotech/api/exemplo.php";

export async function buscarExemplos() {
  try {
    console.log("📡 Fazendo requisição GET para:", API_BASE);

    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Erro ao buscar dados");

    const data = await res.json();
    console.log("✅ Dados recebidos:", data);

    return data;
  } catch (err) {
    console.error("❌ Erro em buscarExemplos:", err);
    return [];
  }
}

export async function cadastrarExemplo(nome) {
  try {
    console.log("📤 Enviando POST com nome:", nome);

    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.erro || "Erro ao cadastrar");
    }

    console.log("✅ Exemplo cadastrado:", data);
    return data;
  } catch (err) {
    console.error("❌ Erro em cadastrarExemplo:", err);
    return null;
  }
}
