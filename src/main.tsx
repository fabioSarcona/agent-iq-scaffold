import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerPWA } from './lib/pwa'
import { I18nProvider } from '@/providers/I18nProvider'

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);

// Register PWA service worker in production
registerPWA();
