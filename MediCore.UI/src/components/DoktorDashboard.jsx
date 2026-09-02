import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Ambulance, Pill, CalendarDays, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config/api';

const DoktorDashboard = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [ozet, setOzet] = useState(null);
  const [kritikHastalar, setKritikHastalar] = useState([]);
  const [sevkler, setSevkler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const verileriGetir = useCallback(async () => {
    setYukleniyor(true);
    const h = getAuthHeaders();
    try {
      const [ozetRes, kritikRes, sevkRes] = await Promise.all([
        fetch(`${API_BASE}/Muayene/doktor-ozet`, { headers: h }),
        fetch(`${API_BASE}/Muayene/kritik-hastalar`, { headers: h }),
        fetch(`${API_BASE}/HastahaneSevk`, { headers: h })
      ]);

      if (ozetRes.ok) setOzet(await ozetRes.json());
      if (kritikRes.ok) setKritikHastalar(await kritikRes.json());
      if (sevkRes.ok) {
        const data = await sevkRes.json();
        setSevkler(data.filter(s => s.durum === 'Sevk Edildi'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  const bugunTarihFormat = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 font-sans pb-16 text-primary max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST HERO & DOKTOR BİLGİ BANDI ── */}
      <div className="bg-white rounded-xl border border-primary p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            {bugunTarihFormat}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-primary tracking-tight">
              Kurum Hekimi • Dr. {kullanici?.ad} {kullanici?.soyad}
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-primary text-zinc-100 text-[10px] font-black uppercase font-mono tracking-wider">
              Hekimlik & Vizite Masası
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-medium">
            Kritik hasta alarmları, hekim viziteleri, tedavi direktifleri ve 112 sevk takibi
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/vizite')}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Stethoscope size={14} strokeWidth={2.2} />
            <span>Hekim Vizitesi Başlat</span>
          </button>
          <button
            onClick={() => navigate('/sevkler')}
            className="h-9 px-3.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-primary border border-zinc-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Ambulance size={14} strokeWidth={2.2} />
            <span>Hastane Sevkleri</span>
          </button>
        </div>
      </div>

      {/* ── 2. KLİNİK İSTATİSTİK KARTLARI (MONOKROM ŞERİT) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => navigate('/hastalar')}
          className="bg-white rounded-xl p-3.5 border border-primary hover:border-zinc-950 shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Aktif Bakım Sakini
          </span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary font-mono">
              {ozet?.toplamAktifSakin ?? 0}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 font-mono">
              Merkezde →
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/vizite')}
          className="bg-white rounded-xl p-3.5 border border-primary hover:border-zinc-950 shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">
              Kritik Vital Alarmı
            </span>
            {kritikHastalar.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary font-mono">
              {kritikHastalar.length}
            </span>
            <span className="text-[10px] font-black text-primary font-mono">
              Acil İnceleme →
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/sevkler')}
          className="bg-white rounded-xl p-3.5 border border-primary hover:border-zinc-950 shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Dış Hastanede Yatan
          </span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary font-mono">
              {ozet?.hastanedeSevkli ?? 0}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 font-mono">
              112 Sevkli →
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/vizite')}
          className="bg-white rounded-xl p-3.5 border border-primary hover:border-zinc-950 shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Bugün Yapılan Vizite
          </span>
          <div className="my-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-primary font-mono">
              {ozet?.bugunYapilanVizite ?? 0}
            </span>
            <span className="text-[10px] font-bold text-zinc-500 font-mono">
              Vizite Kayıtları →
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. ÖNCELİKLİ ALAN: KRİTİK VİTAL ALARMLARI VE DOKTOR İNCELEMESİ ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
        <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#F0F4F8] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-primary font-mono">
                Kritik Vital Uyarısı & Hekim İncelemesi Bekleyen Sakinler ({kritikHastalar.length})
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                Tansiyon, ateş, saturasyon eşik dışı olan veya hastaneden yeni dönen sakinler
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/vizite')}
            className="text-[11px] font-bold text-primary hover:underline font-mono cursor-pointer"
          >
            Tümünü Muayene Et →
          </button>
        </div>

        <div className="divide-y divide-slate-100 bg-white">
          {yukleniyor ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">Yükleniyor...</div>
          ) : kritikHastalar.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-500 flex items-center justify-center gap-1.5">
              <AlertTriangle size={13} strokeWidth={2.5} /> Şu an kritik vital uyarısı veren bir bakım sakini bulunmuyor. Tüm vitaller stabil.
            </div>
          ) : (
            kritikHastalar.map(h => (
              <div key={h.hastaId} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-black font-mono shadow-2xs">
                      Oda {h.odaNo || '—'}/{h.yatakNo || '—'}
                    </span>
                    <span className="text-xs font-black text-zinc-900">
                      {h.ad} {h.soyad}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({h.hastaNo})
                    </span>
                    <span className="text-[11px] text-zinc-600 font-medium ml-1">
                      Tanı: {h.hastalik || '—'}
                    </span>
                  </div>

                  {/* Nedenler / Alarmlar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {h.kritikNedenler?.map((neden, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold font-mono flex items-center gap-1 shadow-2xs">
                        <AlertTriangle size={10} strokeWidth={2.5} className="text-red-500 shrink-0" /> {neden}
                      </span>
                    ))}
                  </div>

                  {h.sonVital && (
                    <div className="text-[11px] text-zinc-600 font-mono font-bold mt-1">
                      Son Ölçüm: {h.sonVital.tansiyonSistol || '—'}/{h.sonVital.tansiyonDiyastol || '—'} mmHg • {h.sonVital.nabizBPM || '—'} bpm • {h.sonVital.atesC || '—'} °C • SpO₂: %{h.sonVital.saturasyonYuzdesi || '—'}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/vizite?hastaId=${h.hastaId}`)}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Stethoscope size={13} strokeWidth={2.2} /> Vizite & Tedavi Notu
                  </button>
                  <button
                    onClick={() => navigate(`/hastalar/${h.hastaId}`)}
                    className="h-8 px-2.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    Detay
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 4. DIŞ HASTANE SEVKLERİ & HEKİM İŞLEMLERİ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        {/* Dış Hastane Sevkleri */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#F0F4F8] flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary font-mono flex items-center gap-1.5 min-w-0 truncate">
              <Ambulance size={13} strokeWidth={2.2} className="shrink-0" />
              <span className="truncate">Dış Hastanede Tedavi Görenler</span>
            </h3>
            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-300 text-zinc-700 shadow-2xs shrink-0 whitespace-nowrap">
              {sevkler.length} Hasta
            </span>
          </div>
          <div className="divide-y divide-slate-100 bg-white">
            {sevkler.length === 0 ? (
              <div className="p-5 text-center text-xs text-zinc-500">Şu an aktif hastane sevki bulunmuyor.</div>
            ) : (
              sevkler.map(s => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-xs text-zinc-900">{s.hastaAdi}</div>
                    <div className="text-[11px] text-zinc-500 font-medium font-mono mt-0.5">
                      {s.sevkEdilenHastane} • {s.sevkNedeni}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/sevkler')}
                    className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors cursor-pointer shadow-2xs"
                  >
                    Sevk Detayı →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hekim Kısayolları */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="px-3.5 py-2.5 border-b border-slate-200 bg-[#F0F4F8] flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary font-mono">
              Hekim Klinik Kısayolları
            </h3>
          </div>
          <div className="p-3 space-y-2 bg-white">
            <button
              onClick={() => navigate('/vizite')}
              className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-left text-xs font-bold transition-colors cursor-pointer flex items-center justify-between group"
            >
              <span className="flex items-center gap-1.5 text-zinc-800 group-hover:text-white"><Stethoscope size={13} strokeWidth={2.2} /> Muayene & Tedavi Planlama Çizelgesi</span>
              <span className="text-zinc-400 group-hover:text-white">→</span>
            </button>
            <button
              onClick={() => navigate('/ilaclar')}
              className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-left text-xs font-bold transition-colors cursor-pointer flex items-center justify-between group"
            >
              <span className="flex items-center gap-1.5 text-zinc-800 group-hover:text-white"><Pill size={13} strokeWidth={2.2} /> Kurum Ecza Dolabı & İlaç Listesi</span>
              <span className="text-zinc-400 group-hover:text-white">→</span>
            </button>
            <button
              onClick={() => navigate('/vardiya-takvim')}
              className="w-full p-2.5 rounded-lg bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 text-left text-xs font-bold transition-colors cursor-pointer flex items-center justify-between group"
            >
              <span className="flex items-center gap-1.5 text-zinc-800 group-hover:text-white"><CalendarDays size={13} strokeWidth={2.2} /> Hekim & Hemşire Nöbet Çizelgesi</span>
              <span className="text-zinc-400 group-hover:text-white">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoktorDashboard;
