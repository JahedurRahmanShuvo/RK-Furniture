import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupMockApiInterceptor } from './mockApi.ts';

// Initialize the API fetch interceptor for offline / Netlify / Vercel static environments support
setupMockApiInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
