/**
 * App.js - Arquivo Principal da Aplicação
 * Inicializa o sistema de atendimentos offline
 */

// ============================================================================
// Função para limpar cache automaticamente
// ============================================================================

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) => {
      console.log(`[App] Limpando cache: ${cacheName}`);
      return caches.delete(cacheName);
    });
    await Promise.all(deletePromises);
    console.log("[App] Todos os caches foram limpos com sucesso");
    return true;
  } catch (error) {
    console.error("[App] Erro ao limpar caches:", error);
    return false;
  }
}

// Limpa caches antigos a cada inicialização
async function cleanOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const validCaches = ["atendimentos-cache-v1", "atendimentos-api-cache-v1", "atendimentos-runtime-cache-v1"];
    
    for (const cacheName of cacheNames) {
      if (!validCaches.includes(cacheName)) {
        console.log(`[App] Removendo cache obsoleto: ${cacheName}`);
        await caches.delete(cacheName);
      }
    }
  } catch (error) {
    console.error("[App] Erro ao limpar caches antigos:", error);
  }
}

// ============================================================================

async function initializeApp() {
  try {
    console.log("Iniciando Sistema de Atendimentos Offline...");

    // 0. Limpa caches antigos
    console.log("Etapa 0: Limpando caches obsoletos...");
    await cleanOldCaches();
    console.log("✓ Caches limpos");

    // 1. Inicializa banco de dados
    console.log("Etapa 1: Inicializando banco de dados...");
    await db.init();
    console.log("✓ Banco de dados inicializado");

    // 2. Registra Service Worker (para funcionalidade offline)
    if ("serviceWorker" in navigator) {
      console.log("Etapa 2: Registrando Service Worker...");
      try {
        const registration = await navigator.serviceWorker.register("service-worker.js", {
          scope: "/",
        });
        console.log("✓ Service Worker registrado:", registration);
      } catch (error) {
        console.error("✗ Erro ao registrar Service Worker:", error);
      }
    }

    // 3. Inicializa UI
    console.log("Etapa 3: Inicializando interface...");
    await ui.init();
    console.log("✓ Interface inicializada");

    // 4. Inicia gerenciador de sincronização
    console.log("Etapa 4: Iniciando sincronizador...");
    syncManager.start();
    console.log("✓ Sincronizador iniciado");

    // 5. Configura atualização periódica da UI
    setInterval(async () => {
      await ui.updateDashboard();
    }, 5000); // A cada 5 segundos

    console.log("✓ Aplicação iniciada com sucesso!");
    console.log("Status:", await syncManager.getSyncStatus());
  } catch (error) {
    console.error("✗ Erro crítico durante inicialização:", error);
    if (typeof ui !== "undefined") {
      ui.showError(`Erro ao inicializar aplicação: ${error.message}`);
    }
  }
}

// ============================================================================
// Listeners de Eventos Globais
// ============================================================================

// Detecta mudanças de conectividade
window.addEventListener("online", () => {
  console.log("Evento: Conexão restaurada");
  ui.updateConnectionStatus(true);
  syncManager.syncIfOnline();
});

window.addEventListener("offline", () => {
  console.log("Evento: Conexão perdida");
  ui.updateConnectionStatus(false);
});

// Trata erros não capturados
window.addEventListener("error", (event) => {
  console.error("Erro global não capturado:", event.error);
  db.addLog("globalError", "error", `${event.error?.message || event.message}`);
});

// Trata promise rejections não capturadas
window.addEventListener("unhandledrejection", (event) => {
  console.error("Promise rejection não capturada:", event.reason);
  db.addLog("unhandledRejection", "error", `${event.reason?.message || event.reason}`);
});

// ============================================================================
// Trata visibility change para otimizar performance
// ============================================================================

document.addEventListener("visibilitychange", async () => {
  if (document.hidden) {
    console.log("Aplicação em background");
    syncManager.stop();
  } else {
    console.log("Aplicação em foreground");
    syncManager.start();
    await ui.updateDashboard();
    await ui.updateList();
  }
});

// ============================================================================
// Inicia a Aplicação
// ============================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// ============================================================================
// Exports para debugging em console
// ============================================================================

window.appDebug = {
  db,
  api,
  sync: syncManager,
  ui,
  validators: Validators,
  async getStatus() {
    return await syncManager.getSyncStatus();
  },
  async getAllAtendimentos() {
    return await db.getAllAtendimentos();
  },
  async getPendingQueue() {
    return await db.getPendingSyncItems();
  },
  async getLogs() {
    return await db.getLogs();
  },
  async clearAllData() {
    // ⚠️ PERIGO: Limpa todos os dados
    if (confirm("Tem certeza que deseja deletar TODOS os dados da aplicação?")) {
      // Isso é apenas para debug, não recomendado em produção
      const allAtendimentos = await db.getAllAtendimentos();
      for (const atendimento of allAtendimentos) {
        // Aqui você deveria ter um método delete no db
        console.log("Seria deletado:", atendimento);
      }
    }
  },
  async clearCache() {
    // Limpa todo o cache do navegador
    if (confirm("Tem certeza que deseja limpar TODO o cache?")) {
      const success = await clearAllCaches();
      if (success) {
        console.log("✓ Cache limpo com sucesso. Recarregue a página para fazer download dos arquivos novos.");
        window.location.reload();
      }
    }
  },
};

console.log("Debug: Use window.appDebug para acessar funções de debugging");
console.log("Debug: Use window.appDebug.clearCache() para limpar o cache");
