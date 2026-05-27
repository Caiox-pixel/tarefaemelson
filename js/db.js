/**
 * Módulo de Persistência Local com IndexedDB
 * Gerencia armazenamento de atendimentos e fila de sincronização
 */

class DatabaseManager {
  constructor() {
    this.dbName = "AtendimentosDB";
    this.version = 1;
    this.db = null;
  }

  /**
   * Inicializa a base de dados IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Erro ao abrir banco de dados");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Banco de dados inicializado com sucesso");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar object store para atendimentos
        if (!db.objectStoreNames.contains("atendimentos")) {
          const storeAtendimentos = db.createObjectStore("atendimentos", {
            keyPath: "id",
          });
          storeAtendimentos.createIndex("status", "status", { unique: false });
          storeAtendimentos.createIndex("dataSync", "dataSync", {
            unique: false,
          });
          storeAtendimentos.createIndex("hash", "hash", { unique: true });
        }

        // Criar object store para fila de sincronização
        if (!db.objectStoreNames.contains("syncQueue")) {
          const storeSyncQueue = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
          storeSyncQueue.createIndex("status", "status", { unique: false });
          storeSyncQueue.createIndex("tentativas", "tentativas", {
            unique: false,
          });
        }

        // Criar object store para logs
        if (!db.objectStoreNames.contains("logs")) {
          db.createObjectStore("logs", { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  /**
   * Salva um novo atendimento
   */
  async saveAtendimento(atendimento) {
    const transaction = this.db.transaction(["atendimentos"], "readwrite");
    const store = transaction.objectStore("atendimentos");

    return new Promise((resolve, reject) => {
      const request = store.add(atendimento);

      request.onsuccess = () => {
        this.addLog("saveAtendimento", "success", `Atendimento ${atendimento.id} salvo`);
        resolve(atendimento);
      };

      request.onerror = () => {
        this.addLog("saveAtendimento", "error", `Erro ao salvar atendimento: ${request.error}`);
        reject(request.error);
      };
    });
  }

  /**
   * Obtém todos os atendimentos
   */
  async getAllAtendimentos() {
    const transaction = this.db.transaction(["atendimentos"], "readonly");
    const store = transaction.objectStore("atendimentos");

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Obtém atendimentos por status
   */
  async getAtendimentosByStatus(status) {
    const transaction = this.db.transaction(["atendimentos"], "readonly");
    const store = transaction.objectStore("atendimentos");
    const index = store.index("status");

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Atualiza o status de um atendimento
   */
  async updateAtendimentoStatus(id, novoStatus) {
    const transaction = this.db.transaction(["atendimentos"], "readwrite");
    const store = transaction.objectStore("atendimentos");

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const atendimento = getRequest.result;
        if (atendimento) {
          atendimento.status = novoStatus;
          atendimento.dataSync = new Date().toISOString();

          const updateRequest = store.put(atendimento);

          updateRequest.onsuccess = () => {
            this.addLog("updateStatus", "success", `Status atualizado: ${id} -> ${novoStatus}`);
            resolve(atendimento);
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          reject(new Error("Atendimento não encontrado"));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Adiciona item à fila de sincronização
   */
  async addToSyncQueue(atendimento, operacao = "create") {
    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");

    const queueItem = {
      atendimentoId: atendimento.id,
      operacao: operacao,
      status: "pendente",
      tentativas: 0,
      maxTentativas: 3,
      dataCriacao: new Date().toISOString(),
      dataProximaTentativa: new Date().toISOString(),
      erro: null,
      atendimento: atendimento,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);

      request.onsuccess = () => {
        this.addLog("addToSyncQueue", "success", `Item adicionado à fila: ${atendimento.id}`);
        resolve(queueItem);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Obtém itens pendentes da fila de sincronização
   */
  async getPendingSyncItems() {
    const transaction = this.db.transaction(["syncQueue"], "readonly");
    const store = transaction.objectStore("syncQueue");
    const index = store.index("status");

    return new Promise((resolve, reject) => {
      const request = index.getAll("pendente");

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Atualiza item da fila de sincronização
   */
  async updateSyncQueueItem(id, updates) {
    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          Object.assign(item, updates);

          const updateRequest = store.put(item);

          updateRequest.onsuccess = () => {
            resolve(item);
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          reject(new Error("Item não encontrado na fila"));
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Remove item da fila de sincronização
   */
  async removeSyncQueueItem(id) {
    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        this.addLog("removeSyncQueueItem", "success", `Item removido da fila: ${id}`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Adiciona log de operação
   */
  async addLog(operacao, tipo, mensagem) {
    const transaction = this.db.transaction(["logs"], "readwrite");
    const store = transaction.objectStore("logs");

    const logEntry = {
      operacao: operacao,
      tipo: tipo,
      mensagem: mensagem,
      data: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(logEntry);

      request.onsuccess = () => {
        resolve(logEntry);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Obtém todos os logs
   */
  async getLogs() {
    const transaction = this.db.transaction(["logs"], "readonly");
    const store = transaction.objectStore("logs");

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Limpa todos os logs
   */
  async clearLogs() {
    const transaction = this.db.transaction(["logs"], "readwrite");
    const store = transaction.objectStore("logs");

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Exporta instância única
const db = new DatabaseManager();
