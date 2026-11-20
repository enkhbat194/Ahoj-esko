import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

registerSW({ immediate: true });
const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing');
const root = createRoot(container);

// Keep the preview output free of Firebase, backend or paid Gemini imports.
// The actual production App module is only imported in non-preview builds.
if (import.meta.env.VITE_IPHONE_PREVIEW === 'true') {
  void import('./IphonePreview').then(({ IphonePreview }) => root.render(<IphonePreview />));
} else {
  void import('./App').then(({ default: App }) => root.render(<App />));
}
