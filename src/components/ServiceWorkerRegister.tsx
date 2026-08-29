'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[Rotix] Service Worker não suportado');
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log(
          '[Rotix] Service Worker registrado:',
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          '[Rotix] Erro ao registrar Service Worker:',
          error
        );
      });
  }, []);

  return null;
}