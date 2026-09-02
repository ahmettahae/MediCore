import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'medicore_bildirimler';

export const NotificationProvider = ({ children }) => {
  const [bildirimler, setBildirimler] = useState(() => {
    try {
      const kayitli = localStorage.getItem(STORAGE_KEY);
      return kayitli ? JSON.parse(kayitli) : [];
    } catch {
      return [];
    }
  });

  // LocalStorage senkronizasyonu
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bildirimler));
    } catch (e) {
      console.error('Bildirimler kaydedilemedi:', e);
    }
  }, [bildirimler]);

  const bildirimEkle = useCallback((baslik, mesaj, tip = 'info', link = null) => {
    const yeniBildirim = {
      id: Date.now() + Math.random(),
      baslik,
      mesaj,
      tip, // 'alert' | 'warning' | 'info' | 'success'
      link,
      tarih: new Date().toISOString(),
      okundu: false
    };

    setBildirimler(prev => [yeniBildirim, ...prev.slice(0, 49)]); // Son 50 bildirim
  }, []);

  const okunduIsaretle = useCallback((id) => {
    setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: true } : b));
  }, []);

  const okunmadiIsaretle = useCallback((id) => {
    setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: false } : b));
  }, []);

  const okunduDurumDegistir = useCallback((id) => {
    setBildirimler(prev => prev.map(b => b.id === id ? { ...b, okundu: !b.okundu } : b));
  }, []);

  const tumunuOkunduIsaretle = useCallback(() => {
    setBildirimler(prev => prev.map(b => ({ ...b, okundu: true })));
  }, []);

  const bildirimSil = useCallback((id) => {
    setBildirimler(prev => prev.filter(b => b.id !== id));
  }, []);

  const tumunuTemizle = useCallback(() => {
    setBildirimler([]);
  }, []);

  const okunmamisSayisi = bildirimler.filter(b => !b.okundu).length;

  return (
    <NotificationContext.Provider
      value={{
        bildirimler,
        okunmamisSayisi,
        bildirimEkle,
        okunduIsaretle,
        okunmadiIsaretle,
        okunduDurumDegistir,
        tumunuOkunduIsaretle,
        bildirimSil,
        tumunuTemizle
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications, NotificationProvider içerisinde kullanılmalıdır.');
  }
  return context;
};
