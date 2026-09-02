import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const toastKapat = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((mesaj, tur = 'success', sure = 3000, key = null) => {
    const toastKey = key || `${tur}_${mesaj}`;

    setToasts((prev) => {
      // 1. Aynı key veya aynı mesaj/türde aktif bir toast var mı?
      const mevcutIndex = prev.findIndex((t) => t.key === toastKey);

      if (mevcutIndex !== -1) {
        const mevcutToast = prev[mevcutIndex];
        const yeniAdet = (mevcutToast.adet || 1) + 1;
        const yeniId = mevcutToast.id;

        // Önceki zamanlayıcıyı sıfırla ve yeniden başlat
        if (timersRef.current.has(yeniId)) {
          clearTimeout(timersRef.current.get(yeniId));
        }
        const timer = setTimeout(() => {
          toastKapat(yeniId);
        }, sure);
        timersRef.current.set(yeniId, timer);

        const guncelToasts = [...prev];
        guncelToasts[mevcutIndex] = {
          ...mevcutToast,
          mesaj, // Mesaj güncellenebilir (ör: yeni stok sayısı ile)
          adet: yeniAdet,
          sonGuncelleme: Date.now()
        };
        return guncelToasts;
      }

      // 2. Yeni Toast oluştur
      const id = Date.now() + Math.random();
      const timer = setTimeout(() => {
        toastKapat(id);
      }, sure);
      timersRef.current.set(id, timer);

      // Maksimum 4 toast göster, fazlasını eskisinden sil
      const yeniListe = [...prev, { id, key: toastKey, mesaj, tur, adet: 1, sonGuncelleme: Date.now() }];
      if (yeniListe.length > 4) {
        const silinecek = yeniListe.shift();
        if (silinecek && timersRef.current.has(silinecek.id)) {
          clearTimeout(timersRef.current.get(silinecek.id));
          timersRef.current.delete(silinecek.id);
        }
      }
      return yeniListe;
    });
  }, [toastKapat]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Bildirim Konteyneri (Sağ Üst) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let IkonBileseni = Check;

          if (toast.tur === 'error') {
            IkonBileseni = X;
          } else if (toast.tur === 'warning') {
            IkonBileseni = AlertTriangle;
          } else if (toast.tur === 'info') {
            IkonBileseni = Info;
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto p-3 bg-white dark:bg-[#16222F] border border-slate-200 dark:border-[#26334D] rounded-xl shadow-xl flex items-center gap-2.5 text-slate-800 dark:text-slate-100 transform transition-all duration-200 animate-in slide-in-from-top-2 font-sans"
            >
              <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <IkonBileseni size={12} strokeWidth={2.4} />
              </span>
              
              <div className="flex-1 text-xs font-bold leading-tight break-words flex items-center justify-between gap-2">
                <span>{toast.mesaj}</span>
                {toast.adet > 1 && (
                  <span
                    key={toast.sonGuncelleme}
                    className="px-1.5 py-0.5 text-[10px] font-black font-mono rounded bg-primary text-white shrink-0 animate-bounce"
                  >
                    ×{toast.adet}
                  </span>
                )}
              </div>

              <button
                onClick={() => toastKapat(toast.id)}
                className="text-zinc-400 hover:text-primary dark:hover:text-slate-100 font-mono text-xs font-bold cursor-pointer shrink-0 ml-1"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast, ToastProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
