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

    if (!atendimento.cpf || atendimento.cpf.trim() === "") {
      errors.push("CPF é obrigatório");
    } else {
      const cpfDigits = atendimento.cpf.replace(/\D/g, "");
      if (cpfDigits.length !== 11) {
        errors.push("CPF deve conter 11 dígitos");
      }
    }

    if (!atendimento.idade || atendimento.idade.trim() === "") {
      errors.push("Idade é obrigatória");
    } else {
      const idadeNumero = Number(atendimento.idade);
      if (!Number.isInteger(idadeNumero) || idadeNumero <= 0 || idadeNumero > 120) {
        errors.push("Idade deve ser um número inteiro válido entre 1 e 120");
      }
    }

    if (!atendimento.contato || atendimento.contato.trim() === "") {
      errors.push("Meio de contato é obrigatório");
    }

    if (!atendimento.tipoProblema || atendimento.tipoProblema.trim() === "") {
      errors.push("Tipo de problema é obrigatório");
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
    const dataString = `${atendimento.nome}|${atendimento.cpf || ""}|${atendimento.idade || ""}|${atendimento.contato || ""}|${atendimento.tipoProblema || ""}|${atendimento.descricao || ""}`;
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
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  static isValidUuid(value) {
    return (
      typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
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
