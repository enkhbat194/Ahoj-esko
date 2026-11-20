import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { IphonePreview } from './IphonePreview';
import './index.css';

// This source is on the dedicated UNMERGED Render preview branch.
// The production App is not imported, including dynamically, so Vite's
// generated dist does not bundle Firebase/Drive/Gemini server UI modules.
registerSW({ immediate: true });

const container = document.getElementById('root');
if (!container) throw new Error('Root element is missing');
createRoot(container).render(<IphonePreview />);
