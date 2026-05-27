/**
 * Service Worker - Funcionalidade Offline
 * Implementa cache-first strategy para suporte offline completo
 */

const CACHE_NAME = "atendimentos-cache-v1";
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
  "./js/api.js",
  "./js/sync.js",
  "./js/ui.js",
  "./js/validators.js",
  "./manifest.json",
];

const API_CACHE_NAME = "atendimentos-api-cache-v1";
const RUNTIME_CACHE_NAME = "atendimentos-runtime-cache-v1";

/**
 * Evento de Instalação
 * Faz cache dos arquivos essenciais
 */
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Instalando...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Cache aberto");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log("[ServiceWorker] Arquivos em cache");
        // Força a ativação
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[ServiceWorker] Erro durante install:", error);
      })
  );
});

/**
 * Evento de Ativação
 * Limpa caches antigos
 */
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Ativando...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log("[ServiceWorker] Deletando cache antigo:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

/**
 * Evento de Fetch
 * Implementa estratégia cache-first com fallback para rede
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições para chrome extensions
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Estratégia para requisições GET
  if (request.method === "GET") {
    // Para API calls - Network-first strategy
    if (url.pathname.includes("/api/")) {
      event.respondWith(networkFirstStrategy(request));
      return;
    }

    // Para arquivos estáticos - Cache-first strategy
    if (
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".json") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".ico")
    ) {
      event.respondWith(cacheFirstStrategy(request));
      return;
    }

    // Para outras requisições - Cache-first com fallback
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Strategy: Cache-first com network fallback
 */
function cacheFirstStrategy(request) {
  return caches
    .match(request)
    .then((response) => {
      if (response) {
        return response;
      }

      // Requisição pela rede
      return fetch(request)
        .then((response) => {
          // Não cachea responses de erro
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }

          // Clona a response antes de cacheá-la
          const responseToCache = response.clone();
          const cacheName =
            request.url.includes("/api/") ? API_CACHE_NAME : RUNTIME_CACHE_NAME;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Se falhar e é uma página, retorna page offline
          if (request.destination === "document") {
            return caches.match("./index.html");
          }
          return new Response("Recurso não disponível offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    });
}

/**
 * Strategy: Network-first com cache fallback
 * Melhor para API calls onde queremos dados frescos quando possível
 */
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }

      // Cachea a response bem-sucedida
      const responseToCache = response.clone();
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache);
      });

      return response;
    })
    .catch(() => {
      // Fallback para cache
      return caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return new Response("Sem conexão e sem dados em cache", {
          status: 503,
          statusText: "Service Unavailable",
        });
      });
    });
}

/**
 * Mensagens de controle desde a aplicação
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(cacheNames.map((cache) => caches.delete(cache)));
      });
  }
});

console.log("[ServiceWorker] Carregado e pronto");