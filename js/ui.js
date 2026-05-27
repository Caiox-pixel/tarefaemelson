/**
 * Módulo de Interface do Usuário
 * Gerencia atualização de elementos DOM
 */

class UIManager {
  constructor() {
    this.elements = {
      nome: document.getElementById("nome"),
      descricao: document.getElementById("descricao"),
      btnSalvar: document.getElementById("salvar"),
      btnSincronizar: document.getElementById("sincronizar"),
      lista: document.getElementById("lista"),
      total: document.getElementById("total"),
      pendentes: document.getElementById("pendentes"),
      sincronizados: document.getElementById("sincronizados"),
      erros: document.getElementById("erros"),
      statusConexao: document.getElementById("statusConexao"),
      statusSincronizacao: document.getElementById("statusSincronizacao"),
    };

    this.setupEventListeners();
    this.setupOnlineOfflineListeners();
  }

  /**
   * Configura listeners de eventos
   */
  setupEventListeners() {
    this.elements.btnSalvar?.addEventListener("click", () => this.handleSaveAtendimento());

    this.elements.btnSincronizar?.addEventListener("click", () => this.handleForceSyncNow());

    // Detecta input no campo de nome
    this.elements.nome?.addEventListener("input", () => this.clearError());

    // Detecta input no campo de descrição
    this.elements.descricao?.addEventListener("input", () => this.clearError());
  }

  /**
   * Configura listeners para online/offline
   */
  setupOnlineOfflineListeners() {
    window.addEventListener("online", () => {
      this.updateConnectionStatus(true);
      syncManager.syncIfOnline();
    });

    window.addEventListener("offline", () => {
      this.updateConnectionStatus(false);
    });

    // Atualiza status inicial
    this.updateConnectionStatus(Validators.isOnline());
  }

  /**
   * Atualiza status de conexão na UI
   */
  updateConnectionStatus(isOnline) {
    const statusEl = this.elements.statusConexao;
    if (statusEl) {
      statusEl.className = isOnline ? "status-online" : "status-offline";
      statusEl.innerHTML = isOnline
        ? '<span class="indicator"></span> Online'
        : '<span class="indicator"></span> Offline';
    }

    console.log(isOnline ? "Conexão restaurada" : "Conexão perdida");
  }

  /**
   * Manipula salvamento de atendimento
   */
  async handleSaveAtendimento() {
    const nome = this.elements.nome?.value?.trim();
    const descricao = this.elements.descricao?.value?.trim();

    // Validação
    const validation = Validators.validateAtendimento({ nome, descricao });

    if (!validation.valid) {
      this.showError(validation.errors.join("\n"));
      return;
    }

    try {
      // Obtém atendimentos existentes para verificar duplicatas
      const existentes = await db.getAllAtendimentos();

      const novoAtendimento = {
        id: Validators.generateId(),
        nome: nome,
        descricao: descricao,
        data: Validators.getCurrentISODate(),
        status: "pendente",
        hash: "",
      };

      // Verifica duplicata
      const duplicateCheck = await Validators.checkDuplicate(novoAtendimento, existentes);

      if (duplicateCheck.isDuplicate) {
        this.showError(`Atendimento duplicado! Já existe um registro similar com ID: ${duplicateCheck.existingId}`);
        return;
      }

      novoAtendimento.hash = duplicateCheck.hash;

      // Salva no banco de dados local
      await db.saveAtendimento(novoAtendimento);

      // Adiciona o registro à fila de sincronização local
      await db.addToSyncQueue(novoAtendimento, "create");

      // Limpa formulário
      this.elements.nome.value = "";
      this.elements.descricao.value = "";
      this.clearError();

      // Atualiza UI local imediatamente
      await this.updateDashboard();
      await this.updateList();

      // Tenta sincronizar com Supabase se houver conexão
      if (Validators.isOnline()) {
        await syncManager.syncIfOnline();
      }
    } catch (error) {
      this.showError(`Erro ao salvar atendimento: ${error.message}`);
      db.addLog("handleSaveAtendimento", "error", error.message);
    }
  }

  /**
   * Manipula sincronização forçada
   */
  async handleForceSyncNow() {
    if (!Validators.isOnline()) {
      this.showError("Sem conexão com internet. Sincronização será feita quando conectado.");
      return;
    }

    try {
      this.elements.btnSincronizar.disabled = true;
      this.elements.btnSincronizar.textContent = "Sincronizando...";

      await syncManager.forceSyncNow();

      await this.updateDashboard();
      await this.updateList();

      this.showSuccess("Sincronização concluída!");
    } catch (error) {
      this.showError(`Erro ao sincronizar: ${error.message}`);
    } finally {
      this.elements.btnSincronizar.disabled = false;
      this.elements.btnSincronizar.textContent = "Sincronizar Agora";
    }
  }

