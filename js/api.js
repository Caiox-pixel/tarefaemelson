/**
 * Módulo de API
 * Gerencia comunicação com o backend
 */

class APIManager {
  constructor(baseURL = "http://localhost:3000/api") {
    this.baseURL = baseURL;
    this.timeout = 10000; // 10 segundos
  }

  /**
   * Faz requisição HTTP com timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error("Requisição expirou (timeout)");
      }

      throw error;
    }
  }

  /**
   * Cria um novo atendimento no servidor
   */
  async createAtendimento(atendimento) {
    return this.fetchWithTimeout(`${this.baseURL}/atendimentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: atendimento.nome,
        descricao: atendimento.descricao,
        data: atendimento.data,
        clientId: atendimento.id,
      }),
    });
  }

  /**
   * Atualiza um atendimento no servidor
   */
  async updateAtendimento(id, atendimento) {
    return this.fetchWithTimeout(`${this.baseURL}/atendimentos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(atendimento),
    });
  }

  /**
   * Obtém todos os atendimentos do servidor
   */
  async getAllAtendimentos() {
    return this.fetchWithTimeout(`${this.baseURL}/atendimentos`);
  }

  /**
   * Sincroniza múltiplos atendimentos
   */
  async syncBatch(atendimentos) {
    return this.fetchWithTimeout(`${this.baseURL}/atendimentos/sync/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registros: atendimentos,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  /**
   * Verifica conectividade
   */
  async checkConnectivity() {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/health`, {
        method: "GET",
      });
      return response.status === "ok";
    } catch (error) {
      return false;
    }
  }

  /**
   * Simula resposta do backend (para testes offline)
   */
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

// Exporta instância única
const api = new APIManager();
