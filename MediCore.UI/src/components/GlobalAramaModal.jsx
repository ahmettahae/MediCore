import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Pill, Stethoscope, Ambulance, CalendarDays, FileText, ClipboardList, Users, UserCog, Zap } from 'lucide-react';
import { API_BASE } from '../config/api';

const GlobalAramaModal = ({ acik, setAcik }) => {
  const [aramaMetni, setAramaMetni] = useState('');
  const [sonuclar, setSonuclar] = useState({ hastalar: [], ilaclar: [], personeller: [], doktorlar: [], sayfalar: [] });
  const [yukleniyor, setYukleniyor] = useState(false);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (acik && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [acik]);

  // Global Ctrl + K kısayolu dinleyicisi
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAcik(prev => !prev);
      }
      if (e.key === 'Escape') {
        setAcik(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setAcik]);

  const ara = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSonuclar({ hastalar: [], ilaclar: [], personeller: [], doktorlar: [], sayfalar: [] });
      return;
    }
    setYukleniyor(true);
    const headers = getAuthHeaders();
    try {
      const q = encodeURIComponent(query.trim());
      const lowerQ = query.toLowerCase().trim();

      const [hRes, iRes, pRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/Hasta?ara=${q}`, { headers }),
        fetch(`${API_BASE}/Ilac?ara=${q}`, { headers }),
        fetch(`${API_BASE}/Personel`, { headers }),
        fetch(`${API_BASE}/Doktor`, { headers })
      ]);

      const hastalar = hRes.ok ? await hRes.json() : [];
      const ilaclar = iRes.ok ? await iRes.json() : [];
      let personeller = pRes.ok ? await pRes.json() : [];
      let doktorlar = dRes.ok ? await dRes.json() : [];

      if (query) {
        personeller = personeller.filter(p =>
          (p.adSoyad && p.adSoyad.toLowerCase().includes(lowerQ)) ||
          (p.unvan && p.unvan.toLowerCase().includes(lowerQ))
        );
        doktorlar = doktorlar.filter(d =>
          (`${d.ad} ${d.soyad}`.toLowerCase().includes(lowerQ)) ||
          (d.uzmanlikAlani && d.uzmanlikAlani.toLowerCase().includes(lowerQ)) ||
          (d.calistigiBirim && d.calistigiBirim.toLowerCase().includes(lowerQ))
        );
      }

      // Sayfa Kısayolları Eşleşmesi
      const sayfalar = [
        { ad: 'İlaç Dağıtım Çizelgesi (MAR)', url: '/ilac-dagitim', etiket: 'Hemşire İlaç Uygulama', ikon: Pill },
        { ad: 'Toplu Hızlı Vital Girişi', url: '/toplu-vital', etiket: 'Tansiyon / Ateş / Nabız Girişi', ikon: Stethoscope },
        { ad: 'Hekim Viziteleri & Muayene', url: '/vizite', etiket: 'Klinik Muayene & Reçeteleme', ikon: Stethoscope },
        { ad: 'Hastane Sevkleri & 112', url: '/sevkler', etiket: 'Dış Hastane Sevk Takibi', ikon: Ambulance },
        { ad: 'Vardiya & Nöbet Takvimi', url: '/vardiya-takvim', etiket: '365 Günlük Nöbet Listesi', ikon: CalendarDays },
        { ad: 'Nöbet Devir Teslim Raporu', url: '/vardiya-raporu', etiket: 'Vardiya Teslim Notları', ikon: FileText }
      ].filter(s => s.ad.toLowerCase().includes(lowerQ) || s.etiket.toLowerCase().includes(lowerQ));

      setSonuclar({
        hastalar: Array.isArray(hastalar) ? hastalar.slice(0, 5) : [],
        ilaclar: Array.isArray(ilaclar) ? ilaclar.slice(0, 5) : [],
        personeller: Array.isArray(personeller) ? personeller.slice(0, 4) : [],
        doktorlar: Array.isArray(doktorlar) ? doktorlar.slice(0, 4) : [],
        sayfalar: sayfalar.slice(0, 4)
      });
    } catch (e) {
      console.error('Arama hatası', e);
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const timer = setTimeout(() => ara(aramaMetni), 250);
    return () => clearTimeout(timer);
  }, [aramaMetni, ara]);

  const secimYap = (url) => {
    setAcik(false);
    setAramaMetni('');
    navigate(url);
  };

  if (!acik) return null;

  const toplamSonuc = (sonuclar.hastalar?.length || 0) +
    (sonuclar.ilaclar?.length || 0) +
    (sonuclar.personeller?.length || 0) +
    (sonuclar.doktorlar?.length || 0) +
    (sonuclar.sayfalar?.length || 0);

  return (
    <div
      className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-start justify-center pt-16 px-4"
      onClick={() => setAcik(false)}
    >
      <div
        className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans text-primary animate-in fade-in zoom-in duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arama Input Alanı */}
        <div className="p-3.5 border-b border-zinc-200 flex items-center gap-3 bg-zinc-50">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Sakin, İlaç, Doktor veya Personel Ara... (Örn: Ahmet, Parol, Dahiliye)"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm font-bold text-primary focus:outline-none placeholder:text-zinc-400"
          />
          {aramaMetni && (
            <button
              type="button"
              onClick={() => setAramaMetni('')}
              className="text-[11px] font-bold text-zinc-400 hover:text-primary px-2 py-1 uppercase cursor-pointer"
            >
              Temizle
            </button>
          )}
          <span className="text-[9px] font-mono font-bold border border-zinc-300 dark:border-slate-700 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-zinc-600 dark:text-slate-300 shrink-0 hidden sm:inline">
            ESC
          </span>
        </div>

        {/* Sonuç Listesi */}
        <div className="max-h-[60vh] overflow-y-auto p-3.5 space-y-3.5">
          {yukleniyor ? (
            <div className="text-center py-8 text-xs font-mono text-zinc-400 uppercase tracking-widest animate-pulse">
              Aranıyor...
            </div>
          ) : aramaMetni.trim().length >= 2 && toplamSonuc === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-zinc-400">
              "{aramaMetni}" ile eşleşen kayıt bulunamadı.
            </div>
          ) : !aramaMetni.trim() ? (
            <div className="text-center py-6 text-xs text-zinc-400 font-medium">
              Aramak istediğiniz sakin adı, ilaç veya personel unvanını yazın.
            </div>
          ) : (
            <>
              {/* Bakım Sakinleri Sonuçları */}
              {sonuclar.hastalar.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 pb-1 mb-1.5 flex items-center gap-1">
                    <ClipboardList size={10} strokeWidth={2.2} /> Bakım Sakinleri ({sonuclar.hastalar.length})
                  </h4>
                  <div className="space-y-1">
                    {sonuclar.hastalar.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => secimYap(`/hastalar/${h.id}`)}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 border border-zinc-200 hover:border-primary flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-primary group-hover:underline">{h.ad} {h.soyad}</span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-mono">Oda: {h.odaNo || '—'} / Yatak: {h.yatakNo || '—'}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded ${h.durum === 'Hastahanede' || h.durum === 'Hastanede' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                          }`}>
                          {h.durum === 'Aktif' ? 'Kurumda' : h.durum || 'Kurumda'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* İlaç Sonuçları */}
              {sonuclar.ilaclar.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 pb-1 mb-1.5 flex items-center gap-1">
                    <Pill size={10} strokeWidth={2.2} /> İlaçlar & Stok ({sonuclar.ilaclar.length})
                  </h4>
                  <div className="space-y-1">
                    {sonuclar.ilaclar.map(i => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => secimYap(`/ilaclar/${i.id}`)}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 border border-zinc-200 hover:border-primary flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-primary group-hover:underline">{i.ad}</span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-mono">{i.etkenMadde} • {i.form}</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase font-mono bg-primary text-white px-2 py-0.5 rounded">
                          Stok: {i.toplamStok ?? i.stokMiktari ?? 0} Kutu
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sayfa Kısayolları Sonuçları */}
              {sonuclar.sayfalar && sonuclar.sayfalar.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 pb-1 mb-1.5 flex items-center gap-1">
                    <Zap size={10} strokeWidth={2.2} /> Hızlı Menü & Modüller ({sonuclar.sayfalar.length})
                  </h4>
                  <div className="space-y-1">
                    {sonuclar.sayfalar.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => secimYap(s.url)}
                        className="w-full text-left p-2 rounded-lg bg-zinc-50 hover:bg-primary-hover hover:text-white border border-zinc-200 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          {s.ikon && <s.ikon size={11} strokeWidth={2.2} />}
                          {s.ad}
                        </span>
                        <span className="text-[10px] font-mono font-medium opacity-75">{s.etiket} →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kurum Hekimleri Sonuçları */}
              {sonuclar.doktorlar && sonuclar.doktorlar.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 pb-1 mb-1.5 flex items-center gap-1">
                    <UserCog size={10} strokeWidth={2.2} /> Kurum Hekimleri ({sonuclar.doktorlar.length})
                  </h4>
                  <div className="space-y-1">
                    {sonuclar.doktorlar.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => secimYap(`/vizite`)}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 border border-zinc-200 hover:border-primary flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-primary group-hover:underline">Dr. {d.ad} {d.soyad}</span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-mono">({d.uzmanlikAlani || d.calistigiBirim})</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase font-mono bg-primary text-white px-2 py-0.5 rounded">
                          Vizite Masası →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Personel Sonuçları */}
              {sonuclar.personeller.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-200 pb-1 mb-1.5 flex items-center gap-1">
                    <Users size={10} strokeWidth={2.2} /> Sağlık & Bakım Personeli ({sonuclar.personeller.length})
                  </h4>
                  <div className="space-y-1">
                    {sonuclar.personeller.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => secimYap(`/personel`)}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 border border-zinc-200 hover:border-primary flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-xs text-primary group-hover:underline">{p.adSoyad}</span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-mono">({p.unvan})</span>
                        </div>
                        <span className="text-[9px] font-bold font-mono bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded border border-zinc-300">
                          {p.vardiya || p.durum}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Alt Bilgi */}
        <div className="p-2.5 bg-zinc-100 dark:bg-slate-900/80 border-t border-zinc-200 dark:border-slate-700 text-[10px] font-mono text-zinc-500 dark:text-slate-400 flex items-center justify-between">
          <span>Kısayol: <kbd className="bg-white dark:bg-slate-800 border border-zinc-300 dark:border-slate-700 rounded px-1 text-zinc-800 dark:text-slate-200 font-bold">Ctrl + K</kbd></span>
          <span>Seçmek için Enter / Tıkla</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalAramaModal;
