'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const refreshing = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return;
    }

    let activeRegistration: ServiceWorkerRegistration | undefined;

    const handleControllerChange = () => {
      if (refreshing.current) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker
      .register('/sw.js')
      .then((nextRegistration) => {
        activeRegistration = nextRegistration;
        setRegistration(nextRegistration);

        const showUpdate = () => {
          if (navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        };

        if (nextRegistration.waiting) {
          showUpdate();
        }

        nextRegistration.addEventListener('updatefound', () => {
          const installingWorker = nextRegistration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              showUpdate();
            }
          });
        });

        nextRegistration.update().catch((error: unknown) => {
          console.error('No se pudo comprobar si hay una actualización de Molva.', error);
        });
      })
      .catch((error: unknown) => {
        console.error('No se pudo registrar el service worker de Molva.', error);
      });

    return () => {
      if (activeRegistration) {
        activeRegistration.onupdatefound = null;
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateApp = async () => {
    setIsUpdating(true);

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      if (registration?.waiting) {
        refreshing.current = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return;
      }

      await registration?.unregister();
      window.location.reload();
    } catch (error: unknown) {
      console.error('No se pudo limpiar la caché de Molva.', error);
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-xl items-center gap-3 rounded-xl border border-cyan-400/30 bg-[#10141a]/95 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:inset-x-auto sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400">
        <RefreshCw className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-200">
        Hay una nueva actualización disponible.
      </p>
      <button
        type="button"
        onClick={updateApp}
        disabled={isUpdating}
        className="flex-shrink-0 rounded-lg bg-cyan-400 px-3 py-2 text-[11px] font-semibold text-black transition-colors hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
      >
        {isUpdating ? 'Actualizando…' : 'Limpiar caché'}
      </button>
      <button
        type="button"
        onClick={() => setUpdateAvailable(false)}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Cerrar aviso de actualización"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
