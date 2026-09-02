// MediCore Dinamik API & SignalR Hub Yapılandırması
// Ortam değişkenleri tanımlıysa onları kullanır, aksi takdirde varsayılan localhost adresine yönlendirir.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5034/api';
export const API_BASE = API_URL;
export const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5034/hub/klinik';

export default {
  API_URL,
  API_BASE,
  HUB_URL
};
