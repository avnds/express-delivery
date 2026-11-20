# Rotix Express Delivery — Android
WebView Android apontando para https://express-delivery-sigma.vercel.app. O build de testes é criado pelo GitHub Actions e publicado em GitHub Releases como `rotix-express-delivery.apk`.

Limitações: requer internet; notificações push do Service Worker não funcionam em segundo plano no WebView; câmera/upload e GPS precisam de testes em aparelhos reais; o APK de debug não é apropriado para distribuição pública estável. Para produção, criar assinatura release persistente e validar os fluxos dos três perfis.
