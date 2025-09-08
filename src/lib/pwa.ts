import { logger } from './logger';

export function registerPWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('Service Worker registered', { scope: registration.scope });
        
        registration.addEventListener('updatefound', () => {
          logger.info('PWA update available');
          logger.event('pwa_update_available');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                logger.info('PWA updated, refresh recommended');
                // Optionally show update notification to user
              }
            });
          }
        });
      })
      .catch((error) => {
        logger.error('Service Worker registration failed', { error: error.message });
      });

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      logger.info('PWA install prompt shown');
      logger.event('pwa_install_prompt_shown');
    });

    // Listen for PWA installation
    window.addEventListener('appinstalled', () => {
      logger.info('PWA installed successfully');
      logger.event('pwa_installed');
    });
  }
}

export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}