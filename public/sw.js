self.addEventListener('install', () => {
  console.log('[Rotix SW] Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Rotix SW] Service Worker ativado');

  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener('push', (event) => {
  console.log('[Rotix SW] Push recebido');

  let data = {
    type: 'NEW_DELIVERY',
    title: 'Rotix',
    body: 'Você recebeu uma nova notificação.',
    url: '/courier',
  };

  try {
    if (event.data) {
      data = {
        ...data,
        ...event.data.json(),
      };
    }
  } catch (error) {
    console.error(
      '[Rotix SW] Erro ao interpretar payload:',
      error
    );
  }

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        client.postMessage({
          type: data.type,
          deliveryId: data.deliveryId,
        });
      }

      if (data.type === 'NEW_DELIVERY') {
        await self.registration.showNotification(data.title, {
          body: data.body,
          icon: '/ico android.png',
          badge: '/ico android.png',
          data: {
            url: data.url || '/courier',
          },
        });
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Rotix SW] Notificação clicada');

  event.notification.close();

  const targetUrl =
    event.notification.data?.url || '/courier';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if (
          client.url.includes('/courier') &&
          'focus' in client
        ) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});