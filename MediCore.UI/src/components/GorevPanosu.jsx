import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Check, X } from 'lucide-react';
import { API_BASE } from '../config/api';

const GorevPanosu = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const [gorevler, setGorevler] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [yeniGorevAcik, setYeniGorevAcik] = useState(false);
  const [yeniGorev, setYeniGorev] = useState({ baslik: '', detay: '', durum: 'yapilacak', personelAdSoyad: '', oncelik: 'Normal' });
  const [aramaMetni, setAramaMetni] = useState('');

  const fetchPersoneller = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Personel`, { headers: getAuthHeaders() });
      if (res.ok) setPersoneller(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  const fetchGorevler = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Gorev`, { headers: getAuthHeaders() });
      if (res.ok) setGorevler(await res.json());
    } catch (e) {
      console.error(e);
      showToast('Görevler yüklenirken hata oluştu.', 'error');
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchGorevler();
    fetchPersoneller();
  }, [fetchGorevler, fetchPersoneller]);

  const durumlar = [
    { key: 'yapilacak', etiket: 'Yapılacaklar', badgeBg: 'bg-zinc-100 text-primary border-zinc-300' },
    { key: 'devam', etiket: 'Devam Edenler', badgeBg: 'bg-zinc-200 text-primary border-zinc-400' },
    { key: 'tamamlandi', etiket: 'Tamamlananlar', badgeBg: 'bg-primary text-white border-primary' }
  ];

  const durumuDegistir = async (id, yeniDurum) => {
    const gorev = gorevler.find(g => g.id === id);
    if (!gorev) return;
    const guncelGorev = { ...gorev, durum: yeniDurum };
    try {
      const res = await fetch(`${API_BASE}/Gorev/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(guncelGorev)
      });
      if (res.ok) {
        fetchGorevler();
        showToast(`Görev durumu güncellendi.`, 'success', 2000);
      }
    } catch (e) {
      console.error(e);
      showToast('Durum güncellenirken hata oluştu.', 'error');
    }
  };

  const gorevEkle = async (e) => {
    e.preventDefault();
    if (!yeniGorev.baslik || !yeniGorev.personelAdSoyad) {
      showToast('Lütfen görev başlığı ve sorumlu personel alanlarını doldurun.', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/Gorev`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(yeniGorev)
      });
      if (res.ok) {
        setYeniGorevAcik(false);
        setYeniGorev({ baslik: '', detay: '', durum: 'yapilacak', personelAdSoyad: '', oncelik: 'Normal' });
        fetchGorevler();
        showToast('Yeni görev panoya eklendi.', 'success');
      } else {
        showToast('Görev kaydedilemedi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const gorevSil = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/Gorev/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchGorevler();
        showToast('Görev panodan silindi.', 'info');
      } else {
        showToast('Silme işlemi başarısız.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Sunucu hatası oluştu.', 'error');
    }
  };

  const filtrelenmisGorevler = gorevler.filter(g =>
    (g.baslik || '').toLowerCase().includes(aramaMetni.toLowerCase()) ||
    (g.personelAdSoyad || '').toLowerCase().includes(aramaMetni.toLowerCase()) ||
    (g.detay || '').toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div className="space-y-3 font-sans text-primary max-w-6xl mx-auto flex flex-col h-[calc(100vh-105px)] min-h-[540px]">

      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Klinik Görev Panosu
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Toplam {filtrelenmisGorevler.length} Görev Listeleniyor
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder="Görev veya Kişi Ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full h-6 text-xs font-bold text-primary bg-transparent focus:outline-none placeholder:text-zinc-400"
            />
            {aramaMetni && (
              <button
                type="button"
                onClick={() => setAramaMetni('')}
                className="text-[10px] font-bold text-zinc-400 hover:text-primary px-1 cursor-pointer"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            )}
          </form>

          {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Yonetici') && (
            <button
              onClick={() => setYeniGorevAcik(true)}
              className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-lg shrink-0 cursor-pointer shadow-2xs"
            >
              <span>+</span>
              <span>Yeni Görev</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. KANBAN KOLONLARI (Kendi İçinde Scroll Olan Yapı) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch flex-1 min-h-0 overflow-hidden pb-1">
        {durumlar.map((kolon) => {
          const kolonGorevleri = filtrelenmisGorevler.filter(g => g.durum === kolon.key);

          return (
            <div key={kolon.key} className="bg-white border border-primary rounded-xl shadow-2xs overflow-hidden flex flex-col h-full min-h-0">

              {/* Kolon Başlığı */}
              <div className="px-3.5 py-2.5 bg-zinc-100/90 border-b border-primary flex justify-between items-center shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
                  {kolon.etiket}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-white text-primary border border-zinc-300">
                  {kolonGorevleri.length}
                </span>
              </div>

              {/* Görev Kartları (Kendi İçinde Dikey Scroll) */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto bg-zinc-50/50 overscroll-contain">
                {kolonGorevleri.map((gorev) => (
                  <div key={gorev.id} className="bg-white border border-zinc-300 rounded-lg p-3 hover:border-primary transition-colors shadow-2xs flex flex-col space-y-2 shrink-0">

                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold uppercase font-mono bg-zinc-100 text-zinc-800 border border-zinc-300 px-1.5 py-0.2 rounded">
                        {gorev.oncelik}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">#{gorev.id}</span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-primary leading-snug">{gorev.baslik}</h3>
                      {gorev.detay && (
                        <p className="text-[11px] text-zinc-600 font-medium mt-0.5">{gorev.detay}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-zinc-800 truncate max-w-[120px] flex items-center gap-1">
                        <User size={11} strokeWidth={2.2} /> {gorev.personelAdSoyad}
                      </span>

                      <div className="flex items-center gap-1">
                        {gorev.durum === 'yapilacak' && (
                          <button
                            onClick={() => durumuDegistir(gorev.id, 'devam')}
                            className="text-[10px] font-bold uppercase border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            Başla →
                          </button>
                        )}
                        {gorev.durum === 'devam' && (
                          <button
                            onClick={() => durumuDegistir(gorev.id, 'tamamlandi')}
                            className="text-[10px] font-bold uppercase bg-primary hover:bg-primary-hover text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-2xs flex items-center gap-0.5"
                          >
                            <Check size={10} strokeWidth={2.5} /> Tamamla
                          </button>
                        )}
                        {gorev.durum === 'tamamlandi' && (
                          <span className="text-[10px] font-bold text-zinc-500 font-mono flex items-center gap-0.5">
                            <Check size={10} strokeWidth={2.5} /> Tamamlandı
                          </span>
                        )}
                        {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Yonetici') && (
                          <button
                            onClick={() => gorevSil(gorev.id)}
                            className="text-[10px] text-red-600 hover:text-red-800 px-1 font-bold cursor-pointer flex items-center"
                            title="Görevi Sil"
                          >
                            <X size={10} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {kolonGorevleri.length === 0 && (
                  <div className="text-center py-12 text-xs font-bold text-zinc-400">
                    Görev bulunmuyor
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* ── YENİ GÖREV EKLEME MODALI ── */}
      {yeniGorevAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-primary rounded-xl p-5 w-full max-w-md shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h2 className="text-sm font-black uppercase text-primary font-mono">Yeni Görev Tanımla</h2>
              <button
                onClick={() => setYeniGorevAcik(false)}
                className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={gorevEkle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Görev Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 204 nolu odanın tansiyon tekrarı..."
                  className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold text-primary focus:outline-none focus:border-primary bg-white"
                  value={yeniGorev.baslik}
                  onChange={(e) => setYeniGorev({ ...yeniGorev, baslik: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Görev Detayı</label>
                <textarea
                  rows="2"
                  placeholder="Opsiyonel detaylı açıklama..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium text-primary focus:outline-none focus:border-primary resize-none bg-white"
                  value={yeniGorev.detay}
                  onChange={(e) => setYeniGorev({ ...yeniGorev, detay: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Personel Seçimi</label>
                  <select
                    required
                    className="w-full h-8 border border-zinc-300 rounded-lg px-2 text-xs font-bold text-primary focus:outline-none bg-white cursor-pointer"
                    value={yeniGorev.personelAdSoyad}
                    onChange={(e) => setYeniGorev({ ...yeniGorev, personelAdSoyad: e.target.value })}
                  >
                    <option value="">Personel Seçiniz...</option>
                    {personeller.map(p => (
                      <option key={p.id} value={p.adSoyad}>
                        {p.adSoyad} ({p.unvan === 'Doktor' ? 'Kurum Hekimi' : p.unvan})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Öncelik</label>
                  <select
                    className="w-full h-8 border border-zinc-300 rounded-lg px-2 text-xs font-bold text-primary focus:outline-none bg-white cursor-pointer"
                    value={yeniGorev.oncelik}
                    onChange={(e) => setYeniGorev({ ...yeniGorev, oncelik: e.target.value })}
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Normal">Normal</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Kritik">Kritik</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setYeniGorevAcik(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 font-bold uppercase text-[11px] hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  Görevi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GorevPanosu;
