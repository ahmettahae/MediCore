import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Heart, Stethoscope, Thermometer, Wind, Activity,
  ClipboardList, Pill, FileText, BarChart2, Ambulance,
  Printer, AlertCircle, X, Check, Salad, Siren, FileSpreadsheet
} from 'lucide-react';
import { exportToCsv } from '../utils/exportUtils';
import { API_BASE } from '../config/api';

const BilgiSatiri = ({ etiket, deger, vurgu = false }) => (
  <div className="flex flex-col gap-0.5 border-b border-zinc-200 pb-1.5 font-sans">
    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{etiket}</span>
    <span className={`text-xs font-bold ${vurgu ? 'text-zinc-900' : 'text-primary'}`}>
      {deger || <span className="text-zinc-400 font-normal">—</span>}
    </span>
  </div>
);

const VitalKart = ({ etiket, deger, birim, Ikon }) => {
  return (
    <div className="p-3 bg-white rounded-xl border border-primary shadow-2xs flex flex-col items-center justify-center text-center">
      <div className="mb-0.5 text-primary">{Ikon && <Ikon size={16} strokeWidth={2} />}</div>
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">{etiket}</div>
      <div className="text-sm font-black text-primary font-mono mt-0.5">
        {deger ?? '—'} <span className="text-[10px] font-normal text-zinc-500">{deger ? birim : ''}</span>
      </div>
    </div>
  );
};

const HastaDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();

  const [hasta, setHasta] = useState(null);
  const [notlar, setNotlar] = useState([]);
  const [vitaller, setVitaller] = useState([]);
  const [hastaIlaclari, setHastaIlaclari] = useState([]);
  const [sevkler, setSevkler] = useState([]);
  const [muayeneler, setMuayeneler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState('bilgiler');
  const [yukleniyor, setYukleniyor] = useState(true);

  // Not ekleme
  const [yeniNot, setYeniNot] = useState('');
  const [notKaydediliyor, setNotKaydediliyor] = useState(false);

  // Vital ekleme
  const [vitalForm, setVitalForm] = useState({
    nabizBPM: '', tansiyonSistol: '', tansiyonDiyastol: '',
    atesC: '', soluSayisi: '', saturasyonYuzdesi: ''
  });
  const [vitalModal, setVitalModal] = useState(false);

  // İlaç atama
  const [ilacListesi, setIlacListesi] = useState([]);
  const [ilacModal, setIlacModal] = useState(false);
  const [ilacForm, setIlacForm] = useState({
    ilacId: '', dozaj: '', kullanimSikligi: '', kullanimSekli: '', bitisTarihi: ''
  });

  // Hastaneye Sevk Modalı
  const [sevkModal, setSevkModal] = useState(false);
  const [sevkForm, setSevkForm] = useState({
    sevkEdilenHastane: 'Ankara Şehir Hastanesi',
    sevkNedeni: '',
    sevkTipi: 'Acil (112 Ambulans)',
    doktorNotu: ''
  });

  const verileriGetir = useCallback(async () => {
    setYukleniyor(true);
    const h = getAuthHeaders();
    try {
      const [hastaRes, notlarRes, vitallerRes, ilaclarRes, sevkRes, muayeneRes] = await Promise.all([
        fetch(`${API_BASE}/Hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/HemsireNotu/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/VitalBulgu/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/HastaIlac/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/HastahaneSevk/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/Muayene/hasta/${id}`, { headers: h }),
      ]);
      if (hastaRes.status === 401) { navigate('/login'); return; }
      if (!hastaRes.ok) { navigate('/hastalar'); return; }

      setHasta(await hastaRes.json());
      setNotlar(notlarRes.ok ? await notlarRes.json() : []);
      setVitaller(vitallerRes.ok ? await vitallerRes.json() : []);
      setHastaIlaclari(ilaclarRes.ok ? await ilaclarRes.json() : []);
      setSevkler(sevkRes.ok ? await sevkRes.json() : []);
      setMuayeneler(muayeneRes.ok ? await muayeneRes.json() : []);
    } catch {
      showToast('Veriler yüklenirken bir hata oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [id, getAuthHeaders, navigate, showToast]);

  const ilacListesiniGetir = useCallback(async () => {
    const cevap = await fetch(`${API_BASE}/Ilac`, { headers: getAuthHeaders() });
    if (cevap.ok) setIlacListesi(await cevap.json());
  }, [getAuthHeaders]);

  useEffect(() => { verileriGetir(); }, [verileriGetir]);

  const yas = (dt) => {
    if (!dt) return null;
    return new Date().getFullYear() - new Date(dt).getFullYear();
  };

  const tarihFormat = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Not kaydet
  const handleNotKaydet = async (e) => {
    e.preventDefault();
    if (!yeniNot.trim()) return;
    setNotKaydediliyor(true);
    try {
      const cevap = await fetch(`${API_BASE}/HemsireNotu`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hastaId: parseInt(id), not: yeniNot })
      });
      if (cevap.ok) { 
        setYeniNot(''); 
        verileriGetir(); 
        showToast('Not başarıyla kaydedildi.', 'success');
      } else {
        showToast('Not kaydedilemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setNotKaydediliyor(false);
    }
  };

  // Vital kaydet
  const handleVitalKaydet = async (e) => {
    e.preventDefault();
    const payload = {
      hastaId: parseInt(id),
      nabizBPM: vitalForm.nabizBPM ? parseInt(vitalForm.nabizBPM) : null,
      tansiyonSistol: vitalForm.tansiyonSistol ? parseInt(vitalForm.tansiyonSistol) : null,
      tansiyonDiyastol: vitalForm.tansiyonDiyastol ? parseInt(vitalForm.tansiyonDiyastol) : null,
      atesC: vitalForm.atesC ? parseFloat(vitalForm.atesC) : null,
      soluSayisi: vitalForm.soluSayisi ? parseInt(vitalForm.soluSayisi) : null,
      saturasyonYuzdesi: vitalForm.saturasyonYuzdesi ? parseInt(vitalForm.saturasyonYuzdesi) : null,
    };
    try {
      const cevap = await fetch(`${API_BASE}/VitalBulgu`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (cevap.ok) {
        setVitalModal(false);
        setVitalForm({ nabizBPM: '', tansiyonSistol: '', tansiyonDiyastol: '', atesC: '', soluSayisi: '', saturasyonYuzdesi: '' });
        verileriGetir();
        showToast('Vital bulgular kaydedildi.', 'success');
      } else {
        showToast('Vital kaydedilemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  // İlaç ata
  const handleIlacAta = async (e) => {
    e.preventDefault();
    const payload = {
      hastaId: parseInt(id),
      ilacId: parseInt(ilacForm.ilacId),
      dozaj: ilacForm.dozaj,
      kullanimSikligi: ilacForm.kullanimSikligi,
      kullanimSekli: ilacForm.kullanimSekli,
      bitisTarihi: ilacForm.bitisTarihi || null,
    };
    try {
      const cevap = await fetch(`${API_BASE}/HastaIlac`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (cevap.ok) {
        setIlacModal(false);
        setIlacForm({ ilacId: '', dozaj: '', kullanimSikligi: '', kullanimSekli: '', bitisTarihi: '' });
        verileriGetir();
        showToast('İlaç atandı.', 'success');
      } else {
        showToast('İlaç atanamadı.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  // Hastaneye Sevk İşlemi
  const handleSevkKaydet = async (e) => {
    e.preventDefault();
    const payload = {
      ...sevkForm,
      hastaId: parseInt(id)
    };
    try {
      const cevap = await fetch(`${API_BASE}/HastahaneSevk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (cevap.ok) {
        setSevkModal(false);
        setSevkForm({ sevkEdilenHastane: 'Ankara Şehir Hastanesi', sevkNedeni: '', sevkTipi: 'Acil (112 Ambulans)', doktorNotu: '' });
        verileriGetir();
        showToast('Sevk başarıyla oluşturuldu.', 'success');
      } else {
        showToast('Sevk oluşturulamadı.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  const handleUygulaToggle = async (kayitId) => {
    try {
      const cevap = await fetch(`${API_BASE}/HastaIlac/${kayitId}/uygula`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      if (cevap.ok) {
        verileriGetir();
        showToast('İlaç uygulandı olarak işaretlendi.', 'success');
      }
    } catch {
      showToast('İşlem başarısız.', 'error');
    }
  };

  const handleIlacKaldir = async (kayitId) => {
    try {
      const cevap = await fetch(`${API_BASE}/HastaIlac/${kayitId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (cevap.ok) {
        verileriGetir();
        showToast('İlaç kaldırıldı.', 'info');
      }
    } catch {
      showToast('İşlem başarısız.', 'error');
    }
  };

  if (yukleniyor) return <div className="text-center py-16 text-zinc-500 font-mono text-xs uppercase animate-pulse">Sakin Bilgileri Yükleniyor...</div>;
  if (!hasta) return null;

  const sonVital = vitaller[0];
  const aktifIlaclar = hastaIlaclari.filter(i => i.aktifMi);

  const handleExcelExport = () => {
    if (!hasta) return;
    const headers = ['Bilgi Türü', 'Açıklama / Değer'];
    const rows = [
      ['Hasta Adı Soyadı', `${hasta.ad} ${hasta.soyad}`],
      ['TC Kimlik No', hasta.tcKimlikNo || ''],
      ['Hasta No', hasta.hastaNo || ''],
      ['Cinsiyet', hasta.cinsiyet || ''],
      ['Doğum Tarihi', hasta.dogumTarihi ? new Date(hasta.dogumTarihi).toLocaleDateString('tr-TR') : ''],
      ['Oda / Yatak', `${hasta.odaNo || '—'} / ${hasta.yatakNo || '—'}`],
      ['Durumu', hasta.durum || ''],
      ['Hastalık / Tanı', hasta.hastalik || ''],
      ['Alerjileri', hasta.alerjiBilgisi || ''],
      ['Hasta Yakını', `${hasta.hastaYakiniAd || ''} (${hasta.hastaYakiniTelefon || ''})`],
      ['Son Ateş', sonVital?.atesC ? `${sonVital.atesC}°C` : '—'],
      ['Son Nabız', sonVital?.nabizBPM ? `${sonVital.nabizBPM} BPM` : '—'],
      ['Son Tansiyon', sonVital?.tansiyonSistol ? `${sonVital.tansiyonSistol} mmHg` : '—'],
      ['Son SpO2', sonVital?.saturasyonYuzdesi ? `%${sonVital.saturasyonYuzdesi}` : '—'],
      ['Aktif İlaç Sayısı', aktifIlaclar.length],
    ];
    exportToCsv(`MediCore_Hasta_Karti_${hasta.ad}_${hasta.soyad}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const sekmeler = [
    { id: 'bilgiler',   etiket: 'Genel Bilgiler' },
    { id: 'ilaclar',    etiket: `İlaç Tedavileri (${aktifIlaclar.length})` },
    { id: 'viziteler',  etiket: `Hekim Viziteleri (${muayeneler.length})` },
    { id: 'notlar',     etiket: `Hemşire Notları (${notlar.length})` },
    { id: 'vitaller',   etiket: `Vital Bulgular (${vitaller.length})` },
    { id: 'sevkler',    etiket: `Hastane Sevkleri (${sevkler.length})` },
  ];

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & AKSİYON BARI ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/hastalar')} 
            className="h-8 px-2.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs transition-colors flex items-center shrink-0 cursor-pointer"
          >
            ← Sakinler
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-primary tracking-tight leading-none">
                {hasta.ad} {hasta.soyad}
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                hasta.durum === 'Aktif' || hasta.durum === 'Kurumda' || hasta.durum === 'Hastahanede' || hasta.durum === 'Hastanede' ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
              }`}>
                {hasta.durum === 'Aktif' ? 'Kurumda' : hasta.durum === 'Hastahanede' || hasta.durum === 'Hastanede' ? 'Hastanede' : hasta.durum}
              </span>
            </div>
            <p className="text-[11px] font-bold text-zinc-500 font-mono mt-0.5">
              {hasta.hastaNo || '—'} • {yas(hasta.dogumTarihi)} Yaş • {hasta.cinsiyet} • Oda: {hasta.odaNo || '—'} / Yatak: {hasta.yatakNo || '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExcelExport}
            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="h-8 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer size={14} strokeWidth={2.2} />
            <span>Epikriz &amp; Rapor</span>
          </button>
          {hasta.durum !== 'Hastahanede' && hasta.durum !== 'Hastanede' ? (
            <button 
              onClick={() => setSevkModal(true)} 
              className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <AlertCircle size={14} strokeWidth={2.2} />
              <span>112 Sevk</span>
            </button>
          ) : (
            <span className="h-8 px-3 rounded-lg bg-zinc-200 text-primary font-bold text-xs flex items-center font-mono border border-zinc-400">
              Hastanede Sevkli
            </span>
          )}
        </div>
      </div>

      {/* ── 2. SON VİTAL ÖZET ŞERİDİ ── */}
      {sonVital && (
        <div className="space-y-1.5">
          <div className="text-[11px] text-zinc-500 font-mono font-bold uppercase tracking-wide px-0.5">
            Son Hemşire Ölçümü — {tarihFormat(sonVital.tarih)}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <VitalKart etiket="Nabız" deger={sonVital.nabizBPM} birim="bpm" Ikon={Heart} />
            <VitalKart etiket="Tansiyon" deger={sonVital.tansiyonSistol && `${sonVital.tansiyonSistol}/${sonVital.tansiyonDiyastol}`} birim="mmHg" Ikon={Stethoscope} />
            <VitalKart etiket="Ateş" deger={sonVital.atesC} birim="°C" Ikon={Thermometer} />
            <VitalKart etiket="Solunum" deger={sonVital.soluSayisi} birim="/dk" Ikon={Wind} />
            <VitalKart etiket="SpO₂" deger={sonVital.saturasyonYuzdesi} birim="%" Ikon={Activity} />
          </div>
        </div>
      )}

      {/* ── 3. DETAY SEKME ALANI ── */}
      <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden">
        {/* Sekme Butonları */}
        <div className="flex border-b border-primary overflow-x-auto bg-zinc-100/90">
          {sekmeler.map(s => (
            <button 
              key={s.id} 
              onClick={() => setAktifSekme(s.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-r border-zinc-300 font-mono cursor-pointer ${
                aktifSekme === s.id
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {s.etiket}
            </button>
          ))}
        </div>

        {/* ── BİLGİLER SEKME İÇERİĞİ ── */}
        {aktifSekme === 'bilgiler' && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            <BilgiSatiri etiket="Sakin No" deger={hasta.hastaNo} />
            <BilgiSatiri etiket="TC Kimlik No" deger={hasta.tcKimlikNo} />
            <BilgiSatiri etiket="Doğum Tarihi" deger={hasta.dogumTarihi ? new Date(hasta.dogumTarihi).toLocaleDateString('tr-TR') : null} />
            <BilgiSatiri etiket="Cinsiyet" deger={hasta.cinsiyet} />
            <BilgiSatiri etiket="Telefon" deger={hasta.telefon} />
            <BilgiSatiri etiket="Giriş Tarihi" deger={tarihFormat(hasta.girisTarihi)} />
            
            <div className="col-span-2 sm:col-span-3 border-t border-zinc-200 my-1"></div>
            
            <BilgiSatiri etiket="Vasi / Yakın Adı" deger={hasta.hastaYakiniAd} />
            <BilgiSatiri etiket="Vasi / Yakın Telefonu" deger={hasta.hastaYakiniTelefon} />
            <BilgiSatiri etiket="Oda / Yatak" deger={`Oda: ${hasta.odaNo || '—'} / Yatak: ${hasta.yatakNo || '—'}`} />
            
            <div className="col-span-2 sm:col-span-3">
              <BilgiSatiri etiket="Primer Tanı & Kronik Rahatsızlıklar" deger={hasta.hastalik} />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <BilgiSatiri etiket="Alerji & Kontrendikasyon Bilgisi" deger={hasta.alerjiBilgisi} vurgu={!!hasta.alerjiBilgisi && hasta.alerjiBilgisi !== 'Yok'} />
            </div>
          </div>
        )}

        {/* ── İLAÇLAR SEKME İÇERİĞİ ── */}
        {aktifSekme === 'ilaclar' && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <span className="text-xs font-black text-primary uppercase tracking-wider font-mono">
                Aktif İlaç Rutinleri & Protokolleri ({aktifIlaclar.length})
              </span>
              {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Doktor') && (
                <button
                  onClick={() => { ilacListesiniGetir(); setIlacModal(true); }}
                  className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  + İlaç Tanımla
                </button>
              )}
            </div>

            {aktifIlaclar.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-bold">
                Tanımlı aktif ilaç tedavisi bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2.5">
                {aktifIlaclar.map(kayit => (
                  <div 
                    key={kayit.id}
                    className={`flex items-center gap-3.5 p-3 rounded-lg border transition-colors ${
                      kayit.uygulandiMi
                        ? 'bg-zinc-50 border-zinc-300'
                        : 'bg-white border-zinc-300 hover:border-primary'
                    }`}
                  >
                    <button
                      onClick={() => handleUygulaToggle(kayit.id)}
                      className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border transition-all cursor-pointer text-xs font-black ${
                        kayit.uygulandiMi
                          ? 'bg-primary border-primary text-white'
                          : 'border-zinc-400 bg-white hover:bg-zinc-100 text-zinc-400 hover:text-primary'
                      }`}
                      title={kayit.uygulandiMi ? 'Uygulandı — geri almak için tıkla' : 'Hemşire Uygulandı Olarak İşaretle'}
                    >
                      {kayit.uygulandiMi ? <Check size={12} strokeWidth={2.5} /> : ''}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-primary">{kayit.ilacAd}</span>
                        {kayit.ilacForm && (
                          <span className="px-1.5 py-0.2 rounded border border-zinc-300 bg-zinc-100 text-zinc-700 text-[9px] font-bold uppercase font-mono">
                            {kayit.ilacForm}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-600 font-medium mt-0.5">
                        {kayit.dozaj && <span className="font-mono text-primary font-bold">{kayit.dozaj}</span>}
                        {kayit.kullanimSikligi && <span> · {kayit.kullanimSikligi}</span>}
                        {kayit.kullanimSekli && <span> · {kayit.kullanimSekli}</span>}
                      </div>
                      {kayit.uygulandiMi && kayit.uygulanmaTarihi && (
                        <div className="text-[9px] font-mono text-zinc-500 mt-1">
                          <span className="flex items-center gap-1"><Check size={10} strokeWidth={2.5} /> {tarihFormat(kayit.uygulanmaTarihi)} tarihinde uygulandı</span>
                        </div>
                      )}
                    </div>

                    {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Doktor') && (
                      <div className="text-right flex-shrink-0">
                        <button 
                          onClick={() => handleIlacKaldir(kayit.id)}
                          className="text-[10px] font-bold uppercase bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Kaldır
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HEKİM VİZİTELERİ SEKME İÇERİĞİ ── */}
        {aktifSekme === 'viziteler' && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Kurum Hekimi Muayene ve Tedavi Kayıtları ({muayeneler.length})
              </span>
              {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Doktor') && (
                <button
                  onClick={() => navigate(`/vizite?hastaId=${id}`)}
                  className="h-8 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Stethoscope size={13} strokeWidth={2.2} />
                  <span>Muayene Masasına Git</span>
                </button>
              )}
            </div>

            {muayeneler.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-zinc-400 dark:text-slate-500 font-mono">
                Bu bakım sakini için henüz hekim vizite/muayene kaydı girilmemiştir.
              </div>
            ) : (
              <div className="space-y-3">
                {muayeneler.map(m => {
                  const isKritik = m.durum === 'Kritik';
                  const isSevk = m.durum === 'SevkPlanlandi';
                  const isTakip = m.durum === 'TakipGerekli';

                  const durumRozetStili = isKritik
                    ? 'bg-red-500 text-white'
                    : isSevk
                      ? 'bg-amber-500 text-white'
                      : isTakip
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 border border-zinc-300 dark:border-slate-700';

                  return (
                    <div key={m.id} className="bg-white dark:bg-slate-900 border border-zinc-300 dark:border-slate-700 rounded-xl p-4 space-y-2.5 shadow-2xs hover:border-primary transition-colors">
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-zinc-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-primary dark:text-slate-100">{m.tani}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono shadow-2xs ${durumRozetStili}`}>
                            {m.durum === 'SevkPlanlandi' ? 'Sevk Planlandı' : m.durum === 'TakipGerekli' ? 'Takip Gerekli' : m.durum}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 dark:text-slate-400">
                          {new Date(m.muayeneTarihi).toLocaleString('tr-TR')} • {m.doktorAd}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="bg-zinc-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-zinc-200 dark:border-slate-700">
                          <span className="block font-mono text-[9px] uppercase text-zinc-500 dark:text-slate-400 mb-0.5 font-bold">Şikayet / Belirtiler:</span>
                          <p className="font-medium text-zinc-800 dark:text-slate-200">{m.sikayet || '—'}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-zinc-200 dark:border-slate-700">
                          <span className="block font-mono text-[9px] uppercase text-zinc-500 dark:text-slate-400 mb-0.5 font-bold">Klinik & Fizik Bulgular:</span>
                          <p className="font-medium text-zinc-800 dark:text-slate-200">{m.klinikBulgular || '—'}</p>
                        </div>
                      </div>

                      <div className="bg-zinc-100/80 dark:bg-slate-800 p-2.5 rounded-lg border border-zinc-300 dark:border-slate-700 text-xs">
                        <span className="block font-mono text-[9px] uppercase text-zinc-600 dark:text-slate-400 mb-0.5 font-bold">Tedavi Planı & Hemşirelik Direktifi:</span>
                        <p className="font-bold text-primary dark:text-slate-100 leading-relaxed">{m.tedaviPlani}</p>
                      </div>

                      {m.diyetVeBakimOnerisi && (
                        <div className="text-[11px] text-zinc-600 dark:text-slate-300 font-medium flex items-center gap-1.5 pt-0.5">
                          <Salad size={13} strokeWidth={2} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span><b>Diyet & Özel Bakım:</b> {m.diyetVeBakimOnerisi}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── HEMŞİRE NOTLARI SEKME İÇERİĞİ ── */}
        {aktifSekme === 'notlar' && (
          <div className="p-5 space-y-4">
            <form onSubmit={handleNotKaydet} className="flex gap-2">
              <textarea 
                rows={2} 
                placeholder="Hemşire günlük vardiya gözlem notu ekle..."
                className="flex-1 p-2.5 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none focus:border-primary resize-none bg-white"
                value={yeniNot}
                onChange={(e) => setYeniNot(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={notKaydediliyor || !yeniNot.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 self-end shrink-0 cursor-pointer shadow-2xs"
              >
                {notKaydediliyor ? '...' : 'Not Ekle'}
              </button>
            </form>

            {notlar.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-bold">Hemşire notu bulunmuyor.</div>
            ) : (
              <div className="space-y-2.5">
                {notlar.map(n => (
                  <div key={n.id} className="bg-white border border-zinc-300 p-3.5 rounded-xl shadow-2xs space-y-1.5">
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5 text-xs">
                      <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded font-mono uppercase">{n.kullaniciAd}</span>
                      <span className="text-[11px] font-mono text-zinc-500">{tarihFormat(n.tarih)}</span>
                    </div>
                    <p className="text-xs text-zinc-800 leading-relaxed">{n.not}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VİTAL BULGULAR SEKME İÇERİĞİ ── */}
        {aktifSekme === 'vitaller' && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <span className="text-xs font-black text-primary uppercase tracking-wider font-mono">
                Tüm Vital Ölçümler ({vitaller.length})
              </span>
              <button 
                onClick={() => setVitalModal(true)}
                className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
              >
                + Vital Ölçüm Gir
              </button>
            </div>

            {vitaller.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-zinc-400">
                Kayıtlı vital bulgu bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-300">
                <table className="w-full text-xs text-left text-primary border-collapse">
                  <thead className="bg-zinc-100 text-[10px] font-black uppercase tracking-wider border-b border-zinc-300 font-mono">
                    <tr>
                      <th className="px-3 py-2 border-r border-zinc-200">Tarih</th>
                      <th className="px-3 py-2 border-r border-zinc-200 text-center">Nabız</th>
                      <th className="px-3 py-2 border-r border-zinc-200 text-center">Tansiyon</th>
                      <th className="px-3 py-2 border-r border-zinc-200 text-center">Ateş</th>
                      <th className="px-3 py-2 border-r border-zinc-200 text-center">Solunum</th>
                      <th className="px-3 py-2 border-r border-zinc-200 text-center">SpO₂</th>
                      <th className="px-3 py-2">Ölçen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono">
                    {vitaller.map((v, idx) => (
                      <tr key={v.id} className={`hover:bg-zinc-50 transition-colors ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                        <td className="px-3 py-2 text-[11px] font-bold border-r border-zinc-200">{tarihFormat(v.tarih)}</td>
                        <td className="px-3 py-2 font-bold text-center border-r border-zinc-200">{v.nabizBPM ?? '—'} <span className="text-[9px] text-zinc-400">bpm</span></td>
                        <td className="px-3 py-2 font-bold text-center border-r border-zinc-200">{v.tansiyonSistol && v.tansiyonDiyastol ? `${v.tansiyonSistol}/${v.tansiyonDiyastol}` : '—'}</td>
                        <td className="px-3 py-2 font-bold text-center border-r border-zinc-200">{v.atesC ? `${v.atesC} °C` : '—'}</td>
                        <td className="px-3 py-2 font-bold text-center border-r border-zinc-200">{v.soluSayisi ?? '—'}</td>
                        <td className="px-3 py-2 font-bold text-center border-r border-zinc-200">{v.saturasyonYuzdesi ? `%${v.saturasyonYuzdesi}` : '—'}</td>
                        <td className="px-3 py-2 text-[11px] text-zinc-700 font-sans">{v.kullaniciAd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── HASTANE SEVKLERİ SEKME İÇERİĞİ ── */}
        {aktifSekme === 'sevkler' && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <span className="text-xs font-black text-primary uppercase tracking-wider font-mono">
                Dış Hastane Sevk ve Epikriz Kayıtları ({sevkler.length})
              </span>
              {kullanici?.rol === 'Bashekim' && hasta.durum !== 'Hastahanede' && hasta.durum !== 'Hastanede' && (
                <button 
                  onClick={() => setSevkModal(true)}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Siren size={13} strokeWidth={2.2} />
                  <span>Hastaneye Sevk Et</span>
                </button>
              )}
            </div>

            {sevkler.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-zinc-400">Hastaneye sevk geçmişi bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {sevkler.map(s => (
                  <div key={s.id} className="bg-white border border-zinc-300 rounded-xl p-4 space-y-2.5 shadow-2xs">
                    <div className="flex justify-between items-center border-b border-zinc-200 pb-1.5">
                      <span className="font-bold text-xs text-primary">{s.sevkEdilenHastane}</span>
                      <span className="text-[11px] font-mono text-zinc-500">{tarihFormat(s.sevkTarihi)}</span>
                    </div>
                    <div className="text-xs text-zinc-700">
                      <b className="uppercase text-[9px] font-mono text-zinc-500 block mb-0.5">Sevk Nedeni</b> 
                      <span className="font-medium text-primary">{s.sevkNedeni}</span>
                    </div>
                    {s.doktorNotu && (
                      <div className="text-xs text-zinc-700 border border-zinc-200 p-2 rounded-lg bg-zinc-50">
                        <b className="uppercase text-[9px] font-mono text-zinc-500 block mb-0.5">Hekim Notu</b> 
                        <span className="font-medium text-primary">{s.doktorNotu}</span>
                      </div>
                    )}
                    {s.geriDonusNotu && (
                      <div className="text-xs text-primary bg-zinc-100 border border-zinc-300 p-2 rounded-lg">
                        <b className="uppercase text-[9px] font-mono text-zinc-600 block mb-0.5">Dönüş Notu / Epikriz</b> 
                        <span className="font-bold">{s.geriDonusNotu}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── İLAÇ ATAMA MODALI ── */}
      {ilacModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="font-black text-primary uppercase tracking-wider text-xs font-mono">
                İlaç Tedavisi Ata — {hasta.ad} {hasta.soyad}
              </h3>
              <button onClick={() => setIlacModal(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleIlacAta} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">İlaç Seçiniz *</label>
                <select 
                  required
                  className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white cursor-pointer"
                  value={ilacForm.ilacId}
                  onChange={(e) => setIlacForm({ ...ilacForm, ilacId: e.target.value })}
                >
                  <option value="">İlaç Seçiniz...</option>
                  {ilacListesi.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.ad} {i.form ? `(${i.form})` : ''} {i.etkenMadde ? `— ${i.etkenMadde}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Doz Bilgisi *', alan: 'dozaj', placeholder: 'Örn: 1 Tablet, 500mg', required: true },
                { label: 'Kullanım Sıklığı', alan: 'kullanimSikligi', placeholder: 'Örn: Sabah-Akşam, Günde 3 kez' },
                { label: 'Kullanım Şekli', alan: 'kullanimSekli', placeholder: 'Örn: Tok karnına, Bol su ile' },
              ].map(({ label, alan, placeholder, required }) => (
                <div key={alan}>
                  <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">{label}</label>
                  <input 
                    type="text" 
                    required={required} 
                    placeholder={placeholder}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                    value={ilacForm[alan]}
                    onChange={(e) => setIlacForm({ ...ilacForm, [alan]: e.target.value })}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setIlacModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  Tedaviye Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HASTANEYE SEVK MODALI ── */}
      {sevkModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="font-black text-primary uppercase tracking-wider text-xs font-mono">112 Acil / Hastane Sevki Oluştur</h3>
              <button onClick={() => setSevkModal(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleSevkKaydet} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Sevk Edilen Hastane *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Örn: Ankara Şehir Hastanesi"
                  className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                  value={sevkForm.sevkEdilenHastane}
                  onChange={(e) => setSevkForm({ ...sevkForm, sevkEdilenHastane: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Sevk Tipi</label>
                <select
                  className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white cursor-pointer"
                  value={sevkForm.sevkTipi}
                  onChange={(e) => setSevkForm({ ...sevkForm, sevkTipi: e.target.value })}
                >
                  <option>Acil (112 Ambulans)</option>
                  <option>Planlı Sevk</option>
                  <option>Poliklinik Kontrolü</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Sevk Nedeni *</label>
                <textarea 
                  rows={2} 
                  required 
                  placeholder="Dispne, akut koroner şüphe..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none resize-none bg-white"
                  value={sevkForm.sevkNedeni}
                  onChange={(e) => setSevkForm({ ...sevkForm, sevkNedeni: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Kurum Hekim Notu</label>
                <textarea 
                  rows={2} 
                  placeholder="Hekim ilk müdahale notları..."
                  className="w-full p-2 border border-zinc-300 rounded-lg text-xs font-medium focus:outline-none resize-none bg-white"
                  value={sevkForm.doktorNotu}
                  onChange={(e) => setSevkForm({ ...sevkForm, doktorNotu: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setSevkModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  Sevk Et ve Bildir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VİTAL EKLEME MODALI ── */}
      {vitalModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="font-black text-primary uppercase tracking-wider text-xs font-mono">Vital Bulgu Ölçümü Gir</h3>
              <button onClick={() => setVitalModal(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleVitalKaydet} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Nabız (bpm)', alan: 'nabizBPM' },
                  { label: 'Tansiyon Sistolik', alan: 'tansiyonSistol' },
                  { label: 'Tansiyon Diastolik', alan: 'tansiyonDiyastol' },
                  { label: 'Ateş (°C)', alan: 'atesC' },
                  { label: 'Solunum (/dk)', alan: 'soluSayisi' },
                  { label: 'SpO₂ (%)', alan: 'saturasyonYuzdesi' },
                ].map(({ label, alan }) => (
                  <div key={alan}>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">{label}</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono"
                      value={vitalForm[alan]}
                      onChange={(e) => setVitalForm({ ...vitalForm, [alan]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  type="button" 
                  onClick={() => setVitalModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  Ölçümü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HastaDetay;
