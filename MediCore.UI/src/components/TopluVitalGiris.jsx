import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Stethoscope, Save, Volume2 } from 'lucide-react';
import { API_BASE as API_ROOT } from '../config/api';
import { playAlarmSound } from '../utils/sound';

const API_BASE = `${API_ROOT}/VitalBulgu`;

const TopluVitalGiris = () => {
  const { getAuthHeaders } = useAuth();
  const { showToast } = useToast();

  const [hastalar, setHastalar] = useState([]);
  const [formlar, setFormlar] = useState({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  const [katFiltresi, setKatFiltresi] = useState('Tumu');

  const verileriGetir = useCallback(async (showLoading = false) => {
    if (showLoading) setYukleniyor(true);
    try {
      const res = await fetch(`${API_BASE}/son-durumlar`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHastalar(data);

        setFormlar(prev => {
          const nextForm = { ...prev };
          data.forEach(h => {
            if (!nextForm[h.hastaId]) {
              nextForm[h.hastaId] = {
                hastaId: h.hastaId,
                nabizBPM: '',
                tansiyonSistol: '',
                tansiyonDiyastol: '',
                atesC: '',
                saturasyonYuzdesi: '',
                soluSayisi: ''
              };
            }
          });
          return nextForm;
        });
      } else {
        showToast('Vital durumları yüklenemedi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Sunucu bağlantı hatası.', 'error');
    } finally {
      if (showLoading) setYukleniyor(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    verileriGetir(true);
  }, [verileriGetir]);

  const handleChange = (hastaId, alan, deger) => {
    setFormlar(prev => ({
      ...prev,
      [hastaId]: {
        ...prev[hastaId],
        [alan]: deger
      }
    }));
  };

  const kaydet = async () => {
    const listToSend = Object.values(formlar)
      .filter(f => f.nabizBPM || f.tansiyonSistol || f.atesC || f.saturasyonYuzdesi || f.soluSayisi)
      .map(f => ({
        hastaId: f.hastaId,
        nabizBPM: f.nabizBPM ? parseInt(f.nabizBPM) : null,
        tansiyonSistol: f.tansiyonSistol ? parseInt(f.tansiyonSistol) : null,
        tansiyonDiyastol: f.tansiyonDiyastol ? parseInt(f.tansiyonDiyastol) : null,
        atesC: f.atesC ? parseFloat(f.atesC) : null,
        saturasyonYuzdesi: f.saturasyonYuzdesi ? parseInt(f.saturasyonYuzdesi) : null,
        soluSayisi: f.soluSayisi ? parseInt(f.soluSayisi) : null
      }));

    if (listToSend.length === 0) {
      showToast('Lütfen en az bir hasta için ölçüm değeri giriniz.', 'warning');
      return;
    }

    setKaydediliyor(true);
    try {
      const res = await fetch(`${API_BASE}/toplu`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listToSend)
      });

      if (res.ok) {
        const json = await res.json();
        showToast(json.mesaj || 'Vital ölçümleri başarıyla kaydedildi.', 'success');
        
        const resetForm = {};
        hastalar.forEach(h => {
          resetForm[h.hastaId] = {
            hastaId: h.hastaId,
            nabizBPM: '',
            tansiyonSistol: '',
            tansiyonDiyastol: '',
            atesC: '',
            saturasyonYuzdesi: '',
            soluSayisi: ''
          };
        });
        setFormlar(resetForm);
        verileriGetir(false);
      } else {
        showToast('Kayıt sırasında bir hata oluştu.', 'error');
      }
    } catch {
      showToast('Sunucu bağlantı hatası.', 'error');
    } finally {
      setKaydediliyor(false);
    }
  };

  const filtrelenmisHastalar = hastalar.filter(h => {
    const tamAd = `${h.ad} ${h.soyad}`.toLowerCase();
    const oda = (h.odaNo || '').toLowerCase();
    const no = (h.hastaNo || '').toLowerCase();
    const aramaUygun = tamAd.includes(aramaMetni.toLowerCase()) || oda.includes(aramaMetni.toLowerCase()) || no.includes(aramaMetni.toLowerCase());

    const katNo = (h.odaNo || '')[0];
    const katUygun = katFiltresi === 'Tumu' || katNo === katFiltresi;

    return aramaUygun && katUygun;
  });

  const doldurulanSayisi = Object.values(formlar).filter(
    f => f.nabizBPM || f.tansiyonSistol || f.atesC || f.saturasyonYuzdesi || f.soluSayisi
  ).length;

  return (
    <div className="space-y-3.5 font-sans pb-12 text-primary max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BİLGİ & KAYDETME ÇUBUĞU ── */}
      <div className="bg-white rounded-xl border border-primary p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Stethoscope size={20} strokeWidth={2} className="text-primary shrink-0" />
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
              Toplu Vital Ölçüm Tablosu
            </h1>
            <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
              Kat/Oda Bazında Seri Ölçüm Matrisi • {filtrelenmisHastalar.length} Sakin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => playAlarmSound('alert')}
            className="h-8 px-3 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
            title="Kritik Alarm Sesini Test Et"
          >
            <Volume2 size={14} strokeWidth={2.4} className="text-amber-600" />
            <span>Alarm Sesini Sına</span>
          </button>

          <button
            onClick={kaydet}
            disabled={kaydediliyor || doldurulanSayisi === 0}
            className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-30 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            {kaydediliyor ? (
              <span>Kaydediliyor...</span>
            ) : (
              <>
                <Save size={13} strokeWidth={2.2} />
                <span>{doldurulanSayisi > 0 ? `${doldurulanSayisi} Ölçümü Kaydet` : 'Ölçüleri Kaydet'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. MONOKROM FİLTRE VE ARAMA ŞERİDİ ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-primary p-2 shadow-2xs">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Sakin Adı, Oda No veya Dosya No Ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-300 text-xs font-bold text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={katFiltresi}
          onChange={(e) => setKatFiltresi(e.target.value)}
          className="h-8 px-2.5 rounded-lg bg-white border border-zinc-400 text-xs font-bold text-zinc-800 cursor-pointer focus:outline-none"
        >
          <option value="Tumu">Tüm Katlar</option>
          <option value="1">1. Kat</option>
          <option value="2">2. Kat</option>
          <option value="3">3. Kat</option>
        </select>

        <span className="text-[11px] font-mono font-bold px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-300">
          <b>{filtrelenmisHastalar.length}</b> Sakin
        </span>
      </div>

      {/* ── 3. KOMPAKT & YÜKSEK YOĞUNLUKLU MATRİS TABLO ── */}
      {yukleniyor ? (
        <div className="p-12 text-center text-xs font-bold text-zinc-500 font-mono flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Sakin listesi hazırlanıyor...</span>
        </div>
      ) : filtrelenmisHastalar.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary p-8 text-center text-xs font-bold text-zinc-500 uppercase">
          Filtreye uygun sakin bulunamadı.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-zinc-100/90 border-b border-primary text-primary uppercase text-[10px] font-black tracking-wider">
                <th className="py-2.5 px-3 border-r border-zinc-300 w-24">Oda / Yatak</th>
                <th className="py-2.5 px-3 border-r border-zinc-300">Bakım Sakini</th>
                <th className="py-2.5 px-3 border-r border-zinc-300 w-44">Son Ölçüm</th>
                <th className="py-2.5 px-2 border-r border-zinc-300 w-36 text-center">Tansiyon (Sys / Dia)</th>
                <th className="py-2.5 px-2 border-r border-zinc-300 w-24 text-center">Nabız</th>
                <th className="py-2.5 px-2 border-r border-zinc-300 w-24 text-center">Ateş (°C)</th>
                <th className="py-2.5 px-2 border-r border-zinc-300 w-24 text-center">SpO₂ (%)</th>
                <th className="py-2.5 px-2 w-20 text-center">Solunum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {filtrelenmisHastalar.map((h, idx) => {
                const form = formlar[h.hastaId] || {};
                const son = h.sonVital;

                const sysNum = parseInt(form.tansiyonSistol);
                const atesNum = parseFloat(form.atesC);
                const spo2Num = parseInt(form.saturasyonYuzdesi);
                const nabizNum = parseInt(form.nabizBPM);

                const sysAnormal = sysNum >= 140 || (sysNum && sysNum <= 90);
                const atesAnormal = atesNum >= 38.0;
                const spo2Anormal = spo2Num && spo2Num <= 92;
                const nabizAnormal = nabizNum >= 100 || (nabizNum && nabizNum <= 55);

                return (
                  <tr key={h.hastaId} className={`hover:bg-zinc-50 transition-colors ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                    {/* Oda & Yatak */}
                    <td className="py-1 px-3 border-r border-zinc-200 font-mono font-black text-primary text-[11px]">
                      Oda {h.odaNo || '—'}/{h.yatakNo || '—'}
                    </td>

                    {/* Sakin Bilgisi */}
                    <td className="py-1 px-3 border-r border-zinc-200">
                      <div className="font-bold text-primary text-xs leading-tight">
                        {h.ad} {h.soyad}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium truncate max-w-[180px]">
                        {h.hastalik || 'Rutin Takip'}
                      </div>
                    </td>

                    {/* Son Ölçüm */}
                    <td className="py-1 px-3 border-r border-zinc-200 font-mono text-[10px]">
                      {son ? (
                        <div className="leading-tight">
                          <span className="font-bold text-primary">
                            {son.tansiyonSistol || '—'}/{son.tansiyonDiyastol || '—'} • {son.nabizBPM || '—'}bpm • {son.atesC || '—'}°C
                          </span>
                          <span className="text-zinc-500 block text-[9px]">
                            {new Date(son.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ({son.kullaniciAd})
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Ölçüm yok</span>
                      )}
                    </td>

                    {/* Tansiyon Giriş */}
                    <td className="p-1 border-r border-zinc-200">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          placeholder="Sys"
                          value={form.tansiyonSistol || ''}
                          onChange={(e) => handleChange(h.hastaId, 'tansiyonSistol', e.target.value)}
                          className={`w-12 h-7 px-1 rounded text-center text-xs font-mono font-bold border ${
                            sysAnormal ? 'bg-primary text-white border-primary' : 'bg-zinc-50 border-zinc-300 text-primary'
                          } focus:outline-none focus:border-primary`}
                        />
                        <span className="text-zinc-400 font-bold">/</span>
                        <input
                          type="number"
                          placeholder="Dia"
                          value={form.tansiyonDiyastol || ''}
                          onChange={(e) => handleChange(h.hastaId, 'tansiyonDiyastol', e.target.value)}
                          className="w-12 h-7 px-1 rounded text-center text-xs font-mono font-bold bg-zinc-50 border border-zinc-300 text-primary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </td>

                    {/* Nabız Giriş */}
                    <td className="p-1 border-r border-zinc-200 text-center">
                      <input
                        type="number"
                        placeholder="BPM"
                        value={form.nabizBPM || ''}
                        onChange={(e) => handleChange(h.hastaId, 'nabizBPM', e.target.value)}
                        className={`w-14 h-7 px-1 rounded text-center text-xs font-mono font-bold border ${
                          nabizAnormal ? 'bg-primary text-white border-primary' : 'bg-zinc-50 border-zinc-300 text-primary'
                        } focus:outline-none focus:border-primary`}
                      />
                    </td>

                    {/* Ateş Giriş */}
                    <td className="p-1 border-r border-zinc-200 text-center">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="°C"
                        value={form.atesC || ''}
                        onChange={(e) => handleChange(h.hastaId, 'atesC', e.target.value)}
                        className={`w-14 h-7 px-1 rounded text-center text-xs font-mono font-bold border ${
                          atesAnormal ? 'bg-primary text-white border-primary' : 'bg-zinc-50 border-zinc-300 text-primary'
                        } focus:outline-none focus:border-primary`}
                      />
                    </td>

                    {/* SpO2 Giriş */}
                    <td className="p-1 border-r border-zinc-200 text-center">
                      <input
                        type="number"
                        placeholder="%"
                        value={form.saturasyonYuzdesi || ''}
                        onChange={(e) => handleChange(h.hastaId, 'saturasyonYuzdesi', e.target.value)}
                        className={`w-14 h-7 px-1 rounded text-center text-xs font-mono font-bold border ${
                          spo2Anormal ? 'bg-primary text-white border-primary' : 'bg-zinc-50 border-zinc-300 text-primary'
                        } focus:outline-none focus:border-primary`}
                      />
                    </td>

                    {/* Solunum Giriş */}
                    <td className="p-1 text-center">
                      <input
                        type="number"
                        placeholder="/dk"
                        value={form.soluSayisi || ''}
                        onChange={(e) => handleChange(h.hastaId, 'soluSayisi', e.target.value)}
                        className="w-12 h-7 px-1 rounded text-center text-xs font-mono font-bold bg-zinc-50 border border-zinc-300 text-primary focus:outline-none focus:border-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopluVitalGiris;
