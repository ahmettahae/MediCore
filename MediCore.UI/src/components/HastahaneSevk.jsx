import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorUtils';
import { X, Check, Siren } from 'lucide-react';
import { API_BASE } from '../config/api';

const simdiFormatli = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const BOS_FORM = () => ({
  hastaId: '',
  sevkEdilenHastane: '',
  sevkNedeni: '',
  sevkTipi: 'Acil (112 Ambulans)',
  doktorNotu: '',
  sevkTarihi: simdiFormatli()
});

const HASTANE_LISTESI = [
  'Ankara Şehir Hastanesi',
  'Hacettepe Üniversitesi Tıp Fakültesi Hastanesi',
  'Gazi Üniversitesi Hastanesi',
  'Ankara Numune Hastanesi',
  'Dışkapı Yıldırım Beyazıt Eğitim ve Araştırma Hastanesi',
  'İbn-i Sina Hastanesi'
];

const HastahaneSevk = () => {
  const [sevkler, setSevkler] = useState([]);
  const [hastalar, setHastalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [modalAcik, setModalAcik] = useState(false);
  const [geriDonisModalId, setGeriDonisModalId] = useState(null);
  const [geriDonisForm, setGeriDonisForm] = useState({ notu: '', tarihi: '' });
  const [form, setForm] = useState(BOS_FORM());

  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { showToast } = useToast();

  const verileriGetir = useCallback(async (ara = '', showLoading = true) => {
    if (showLoading) setYukleniyor(true);
    const headers = getAuthHeaders();
    try {
      const url = ara ? `${API_BASE}/HastahaneSevk?ara=${encodeURIComponent(ara)}` : `${API_BASE}/HastahaneSevk`;
      const [sevkRes, hastaRes] = await Promise.all([
        fetch(url, { headers }),
        fetch(`${API_BASE}/Hasta`, { headers })
      ]);

      if (sevkRes.status === 401) { navigate('/login'); return; }

      if (sevkRes.ok) setSevkler(await sevkRes.json());
      if (hastaRes.ok) setHastalar(await hastaRes.json());
    } catch (hata) {
      console.error('Sevk verisi çekme hatası:', hata);
      showToast('Sevk verileri yüklenirken hata oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders, navigate, showToast]);

  useEffect(() => { verileriGetir(); }, [verileriGetir]);

  useEffect(() => {
    const t = setTimeout(() => verileriGetir(aramaMetni, false), 400);
    return () => clearTimeout(t);
  }, [aramaMetni, verileriGetir]);

  const handleSevkKaydet = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      hastaId: parseInt(form.hastaId)
    };
    if (!payload.sevkTarihi) delete payload.sevkTarihi;

    try {
      const cevap = await fetch(`${API_BASE}/HastahaneSevk`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (cevap.ok) {
        setModalAcik(false);
        setForm(BOS_FORM());
        verileriGetir(aramaMetni);
        showToast('Hastane sevki başarıyla oluşturuldu.', 'success');
      } else {
        const errMesaj = await parseApiError(cevap, 'Sevk işlemi başarısız.');
        showToast('Sevk işlemi başarısız: ' + errMesaj, 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const handleGeriDonisKaydet = async (e) => {
    e.preventDefault();
    const payload = { geriDonusNotu: geriDonisForm.notu };
    if (geriDonisForm.tarihi) payload.geriDonusTarihi = geriDonisForm.tarihi;

    try {
      const cevap = await fetch(`${API_BASE}/HastahaneSevk/${geriDonisModalId}/geridonis`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (cevap.ok) {
        setGeriDonisModalId(null);
        setGeriDonisForm({ notu: '', tarihi: '' });
        verileriGetir(aramaMetni);
        showToast('Sakin hastaneden kuruma dönüş yaptı.', 'success');
      } else {
        const errMesaj = await parseApiError(cevap, 'Geri dönüş işlemi kaydedilemedi.');
        showToast(errMesaj, 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Hastane Sevkleri & 112 Takibi
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Toplam {sevkler.length} Sevk Kaydı • Acil 112 & Planlı Poliklinik Kontrolleri
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder="Sevk veya Sakin Ara..."
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

          <button
            onClick={() => setModalAcik(true)}
            className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <Siren size={14} strokeWidth={2.2} />
            <span>Yeni Sevk Oluştur</span>
          </button>
        </div>
      </div>

      {/* ── 2. SEVK KARTLARI (GRID) ── */}
      <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-100/90 border-b border-primary flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
            Sevk Takip Listesi ({sevkler.length})
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-500">
            {sevkler.filter(s => s.durum === 'Sevk Edildi').length} Hastanede Aktif
          </span>
        </div>

        {yukleniyor ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs animate-pulse uppercase">
            Sevk Kayıtları Yükleniyor...
          </div>
        ) : sevkler.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Kayıtlı hastane sevki bulunmuyor.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sevkler.map((s) => {
              const isSevkli = s.durum === 'Sevk Edildi';
              const donusTarihiStr = s.geriDonusTarihi 
                ? new Date(s.geriDonusTarihi).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div key={s.id} className="p-3.5 rounded-xl border border-zinc-300 bg-white hover:border-primary transition-colors flex flex-col justify-between space-y-2.5 shadow-2xs">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-primary">{s.hastaAdi}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono ${
                        isSevkli ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                      }`}>
                        {isSevkli ? 'HASTANEDE' : 'KURUMDA'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono pb-1.5 border-b border-zinc-200">{s.hastaNo}</div>
                    
                    <div className="mt-2 space-y-0.5 text-xs text-zinc-700">
                      <p><span className="text-zinc-400 font-mono">Tarih:</span> <b className="font-mono">{new Date(s.sevkTarihi).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</b></p>
                      <p><span className="text-zinc-400 font-mono">Hastane:</span> <b>{s.sevkEdilenHastane}</b></p>
                      <p><span className="text-zinc-400 font-mono">Tip:</span> <b className="font-mono text-[11px]">{s.sevkTipi}</b></p>
                    </div>

                    <div className="mt-2 text-xs">
                      <div className="font-bold text-[11px] bg-zinc-50 p-1.5 rounded border border-zinc-200 text-primary">{s.sevkNedeni}</div>
                      {s.doktorNotu && <div className="text-[10px] text-zinc-500 mt-1 italic">"{s.doktorNotu}"</div>}
                      {s.geriDonusNotu && (
                        <div className="mt-1.5 text-zinc-800 bg-zinc-50 p-2 rounded border border-zinc-200 text-[10px]">
                          <b className="font-bold block border-b border-zinc-200 pb-0.5 mb-1 font-mono">Dönüş Notu:</b> {s.geriDonusNotu}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200">
                    {isSevkli ? (
                      <button
                        onClick={() => { setGeriDonisModalId(s.id); setGeriDonisForm({ notu: '', tarihi: simdiFormatli() }); }}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-1.5 font-bold uppercase text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Check size={12} strokeWidth={2.5} /> Kuruma Dönüş Yap
                      </button>
                    ) : (
                      donusTarihiStr && (
                        <div className="text-center text-[10px] font-mono text-zinc-500 bg-zinc-50 rounded p-1 border border-zinc-200">
                          Dönüş: {donusTarihiStr}
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. HASTANEYE SEVK OLUŞTURMA MODALI ── */}
      {modalAcik && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-lg space-y-3 p-5">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="font-black uppercase text-xs text-primary font-mono">Yeni Hastane Sevki Oluştur</h3>
              <button onClick={() => setModalAcik(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleSevkKaydet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Sevk Edilecek Sakin *</label>
                <select
                  required
                  className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white cursor-pointer"
                  value={form.hastaId}
                  onChange={(e) => setForm({ ...form, hastaId: e.target.value })}
                >
                  <option value="">Sakin Seçiniz...</option>
                  {hastalar.filter(h => h.durum === 'Aktif' || h.durum === 'Kurumda').map(h => (
                    <option key={h.id} value={h.id}>
                      {h.ad} {h.soyad} ({h.hastaNo}) - Oda: {h.odaNo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Sevk Edilen Hastane *</label>
                  <input
                    list="hastane-listesi"
                    type="text"
                    required
                    placeholder="Örn: Ankara Şehir Hastanesi"
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                    value={form.sevkEdilenHastane}
                    onChange={(e) => setForm({ ...form, sevkEdilenHastane: e.target.value })}
                  />
                  <datalist id="hastane-listesi">
                    {HASTANE_LISTESI.map(h => <option key={h} value={h} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Sevk Zamanı</label>
                  <input
                    type="datetime-local"
                    className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono"
                    value={form.sevkTarihi}
                    onChange={(e) => setForm({ ...form, sevkTarihi: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Sevk Tipi</label>
                <select
                  className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white cursor-pointer"
                  value={form.sevkTipi}
                  onChange={(e) => setForm({ ...form, sevkTipi: e.target.value })}
                >
                  <option>Acil (112 Ambulans)</option>
                  <option>Planlı Sevk</option>
                  <option>Poliklinik Kontrolü</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Sevk Nedeni & Şikayetler *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Örn: Şiddetli göğüs ağrısı, dispne..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium text-primary focus:outline-none resize-none bg-white"
                  value={form.sevkNedeni}
                  onChange={(e) => setForm({ ...form, sevkNedeni: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Hekim / Görevli Notu</label>
                <textarea
                  rows={2}
                  placeholder="İlk müdahale ve hekim değerlendirmesi..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium text-primary focus:outline-none resize-none bg-white"
                  value={form.doktorNotu}
                  onChange={(e) => setForm({ ...form, doktorNotu: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setModalAcik(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Sevk Et ve Bildir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. HASTANEDEN DÖNÜŞ MODALI ── */}
      {geriDonisModalId && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="font-black uppercase text-xs text-primary font-mono">Kuruma Geri Dönüş Kaydı</h3>
              <button onClick={() => setGeriDonisModalId(null)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleGeriDonisKaydet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Hastane Epikriz & Dönüş Notu *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Örn: Tedavi uygulandı, reçete düzenlendi, taburcu edildi..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium text-primary focus:outline-none resize-none bg-white"
                  value={geriDonisForm.notu}
                  onChange={(e) => setGeriDonisForm({ ...geriDonisForm, notu: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Dönüş Zamanı</label>
                <input
                  type="datetime-local"
                  className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono"
                  value={geriDonisForm.tarihi}
                  onChange={(e) => setGeriDonisForm({ ...geriDonisForm, tarihi: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setGeriDonisModalId(null)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold uppercase text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Kurumda Olarak Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HastahaneSevk;
