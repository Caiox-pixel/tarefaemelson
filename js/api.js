/**
 * Módulo de API
 * Gerencia comunicação com Supabase
 */

class APIManager {
  constructor() {
    assertSupabaseConfigured();
  }

  async createAtendimento(atendimento) {
    const { data, error } = await supabaseClient.from("atendimentos").insert([
      {
        id: atendimento.id,
        nome: atendimento.nome,
        cpf: atendimento.cpf,
        idade: atendimento.idade,
        contato: atendimento.contato,
        tipoProblema: atendimento.tipoProblema,
        descricao: atendimento.descricao,
        data: atendimento.data,
        status: atendimento.status || "pendente",
        hash: atendimento.hash,
        dataSync: atendimento.dataSync || new Date().toISOString(),
      },
    ]);

    if (error) {
      throw error;
    }

    return data[0];
  }

  async updateAtendimento(id, atendimento) {
    const { data, error } = await supabaseClient
      .from("atendimentos")
      .update({
        nome: atendimento.nome,
        cpf: atendimento.cpf,
        idade: atendimento.idade,
        contato: atendimento.contato,
        tipoProblema: atendimento.tipoProblema,
        descricao: atendimento.descricao,
        data: atendimento.data,
        status: atendimento.status,
        hash: atendimento.hash,
        dataSync: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    return data[0];
  }

  async getAllAtendimentos() {
    const { data, error } = await supabaseClient.from("atendimentos").select("*");

    if (error) {
      throw error;
    }

    return data;
  }

  async searchAtendimentosByNome(nome) {
    const query = nome.trim();
    if (!query) {
      return [];
    }

    const { data, error } = await supabaseClient
      .from("atendimentos")
      .select("*")
      .ilike("nome", `%${query}%`)
      .order("data", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async syncBatch(atendimentos) {
    const registros = atendimentos.map((atendimento) => ({
      id: atendimento.id,
      nome: atendimento.nome,
      cpf: atendimento.cpf,
      idade: atendimento.idade,
      contato: atendimento.contato,
      tipoProblema: atendimento.tipoProblema,
      descricao: atendimento.descricao,
      data: atendimento.data,
      status: atendimento.status || "pendente",
      hash: atendimento.hash,
      dataSync: new Date().toISOString(),
    }));

    const { data, error } = await supabaseClient
      .from("atendimentos")
      .upsert(registros, { onConflict: ["id"] });

    if (error) {
      throw error;
    }

    return data;
  }

  async checkConnectivity() {
    try {
      const { error } = await supabaseClient.from("atendimentos").select("id").limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  async simulateSync(atendimentos) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          sincronizados: atendimentos.length,
          erros: [],
          timestamp: new Date().toISOString(),
        });
      }, 1000);
    });
  }
}

const api = new APIManager();
