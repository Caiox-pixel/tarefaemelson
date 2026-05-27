/**
 * Módulo de Validações e Utilitários
 * Trata validações, duplicatas e geração de hashes
 */

class Validators {
  /**
   * Valida dados do atendimento
   */
  static validateAtendimento(atendimento) {
    const errors = [];

    if (!atendimento.nome || atendimento.nome.trim() === "") {
      errors.push("Nome é obrigatório");
    }

    if (atendimento.nome && atendimento.nome.length < 3) {
      errors.push("Nome deve ter pelo menos 3 caracteres");
    }

    if (atendimento.nome && atendimento.nome.length > 100) {
      errors.push("Nome não pode ter mais de 100 caracteres");
    }

    if (!atendimento.descricao || atendimento.descricao.trim() === "") {
      errors.push("Descrição é obrigatória");
    }

    if (atendimento.descricao && atendimento.descricao.length < 5) {
      errors.push("Descrição deve ter pelo menos 5 caracteres");
    }

    if (atendimento.descricao && atendimento.descricao.length > 1000) {
      errors.push("Descrição não pode ter mais de 1000 caracteres");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Gera hash para detectar duplicatas
   */
  static async generateHash(atendimento) {
    const dataString = `${atendimento.nome}|${atendimento.descricao}|${atendimento.data}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  /**
   * Verifica se já existe atendimento com mesmo hash (duplicata)
   */
  static async checkDuplicate(novoAtendimento, atendimentosExistentes) {
    const novoHash = await this.generateHash(novoAtendimento);

    for (const existente of atendimentosExistentes) {
      if (existente.hash === novoHash) {
        return {
          isDuplicate: true,
          existingId: existente.id,
          hash: novoHash,
        };
      }
    }

    return {
      isDuplicate: false,
      hash: novoHash,
    };
  }

  /**
   * Formata data para exibição
   */
  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR");
  }

  /**
   * Formata data para ISO string
   */
  static getCurrentISODate() {
    return new Date().toISOString();
  }

  /**
   * Cria ID único
   */
  static generateId() {
    return Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Valida URL de API
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta se está online
   */
  static isOnline() {
    return navigator.onLine;
  }

  /**
   * Tempo aleatório para retry com backoff exponencial
   */
  static calculateRetryDelay(tentativas, maxDelay = 30000) {
    const delay = Math.min(1000 * Math.pow(2, tentativas), maxDelay);
    // Adiciona jitter para evitar thundering herd
    const jitter = Math.random() * delay * 0.1;
    return delay + jitter;
  }
}
