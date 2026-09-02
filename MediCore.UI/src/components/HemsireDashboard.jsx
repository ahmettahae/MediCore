import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, Stethoscope, FileText, Users, Pin, Megaphone, Check, Activity, ArrowRight } from 'lucide-react';
import { API_BASE } from '../config/api';

const HemsireDashboard = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [marOzet, setMarOzet] = useState(null);
  const [nobetler, setNobetler] = useState([]);
  const [bekleyenVitaller, setBekleyenVitaller] = useState([]);
  const [duyurular, setDuyurular] = useState([]);
  const [uyarilar, setUyarilar] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const verileriGetir = useCallback(async (sessiz = false) => {
    if (!sessiz) setYukleniyor(true);
    const h = getAuthHeaders();
    try {
      const bugunStr = new Date().toISOString().split('T')[0];
      const [marRes, nobetRes, vitalRes, duyuruRes, uyarilarRes] = await Promise.all([
        fetch(`${API_BASE}/IlacUygulama/ozet?tarih=${bugunStr}`, { headers: h }),
        fetch(`${API_BASE}/Nobet/gunluk?tarih=${bugunStr}`, { headers: h }),
        fetch(`${API_BASE}/VitalBulgu/son-durumlar`, { headers: h }),
        fetch(`${API_BASE}/Duyuru`, { headers: h }),
        fetch(`${API_BASE}/Dashboard/uyarilar`, { headers: h })
      ]);

      if (marRes.ok) setMarOzet(await marRes.json());
      if (nobetRes.ok) setNobetler(await nobetRes.json());
      if (uyarilarRes.ok) setUyarilar(await uyarilarRes.json());
      if (vitalRes.ok) {
        const tumVitaller = await vitalRes.json();
        const bugunTarihStr = new Date().toLocaleDateString('tr-TR');
        const olculmeyenler = tumVitaller.filter(v => {
          if (!v.sonVital) return true;
          const olcumTarih = new Date(v.sonVital.tarih).toLocaleDateString('tr-TR');
          return olcumTarih !== bugunTarihStr;
        });
        setBekleyenVitaller(olculmeyenler);
      }
      if (duyuruRes.ok) setDuyurular(await duyuruRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    verileriGetir(false);

    // Canlı Sayı Güncelleme (3 saniyede bir ekranı titretmeden sayıları arka planda otomatik yeniler)
    const timer = setInterval(() => {
      verileriGetir(true);
    }, 3000);

    return () => clearInterval(timer);
  }, [verileriGetir]);

  const aktifVardiyaHesapla = () => {
    const saat = new Date().getHours();
    if (saat >= 8 && saat < 16) return { tur: 'Gündüz Vardiyası', saatler: '08:00 - 16:00', kod: 'GÜNDÜZ' };
    if (saat >= 16 && saat <= 23) return { tur: 'Akşam Vardiyası', saatler: '16:00 - 24:00', kod: 'AKŞAM' };
    return { tur: 'Gece Nöbeti', saatler: '00:00 - 08:00', kod: 'GECE' };
  };

  const vardiya = aktifVardiyaHesapla();
  const bugunTarihFormat = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const toplamPlan = marOzet?.toplamPlanlanan || 70;
  const toplamVerilen = (marOzet?.sabahVerilen || 0) + (marOzet?.ogleVerilen || 0) + (marOzet?.aksamVerilen || 0) + (marOzet?.geceVerilen || 0);
  const marYuzde = toplamPlan > 0 ? Math.min(100, Math.round((toplamVerilen / toplamPlan) * 100)) : 0;

  return (
    <div className="space-y-4 font-sans pb-16 max-w-6xl mx-auto">

      {/* ── BÖLÜM 1: ÜST HERO & VARDİYA BİLGİSİ ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            {bugunTarihFormat}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black text-zinc-900 dark:text-slate-100 tracking-tight">
              Hemşire {kullanici?.ad} {kullanici?.soyad}
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-black uppercase font-mono tracking-wider shadow-2xs">
              {vardiya.tur} • {vardiya.saatler}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-slate-400 font-medium">
            Klinik takip masası ve servis bakım operasyonları
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/ilac-dagitim')}
            className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Pill size={14} strokeWidth={2.2} />
            <span>İlaç Dağıtımı (MAR)</span>
          </button>
          <button
            onClick={() => navigate('/toplu-vital')}
            className="h-9 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Stethoscope size={14} strokeWidth={2.2} />
            <span>Toplu Vital</span>
          </button>
          <button
            onClick={() => navigate('/vardiya-raporu')}
            className="h-9 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <FileText size={14} strokeWidth={2.2} />
            <span>Nöbet Raporu</span>
          </button>
        </div>
      </div>

      {/* ── BÖLÜM 2: 4 ÖĞÜN MAR ÇİZELGESİ ── */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary dark:text-slate-100 font-mono">
              İlaç Dağıtım Çizelgesi (MAR)
            </span>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-slate-400 font-bold">
              • %{marYuzde} Tamamlandı ({toplamVerilen}/{toplamPlan})
            </span>
          </div>
          <button
            onClick={() => navigate('/ilac-dagitim')}
            className="text-xs font-bold text-primary dark:text-sky-400 hover:underline font-mono"
          >
            Tüm Çizelge →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'Sabah', etiket: 'Sabah İlaçları', saat: '08:00', verilen: marOzet?.sabahVerilen ?? 0 },
            { id: 'Öğle', etiket: 'Öğle İlaçları', saat: '13:00', verilen: marOzet?.ogleVerilen ?? 0 },
            { id: 'Akşam', etiket: 'Akşam İlaçları', saat: '19:00', verilen: marOzet?.aksamVerilen ?? 0 },
            { id: 'Gece', etiket: 'Gece İlaçları', saat: '22:00', verilen: marOzet?.geceVerilen ?? 0 },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => navigate('/ilac-dagitim')}
              className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400">
                <span className="text-xs font-bold text-zinc-800 dark:text-slate-200">{item.etiket}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  {item.saat}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div className="text-xl font-black text-primary dark:text-slate-100 font-mono tracking-tight">
                  {item.verilen} <span className="text-xs font-normal text-zinc-500 dark:text-slate-400">verildi</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 dark:text-slate-400 hover:text-primary dark:hover:text-sky-400 font-mono">
                  Görüntüle →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BÖLÜM 3: TAKİP BEKLEYENLER & NÖBETÇİ EKİP (2 KOLONLU DÜZEN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">

        {/* Sol 2 Kolon: Ölçüm Bekleyen Sakinler */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-3.5 py-2.5 bg-[#F0F4F8] dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-primary dark:text-slate-100 font-mono">
                Bugün Vital Ölçümü Bekleyen Sakinler ({bekleyenVitaller.length})
              </h2>
            </div>
            {bekleyenVitaller.length > 0 && (
              <button
                onClick={() => navigate('/toplu-vital')}
                className="text-[11px] font-bold text-primary dark:text-sky-400 hover:underline cursor-pointer font-mono"
              >
                Toplu Giriş Yap →
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto bg-white dark:bg-slate-900">
            {yukleniyor ? (
              <div className="p-6 text-center text-xs text-zinc-500 dark:text-slate-400 font-mono">Yükleniyor...</div>
            ) : bekleyenVitaller.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-zinc-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <Check size={13} strokeWidth={2.5} className="text-emerald-500" /> Bugün tüm sakinlerin vital kontrolleri tamamlandı.
              </div>
            ) : (
              bekleyenVitaller.map(h => (
                <div
                  key={h.hastaId}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-primary text-white shadow-2xs">
                      Oda {h.odaNo || '—'}/{h.yatakNo || '—'}
                    </span>
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-slate-100">{h.ad} {h.soyad}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-slate-400 ml-1.5 font-medium">({h.hastalik || 'Rutin Takip'})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/hastalar/${h.hastaId}`)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    Ölçüm Yap →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ 1 Kolon: Nöbetçi Ekip & Hızlı Görevler */}
        <div className="space-y-3.5">

          {/* Nöbetçi Ekip Kartı */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[#F0F4F8] dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary dark:text-slate-100 flex items-center gap-1.5 font-mono">
                <Users size={13} strokeWidth={2.2} />
                <span>Günün Nöbetçi Ekibi</span>
              </h3>
            </div>
            <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {nobetler.length === 0 ? (
                <div className="text-xs text-zinc-500 dark:text-slate-400 py-2 text-center">Nöbet kaydı bulunamadı.</div>
              ) : (
                nobetler.map(n => (
                  <div key={n.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-slate-100">{n.hemsireAd} {n.hemsireSoyad}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-slate-400 font-medium font-mono">{n.vardiyaTuru} Vardiyası</div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 shadow-2xs">
                      {n.hemsireTelefon || '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Hızlı Bağlantılar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-1.5 shadow-2xs">
            <button
              onClick={() => navigate('/gorev-panosu')}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-bold text-zinc-800 dark:text-slate-200 transition-colors flex items-center justify-between cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              <span className="flex items-center gap-1.5"><Pin size={13} strokeWidth={2.2} /> Günlük Bakım Görevleri</span>
              <span className="text-zinc-400 dark:text-slate-500">→</span>
            </button>
            <button
              onClick={() => navigate('/duyurular')}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-bold text-zinc-800 dark:text-slate-200 transition-colors flex items-center justify-between cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              <span className="flex items-center gap-1.5"><Megaphone size={13} strokeWidth={2.2} /> Kurum Duyuruları</span>
              <span className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
                {duyurular.length}
              </span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default HemsireDashboard;
