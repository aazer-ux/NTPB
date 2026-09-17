import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Material Symbols are loaded via ligatures of ASCII letters ("verified",
// "more_vert", ...). Until the font is ready, icons would render as raw text;
// the CSS keeps them at opacity 0 and we reveal them once the font is loaded.
const MS_FONT = '24px "Material Symbols Outlined"';
const MS_LIGATURE_SAMPLE = 'verified menu close search arrow_back list_alt more_vert home payments';

function revealMaterialIcons() {
  document.documentElement.classList.add('ms-icons-ready');
}

function initMaterialIconFont() {
  // Safety net: never leave the icons invisible if the font never resolves.
  window.setTimeout(revealMaterialIcons, 5000);

  if (typeof document.fonts === 'undefined') {
    revealMaterialIcons();
    return;
  }

  Promise.all([document.fonts.load(MS_FONT, MS_LIGATURE_SAMPLE), document.fonts.ready])
    .then(revealMaterialIcons)
    .catch(revealMaterialIcons);
}

initMaterialIconFont();

// PWA : enregistre le service worker (généré par vite-plugin-pwa) en
// production uniquement. L'application devient installable et l'interface
// reste utilisable hors-ligne (les données, elles, exigent une connexion).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({immediate: true});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
