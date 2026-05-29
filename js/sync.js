/**
 * Módulo de Sincronização
 * Gerencia fila de sincronização, retries e conflitos
 */

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.retryDelay = 5000; // 5 segundos
    this.maxRetries = 3;
  }

  /**
   * Inicia o gerenciador de sincronização
   */
  start() {
    // Verifica conectividade periodicamente
    this.syncInterval = setInterval(() => {
      this.syncIfOnline();
    }, this.retryDelay);

    // Tenta sincronizar imediatamente se online
    this.syncIfOnline();

    console.log("SyncManager iniciado");
  }

  /**
   * Para o gerenciador de sincronização
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log("SyncManager parado");
  }

  /**
   * Sincroniza se estiver online
   */
  async syncIfOnline() {
    if (Validators.isOnline() && !this.isSyncing) {
      await this.sync();
    }
  }

  /**
   * Executa sincronização completa
   */
  async sync() {
    if (this.isSyncing) {
      console.log("Sincronização já em andamento");
      return;
    }

    this.isSyncing = true;

    try {
      // Obtém itens pendentes
      const pendingItems = await db.getPendingSyncItems();

      if (pendingItems.length === 0) {
        console.log("Nenhum item pendente para sincronizar");
        this.isSyncing = false;
        return;
      }

      console.log(`Sincronizando ${pendingItems.length} itens`);

      // Processa cada item
      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }

      // Atualiza UI após sincronização
      if (typeof ui !== "undefined") {
        await ui.updateDashboard();
        await ui.updateList();
      }

      db.addLog("sync", "success", `Sincronização concluída: ${pendingItems.length} itens`);
    } catch (error) {
      console.error("Erro durante sincronização:", error);
      db.addLog("sync", "error", `Erro: ${error.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Processa um item da fila de sincronização
   */
  async processSyncItem(queueItem) {
    try {
      // Se atingiu número máximo de tentativas
      if (queueItem.tentativas >= this.maxRetries) {
        await db.updateSyncQueueItem(queueItem.id, {
          status: "falha",
          erro: "Número máximo de tentativas atingido",
        });

        db.addLog(
          "processSyncItem",
          "error",
          `Item ${queueItem.atendimentoId} falhou após ${this.maxRetries} tentativas`
        );

        return;
      }

      // Executa operação de sincronização
      let resultado;

      if (queueItem.operacao === "create") {
        resultado = await api.createAtendimento(queueItem.atendimento);
      } else if (queueItem.operacao === "update") {
        resultado = await api.updateAtendimento(queueItem.atendimentoId, queueItem.atendimento);
      }

      // Se sucesso, atualiza status
      if (resultado && resultado.id) {
        const atendimentoId = resultado.id || queueItem.atendimentoId;
        await db.updateAtendimentoStatus(atendimentoId, "sincronizado");
        await db.removeSyncQueueItem(queueItem.id);

        db.addLog(
          "processSyncItem",
          "success",
          `Item ${atendimentoId} sincronizado com sucesso`
        );
      }
    } catch (error) {
      // Incrementa tentativas e agenda próxima tentativa
      const proximaTentativa = queueItem.tentativas + 1;
      const delay = Validators.calculateRetryDelay(proximaTentativa);

      await db.updateSyncQueueItem(queueItem.id, {
        tentativas: proximaTentativa,
        dataProximaTentativa: new Date(Date.now() + delay).toISOString(),
        erro: error.message,
      });

      db.addLog(
        "processSyncItem",
        "error",
        `Tentativa ${proximaTentativa} falhou para ${queueItem.atendimentoId}: ${error.message}`
      );

      console.error(`Erro ao sincronizar ${queueItem.atendimentoId}:`, error);

      if (typeof ui !== "undefined") {
        ui.showError(`Erro ao sincronizar atendimento ${queueItem.atendimentoId}: ${error.message}`);
      }
    }
  }

  /**
   * Obtém status da fila de sincronização
   */
  async getSyncStatus() {
    const allAtendimentos = await db.getAllAtendimentos();
    const pendentes = await db.getAtendimentosByStatus("pendente");
    const sincronizados = await db.getAtendimentosByStatus("sincronizado");

    const pendingQueue = await db.getPendingSyncItems();

    return {
      total: allAtendimentos.length,
      sincronizados: sincronizados.length,
      pendentes: pendentes.length,
      filaSync: pendingQueue.length,
      isOnline: Validators.isOnline(),
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Força sincronização manual
   */
  async forceSyncNow() {
    console.log("Sincronização forçada solicitada");
    await this.sync();
  }
}

// Exporta instância única
const syncManager = new SyncManager();
