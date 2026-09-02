import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';
import { API_BASE } from '../config/api';

const DuyuruPanosu = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const { showToast } = useToast();
  const [duyurular, setDuyurular] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  const [filtreModu, setFiltreModu] = useState('hepsi');

  const mevalutKullanici = kullanici ? `${kullanici.ad} ${kullanici.soyad}` : 'Kurum Yöneticisi';

  const [yeniDuyuru, setYeniDuyuru] = useState({
    baslik: '',
    icerik: '',
    yazar: mevalutKullanici,
    onemliMi: false
  });

  const fetchDuyurular = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Duyuru`, { headers: getAuthHeaders() });
      if (res.ok) setDuyurular(await res.json());
    } catch {
      showToast('Duyurular yüklenirken hata oluştu.', 'error');
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchDuyurular();
  }, [fetchDuyurular]);

  const handleDuyuruKaydet = async (e) => {
    e.preventDefault();
    if (!yeniDuyuru.baslik || !yeniDuyuru.icerik) {
      showToast('Lütfen başlık ve duyuru metni alanlarını doldurun.', 'warning');
      return;
    }
    try {
      const gonderilecekData = {
        ...yeniDuyuru,
        yazar: mevalutKullanici
      };

      const res = await fetch(`${API_BASE}/Duyuru`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(gonderilecekData)
      });
      if (res.ok) {
        setYeniDuyuru({ baslik: '', icerik: '', yazar: mevalutKullanici, onemliMi: false });
        setModalAcik(false);
        fetchDuyurular();
        showToast('Yeni duyuru panoda yayınlandı.', 'success');
      } else {
        showToast('Duyuru kaydedilemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const duyuruSil = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/Duyuru/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchDuyurular();
        showToast('Duyuru silindi.', 'info');
      } else {
        showToast('Duyuru silinemedi veya yetkiniz yok.', 'error');
      }
    } catch {
      showToast('Sunucu hatası oluştu.', 'error');
    }
  };

  const filtrelenmisDuyurular = duyurular.filter(d => {
    const aramaUyum = (d.baslik || '').toLowerCase().includes(aramaMetni.toLowerCase()) ||
                      (d.icerik || '').toLowerCase().includes(aramaMetni.toLowerCase()) ||
                      (d.yazar || '').toLowerCase().includes(aramaMetni.toLowerCase());
    
    let filtreUyum = true;
    if (filtreModu === 'onemli') filtreUyum = d.onemliMi === true;
    if (filtreModu === 'genel') filtreUyum = d.onemliMi === false;

    return aramaUyum && filtreUyum;
  });

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Kurum İçi Duyuru Panosu
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Toplam {filtrelenmisDuyurular.length} Duyuru Listeleniyor
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder="Duyuru Ara..."
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

          {/* Filtre */}
          <select
            value={filtreModu}
            onChange={(e) => setFiltreModu(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="hepsi">Tüm Duyurular</option>
            <option value="onemli">Önemli Duyurular</option>
            <option value="genel">Genel Duyurular</option>
          </select>

          {/* Yeni Duyuru Ekle */}
          {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Yonetici') && (
            <button
              onClick={() => setModalAcik(true)}
              className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center shrink-0 cursor-pointer shadow-2xs"
            >
              + Yeni Duyuru
            </button>
          )}
        </div>
      </div>

      {/* ── 2. DUYURU KARTLARI (GRID) ── */}
      <div className="bg-white border border-primary rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-100/90 border-b border-primary flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
            Duyurular ({filtrelenmisDuyurular.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            {filtrelenmisDuyurular.filter(d => d.onemliMi).length} Önemli Duyuru
          </span>
        </div>

        {filtrelenmisDuyurular.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Kayıtlı duyuru bulunamadı.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtrelenmisDuyurular.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-xl border border-zinc-300 bg-white hover:border-primary transition-colors flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-primary leading-snug">{d.baslik}</h3>
                    {d.onemliMi && (
                      <span className="bg-primary text-white text-[8px] font-bold uppercase font-mono px-1.5 py-0.2 rounded shrink-0">
                        ÖNEMLİ
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500 border-b border-zinc-200 pb-1.5 font-mono">
                    <p>Tarih: <b>{new Date(d.tarih).toLocaleDateString('tr-TR')} {new Date(d.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</b></p>
                    <p>Yayınlayan: <b className="text-zinc-800">{d.yazar}</b></p>
                  </div>
                  
                  <p className="text-xs text-zinc-700 leading-relaxed pt-1.5 whitespace-pre-wrap max-h-32 overflow-y-auto font-normal">
                    {d.icerik}
                  </p>
                </div>
                
                {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Yonetici') && (
                  <div className="pt-2 border-t border-zinc-200 flex justify-end">
                    <button 
                      onClick={() => duyuruSil(d.id)} 
                      className="px-2 py-0.5 rounded bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                    >
                      Sil
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. YENİ DUYURU MODALI ── */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-primary rounded-xl p-5 w-full max-w-lg shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h2 className="text-xs font-black uppercase text-primary font-mono">
                Yeni Kurumsal Duyuru Yayınla
              </h2>
              <button
                onClick={() => setModalAcik(false)}
                className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleDuyuruKaydet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Duyuru Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Yeni Nöbet Düzenlemesi Hakkında"
                  required
                  className="w-full h-8 border border-zinc-300 rounded-lg px-2.5 text-xs font-bold focus:outline-none bg-white"
                  value={yeniDuyuru.baslik}
                  onChange={(e) => setYeniDuyuru({...yeniDuyuru, baslik: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                <input
                  type="checkbox"
                  id="onemli"
                  className="w-4 h-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                  checked={yeniDuyuru.onemliMi}
                  onChange={(e) => setYeniDuyuru({...yeniDuyuru, onemliMi: e.target.checked})}
                />
                <label htmlFor="onemli" className="text-xs font-bold text-primary cursor-pointer select-none">
                  Acil / Önemli Duyuru Olarak İşaretle
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Duyuru Metni / İçeriği</label>
                <textarea 
                  rows="4" 
                  placeholder="Duyuru detaylarını buraya giriniz..." 
                  required
                  className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-medium focus:outline-none resize-none bg-white placeholder:text-zinc-400"
                  value={yeniDuyuru.icerik}
                  onChange={(e) => setYeniDuyuru({...yeniDuyuru, icerik: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setModalAcik(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-[11px] rounded-lg tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  Duyuruyu Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuyuruPanosu;
