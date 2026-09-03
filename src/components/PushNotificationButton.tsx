'use client';

import { useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);

    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);

    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationButton() {
    const [status, setStatus] = useState('Ativar notificacoes');

    const enableNotifications = async () => {
        try {
            setStatus('Ativando...');

            if (!('Notification' in window)) {
                setStatus('Nao suportado');
                return;
            }

            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setStatus('Permissao negada');
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            const existingSubscription =
                await registration.pushManager.getSubscription();

            const subscription =
                existingSubscription ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                    ),
                }));

            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error || 'Erro ao salvar assinatura'
                );
            }

            console.log('[Rotix] Push Subscription salva:', subscription);

            setStatus('Notificações ativadas');
        } catch (error) {
            console.error(
                '[Rotix] Erro ao ativar notificações:',
                error
            );

            setStatus('Erro ao ativar');
        }
    };

    return (
        <button
            type="button"
            onClick={enableNotifications}
            className="px-3 py-2 bg-[#002B5C] hover:bg-[#00234D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
        >
            {status}
        </button>
    );
}