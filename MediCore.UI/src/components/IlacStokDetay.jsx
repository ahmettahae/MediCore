import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Package, X } from 'lucide-react';
import { API_BASE } from '../config/api';

const IlacStokDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();

  const [ilac, setIlac] = useState(null);
  const [stoklar, setStoklar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [stokModal, setStokModal] = useState(false);
  const [silOnayId, setSilOnayId] = useState(null);

  const [stokForm, setStokForm] = useState({
    partiNo: '', adet: '', sonKullanmaTarihi: ''
  });

  const verileriGetir = useCallback(async () => {
    setYukleniyor(true);
    const h = getAuthHeaders();
    try {
      const [ilacRes, stokRes] = await Promise.all([
        fetch(`${API_BASE}/Ilac/${id}`, { headers: h }),
        fetch(`${API_BASE}/IlacStok/ilac/${id}`, { headers: h }),
      ]);
      if (!ilacRes.ok) { navigate('/ilaclar'); return; }
      setIlac(await ilacRes.json());
      setStoklar(stokRes.ok ? await stokRes.json() : []);
    } catch {
      showToast('Stok verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [id, getAuthHeaders, navigate, showToast]);

  useEffect(() => { verileriGetir(); }, [verileriGetir]);

  const handleStokEkle = async (e) => {
    e.preventDefault();
    const payload = {
      ilacId: parseInt(id),
      partiNo: stokForm.partiNo,
      adet: parseInt(stokForm.adet),
      sonKullanmaTarihi: stokForm.sonKullanmaTarihi || null,
    };
    try {
      const cevap = await fetch(`${API_BASE}/IlacStok`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (cevap.ok) {
        setStokModal(false);
        setStokForm({ partiNo: '', adet: '', sonKullanmaTarihi: '' });
        verileriGetir();
        showToast('Yeni ilaç partisi ve stoğu eklendi.', 'success');
      } else {
        showToast('Stok girişi kaydedilemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const handleStokSil = async (stokId) => {
    try {
      const cevap = await fetch(`${API_BASE}/IlacStok/${stokId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (cevap.ok) { 
        setSilOnayId(null); 
        verileriGetir(); 
        showToast('Parti stoğu silindi.', 'info');
      } else {
        showToast('Silme işlemi başarısız.', 'error');
      }
    } catch {
      showToast('İşlem sırasında hata oluştu.', 'error');
    }
  };

  const toplamStok = stoklar.reduce((t, s) => t + s.adet, 0);

  if (yukleniyor) return <div className="text-center py-16 text-zinc-500 font-mono animate-pulse">Yükleniyor...</div>;
  if (!ilac) return null;

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-5xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/ilaclar')} 
            className="h-8 px-2.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs transition-colors flex items-center shrink-0 cursor-pointer"
          >
            ← İlaçlar
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary tracking-tight leading-none uppercase">
              {ilac.ad}
            </h1>
            <p className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5">
              {ilac.etkenMadde && `${ilac.etkenMadde} • `}
              {ilac.form && `${ilac.form} • `}
              {ilac.ureticiFirma || 'Belirtilmemiş'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. ÖZET KARTLAR ── */}
      <div className="grid grid-cols-3 gap-3 font-mono">
        <div className="bg-white rounded-xl p-4 border border-primary shadow-2xs text-center flex flex-col justify-center">
          <div className="text-2xl font-black text-primary">{toplamStok}</div>
          <div className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-wider">Toplam Stok (Kutu)</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary shadow-2xs text-center flex flex-col justify-center">
          <div className="text-sm font-black text-primary uppercase tracking-wider">
            {toplamStok === 0 ? 'Stok Yok' : toplamStok <= ilac.kritikStokSeviyesi ? 'Kritik Seviye' : 'Yeterli Stok'}
          </div>
          <div className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-wider">Kritik Eşik: {ilac.kritikStokSeviyesi}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-primary shadow-2xs text-center flex flex-col justify-center">
          <div className="text-2xl font-black text-primary">{stoklar.length}</div>
          <div className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-wider">Parti Sayısı</div>
        </div>
      </div>

      {/* ── 3. STOK PARTİLERİ TABLOSU ── */}
      <div className="bg-white rounded-xl shadow-xs border border-primary overflow-hidden">
        <div className="px-4 py-2.5 border-b border-primary flex justify-between items-center bg-zinc-100/90">
          <h3 className="font-black text-primary uppercase tracking-wider text-xs font-mono flex items-center gap-1.5"><Package size={13} strokeWidth={2.2} /> İlaç Stok Partileri</h3>
          {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') && (
            <button
              onClick={() => setStokModal(true)}
              className="h-7 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
            >
              + Parti Ekle
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-200">
          {stoklar.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400">
              Bu ilaca ait kayıtlı parti stoğu bulunmuyor.
            </div>
          ) : (
            stoklar.map(stok => (
              <div key={stok.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 transition-colors text-xs">
                <div>
                  <div className="font-bold text-primary">
                    Parti No: <span className="font-mono">{stok.partiNo || '—'}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    SKT: {stok.sonKullanmaTarihi ? new Date(stok.sonKullanmaTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-primary">
                    {stok.adet} Kutu
                  </span>
                  {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') && (
                    <button
                      onClick={() => setSilOnayId(stok.id)}
                      className="px-2 py-1 rounded bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white font-bold text-[10px] uppercase transition-colors cursor-pointer"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── PARTİ EKLEME MODALI ── */}
      {stokModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl p-5 max-w-sm w-full space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <h3 className="text-xs font-black text-primary uppercase tracking-wider font-mono">Yeni Parti Stoğu Ekle</h3>
              <button onClick={() => setStokModal(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleStokEkle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Parti No / Seri</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: PRT-2026-08"
                  value={stokForm.partiNo}
                  onChange={(e) => setStokForm({ ...stokForm, partiNo: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 font-bold focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Adet / Kutu Miktarı</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Örn: 50"
                  value={stokForm.adet}
                  onChange={(e) => setStokForm({ ...stokForm, adet: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 font-bold focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Son Kullanma Tarihi (SKT)</label>
                <input
                  type="date"
                  value={stokForm.sonKullanmaTarihi}
                  onChange={(e) => setStokForm({ ...stokForm, sonKullanmaTarihi: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 font-bold focus:outline-none focus:border-primary font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setStokModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 font-bold uppercase text-[11px] hover:bg-zinc-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Stoğa Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SİLME ONAY MODALI ── */}
      {silOnayId && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl p-5 max-w-xs w-full text-center space-y-3">
            <h3 className="text-sm font-black text-primary uppercase font-mono">Parti Stoğunu Sil</h3>
            <p className="text-zinc-600 text-xs font-medium">Bu partiyi silmek istediğinizden emin misiniz?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSilOnayId(null)}
                className="flex-1 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs uppercase cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleStokSil(silOnayId)}
                className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IlacStokDetay;
