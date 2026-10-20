
const CACHE_NAME = "huella-zero-v2";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const archivo of ARCHIVOS) {
        const respuesta = await fetch(archivo, { cache: "reload" });

        if (!respuesta.ok) {
          throw new Error(
            "No se pudo guardar " + archivo +
            ". Estado HTTP: " + respuesta.status
          );
        }

        await cache.put(archivo, respuesta);
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) =>
            nombre.startsWith("huella-zero-") &&
            nombre !== CACHE_NAME
          )
          .map((nombre) => caches.delete(nombre))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((guardado) => {
      if (guardado) return guardado;

      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return Response.error();
      });
    })
  );
});

