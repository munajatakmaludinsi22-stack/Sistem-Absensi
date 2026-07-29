import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ToastHost from './components/Toast.tsx';
import ConfirmModalHost from './components/ConfirmModal.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Host global untuk notifikasi toast & modal konfirmasi di seluruh halaman */}
    <ToastHost />
    <ConfirmModalHost />
  </StrictMode>,
);
