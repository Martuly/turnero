import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './index.css';

import keycloak from './auth/keycloak';

keycloak
  .init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error) => {
    console.error('Error iniciando Keycloak:', error);
  });