  /**
   * Atualiza dashboard com estatísticas
   */
  async updateDashboard() {
    try {
      const status = await syncManager.getSyncStatus();

      if (this.elements.total) {
        this.elements.total.textContent = status.total;
      }

      if (this.elements.pendentes) {
        this.elements.pendentes.textContent = status.pendentes;
      }

      if (this.elements.sincronizados) {
        this.elements.sincronizados.textContent = status.sincronizados;
      }

      if (this.elements.erros) {
        const pendingQueue = await db.getPendingSyncItems();
        const errosCount = pendingQueue.filter((item) => item.status === "falha").length;
        this.elements.erros.textContent = errosCount;
      }

      // Atualiza status de sincronização
      this.updateSyncStatus(status);
    } catch (error) {
      console.error("Erro ao atualizar dashboard:", error);
    }
  }

  /**
   * Atualiza status de sincronização
   */
  updateSyncStatus(status) {
    const statusEl = this.elements.statusSincronizacao;
    if (statusEl) {
      if (status.isSyncing) {
        statusEl.className = "status-syncing";
        statusEl.innerHTML = '<span class="spinner"></span> Sincronizando...';
      } else if (status.pendentes > 0) {
        statusEl.className = "status-pending";
        statusEl.innerHTML = `<span class="indicator"></span> ${status.pendentes} pendente(s)`;
      } else {
        statusEl.className = "status-synced";
        statusEl.innerHTML = '<span class="indicator"></span> Tudo sincronizado';
      }
    }
  }

  /**
   * Atualiza lista de atendimentos
   */
  async updateList() {
    try {
      const atendimentos = await db.getAllAtendimentos();

      if (!this.elements.lista) {
        return;
      }

      if (atendimentos.length === 0) {
        this.elements.lista.innerHTML = '<p class="vazio">Nenhum atendimento registrado.</p>';
        return;
      }

      // Ordena por data decrescente
      atendimentos.sort((a, b) => new Date(b.data) - new Date(a.data));

      this.elements.lista.innerHTML = atendimentos
        .map(
          (item) => `
        <div class="item ${item.status}">
          <div class="item-header">
            <h4>${this.escapeHtml(item.nome)}</h4>
            <span class="status-badge ${item.status}">${item.status}</span>
          </div>
          <p class="descricao">${this.escapeHtml(item.descricao)}</p>
          <small class="data">${Validators.formatDate(item.data)}</small>
          ${item.dataSync ? `<small class="data-sync">Sincronizado: ${Validators.formatDate(item.dataSync)}</small>` : ""}
        </div>
      `
        )
        .join("");
    } catch (error) {
      console.error("Erro ao atualizar lista:", error);
      if (this.elements.lista) {
        this.elements.lista.innerHTML = `<p class="erro">Erro ao carregar atendimentos: ${error.message}</p>`;
      }
    }
  }

  /**
   * Escapa caracteres HTML para evitar XSS
   */
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Mostra mensagem de erro
   */
  showError(message) {
    const errorContainer = document.getElementById("mensagem-erro");
    if (errorContainer) {
      errorContainer.style.display = "block";
      errorContainer.textContent = message;
      errorContainer.className = "mensagem erro";
    }
    console.error("Erro:", message);
  }

  /**
   * Mostra mensagem de sucesso
   */
  showSuccess(message) {
    const errorContainer = document.getElementById("mensagem-erro");
    if (errorContainer) {
      errorContainer.style.display = "block";
      errorContainer.textContent = message;
      errorContainer.className = "mensagem sucesso";

      setTimeout(() => {
        errorContainer.style.display = "none";
      }, 3000);
    }
  }

  /**
   * Limpa mensagem de erro
   */
  clearError() {
    const errorContainer = document.getElementById("mensagem-erro");
    if (errorContainer) {
      errorContainer.style.display = "none";
      errorContainer.textContent = "";
    }
  }

  /**
   * Inicializa UI e carrega dados
   */
  async init() {
    try {
      console.log("Inicializando UIManager");
      await this.updateDashboard();
      await this.updateList();
    } catch (error) {
      console.error("Erro ao inicializar UI:", error);
      this.showError(`Erro ao inicializar: ${error.message}`);
    }
  }
}

// Exporta instância única
const ui = new UIManager();
