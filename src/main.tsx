import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/anton/latin-400.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/public-sans/wght.css';
import '@/styles/fonts-hk.css';
import '@/styles/index.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
