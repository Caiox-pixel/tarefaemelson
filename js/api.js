/**
 * Módulo de API
 * Gerencia comunicação com Supabase
 */

class APIManager {
  constructor() {
    this.isSupabaseAvailable = isSupabaseConfigured();
    if (!this.isSupabaseAvailable) {
      console.warn("[API] Supabase não disponível. App funcionará em modo offline.");
    } else {
      console.log("[API] Supabase conectado com sucesso!");
    }
  }

  async createAtendimento(atendimento) {
    if (!this.isSupabaseAvailable) {
      console.log("[API] Operação offline - atendimento armazenado localmente");
      return { id: atendimento.id, status: "offline" };
    }

    if (!supabaseClient) return { id: atendimento.id, status: "offline" };

    const payload = {
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
    };

    if (Validators.isValidUuid(atendimento.id)) {
      payload.id = atendimento.id;
    }

    const { data, error } = await supabaseClient.from("atendimentos").insert([payload]);

    if (error) {
      throw error;
    }

    const row = data[0];
    if (row && row.id && row.id !== atendimento.id) {
      await db.replaceAtendimentoId(atendimento.id, row.id);
    }

    return row;
  }

  async updateAtendimento(id, atendimento) {
    if (!this.isSupabaseAvailable) {
      return { id: id, status: "offline" };
    }

    if (!supabaseClient) return { id: id, status: "offline" };

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
    if (!this.isSupabaseAvailable) {
      return [];
    }

    if (!supabaseClient) return [];

    const { data, error } = await supabaseClient.from("atendimentos").select("*");

    if (error) {
      throw error;
    }

    return data;
  }

  async searchAtendimentosByNome(nome) {
    if (!this.isSupabaseAvailable) {
      return [];
    }

    if (!supabaseClient) return [];

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
    if (!this.isSupabaseAvailable) {
      console.log("[API] Sincronização offline - dados armazenados localmente");
      return atendimentos;
    }

    if (!supabaseClient) return atendimentos;

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
    if (!this.isSupabaseAvailable || !supabaseClient) {
      return false;
    }

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
