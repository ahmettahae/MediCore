import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Stethoscope, ClipboardList, Pill, Check, X } from 'lucide-react';
import { API_BASE } from '../config/api';

const HekimVizite = () => {
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hastalar, setHastalar] = useState([]);
  const [secilenHastaId, setSecilenHastaId] = useState(searchParams.get('hastaId') || '');
  const [hastaDetay, setHastaDetay] = useState(null);
  const [gecmisMuayeneler, setGecmisMuayeneler] = useState([]);
  const [ilacKatalogu, setIlacKatalogu] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  // Muayene Form State
  const [muayeneForm, setMuayeneForm] = useState({
    sikayet: '',
    klinikBulgular: '',
    tani: '',
    tedaviPlani: '',
    diyetVeBakimOnerisi: '',
    kontrolTarihi: '',
    durum: 'Stabil'
  });

  // Hızlı Reçeteleme Ekleme
  const [receteModal, setReceteModal] = useState(false);
  const [yeniIlacForm, setYeniIlacForm] = useState({
    ilacId: '',
    dozaj: '1x1 (Günde 1 Defa)',
    kullanimSikligi: 'Tok Karnına',
    kullanimSekli: 'Ağızdan (Oral)',
    bitisTarihi: ''
  });

  // 1. Hasta Listesini Getir
  const hastalariGetir = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Hasta`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const aktifler = data.filter(h => h.durum === 'Aktif' || h.durum === 'Kurumda');
        setHastalar(aktifler);
        if (!secilenHastaId && aktifler.length > 0) {
          setSecilenHastaId(aktifler[0].id.toString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders, secilenHastaId]);

  // 2. İlaç Kataloğunu Getir
  const ilaclariGetir = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Ilac`, { headers: getAuthHeaders() });
      if (res.ok) setIlacKatalogu(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  // 3. Seçilen Hastanın Detay ve Geçmiş Muayenelerini Getir
  const hastaDetayGetir = useCallback(async (id) => {
    if (!id) return;
    setYukleniyor(true);
    const h = getAuthHeaders();
    try {
      const [hastaRes, muayeneRes, vitallerRes, ilaclarRes] = await Promise.all([
        fetch(`${API_BASE}/Hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/Muayene/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/VitalBulgu/hasta/${id}`, { headers: h }),
        fetch(`${API_BASE}/HastaIlac/hasta/${id}`, { headers: h })
      ]);

      if (hastaRes.ok) {
        const hData = await hastaRes.json();
        const vitaller = vitallerRes.ok ? await vitallerRes.json() : [];
        const ilaclar = ilaclarRes.ok ? await ilaclarRes.json() : [];
        setHastaDetay({
          ...hData,
          vitaller,
          ilaclar
        });
      }

      if (muayeneRes.ok) {
        setGecmisMuayeneler(await muayeneRes.json());
      }
    } catch (e) {
      console.error(e);
      showToast('Hasta verileri alınamadı.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    hastalariGetir();
    ilaclariGetir();
  }, [hastalariGetir, ilaclariGetir]);

  useEffect(() => {
    if (secilenHastaId) {
      setSearchParams({ hastaId: secilenHastaId });
      hastaDetayGetir(secilenHastaId);
    }
  }, [secilenHastaId, hastaDetayGetir, setSearchParams]);

  const muayeneKaydet = async (e) => {
    e.preventDefault();
    if (!secilenHastaId) return;

    setKaydediliyor(true);
    try {
      const res = await fetch(`${API_BASE}/Muayene`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hastaId: parseInt(secilenHastaId),
          sikayet: muayeneForm.sikayet,
          klinikBulgular: muayeneForm.klinikBulgular,
          tani: muayeneForm.tani,
          tedaviPlani: muayeneForm.tedaviPlani,
          diyetVeBakimOnerisi: muayeneForm.diyetVeBakimOnerisi,
          kontrolTarihi: muayeneForm.kontrolTarihi ? new Date(muayeneForm.kontrolTarihi) : null,
          durum: muayeneForm.durum
        })
      });

      if (res.ok) {
        showToast('Hekim vizite ve muayene kaydı başarıyla oluşturuldu.', 'success');
        setMuayeneForm({
          sikayet: '',
          klinikBulgular: '',
          tani: '',
          tedaviPlani: '',
          diyetVeBakimOnerisi: '',
          kontrolTarihi: '',
          durum: 'Stabil'
        });
        hastaDetayGetir(secilenHastaId);
      } else {
        showToast('Kayıt sırasında hata oluştu.', 'error');
      }
    } catch {
      showToast('Sunucu bağlantı hatası.', 'error');
    } finally {
      setKaydediliyor(false);
    }
  };

  const receteEkle = async (e) => {
    e.preventDefault();
    if (!yeniIlacForm.ilacId) {
      showToast('Lütfen reçete edilecek ilacı seçiniz.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/HastaIlac`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hastaId: parseInt(secilenHastaId),
          ilacId: parseInt(yeniIlacForm.ilacId),
          dozaj: yeniIlacForm.dozaj,
          kullanimSikligi: yeniIlacForm.kullanimSikligi,
          kullanimSekli: yeniIlacForm.kullanimSekli,
          bitisTarihi: yeniIlacForm.bitisTarihi ? new Date(yeniIlacForm.bitisTarihi) : null
        })
      });

      if (res.ok) {
        showToast('İlaç hastanın aktif tedavisine eklendi.', 'success');
        setReceteModal(false);
        hastaDetayGetir(secilenHastaId);
      } else {
        showToast('İlaç eklenirken hata oluştu.', 'error');
      }
    } catch {
      showToast('Sunucu bağlantı hatası.', 'error');
    }
  };

  const filtrelenmisHastalar = hastalar.filter(h => {
    const adSoyad = `${h.ad} ${h.soyad}`.toLowerCase();
    const oda = (h.odaNo || '').toLowerCase();
    return adSoyad.includes(aramaMetni.toLowerCase()) || oda.includes(aramaMetni.toLowerCase());
  });

  const sonVital = hastaDetay?.vitaller?.[0];

  return (
    <div className="space-y-3.5 font-sans pb-16 text-slate-800 max-w-6xl mx-auto">
      {/* ── 1. ÜST BAŞLIK ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[#3E5C76] flex items-center justify-center shrink-0 shadow-2xs">
            <Stethoscope size={18} strokeWidth={2.4} />
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#142A4A] tracking-tight uppercase leading-none font-sans">
              Hekim Vizite & Muayene Masası
            </h1>
            <span className="text-[11px] font-semibold text-slate-500 font-sans mt-0.5 block">
              Fizik Muayene, Tanı, Tedavi Planı ve Reçeteleme
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/doktor-dashboard')}
          className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs font-sans"
        >
          ← Hekim Paneline Dön
        </button>
      </div>

      {/* ── 2. İKİ SÜTUNLU ÇALIŞMA ALANI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">

        {/* ── SOL SÜTUN: SAKİN SEÇİCİ & ÖZET (4 Kolon) ── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-tight text-[#142A4A] font-sans">
                Bakım Sakini Seç
              </h2>
              <span className="text-[10.5px] font-semibold text-slate-500 font-sans">
                {filtrelenmisHastalar.length} Sakin
              </span>
            </div>
            <input
              type="text"
              placeholder="Oda no veya İsimle ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 mb-2 focus:outline-none focus:border-[#3E5C76] focus:bg-white transition-colors font-sans"
            />

            <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {filtrelenmisHastalar.map(h => {
                const secili = secilenHastaId === h.id.toString();
                return (
                  <div
                    key={h.id}
                    onClick={() => setSecilenHastaId(h.id.toString())}
                    className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between text-xs font-sans ${
                      secili ? 'bg-[#3E5C76] text-white' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold">
                        {h.ad} {h.soyad}
                      </div>
                      <div className={`text-[10.5px] truncate max-w-[150px] font-medium ${secili ? 'text-slate-200' : 'text-slate-500'}`}>
                        {h.hastalik || 'Genel Bakım'}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      secili ? 'border-sky-400/40 bg-sky-950/30 text-white' : 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}>
                      Oda {h.odaNo || '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sakin Özet Bilgileri & Son Vitaller */}
          {hastaDetay && (
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-tight text-[#142A4A]">
                    Klinik Bilgi Kartı
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Dosya: {hastaDetay.hastaNo}
                  </p>
                </div>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                  Oda {hastaDetay.odaNo || '—'}
                </span>
              </div>

              <div className="text-xs space-y-1.5 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Dosya No:</span>
                  <span className="font-bold text-slate-800">{hastaDetay.hastaNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Kronik Tanı:</span>
                  <span className="font-bold text-[#142A4A] text-right">{hastaDetay.hastalik || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Alerji:</span>
                  <span className={hastaDetay.alerjiBilgisi && hastaDetay.alerjiBilgisi !== 'Yok' ? 'font-bold text-slate-800' : 'text-slate-500'}>
                    {hastaDetay.alerjiBilgisi || 'Yok'}
                  </span>
                </div>
              </div>

              {/* Son Vital Kartı */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-[10.5px] text-slate-500 uppercase tracking-tight">
                  Son Hemşire Vital Ölçümü:
                </div>
                {sonVital ? (
                  <div className="space-y-1 text-slate-800">
                    <div className="font-semibold">Tansiyon: <b className="text-slate-900 font-bold">{sonVital.tansiyonSistol}/{sonVital.tansiyonDiyastol} mmHg</b></div>
                    <div className="font-semibold">Nabız: <b className="text-slate-900 font-bold">{sonVital.nabizBPM} bpm</b> · Ateş: <b className="text-slate-900 font-bold">{sonVital.atesC} °C</b></div>
                    <div className="font-semibold">SpO₂: <b className="text-slate-900 font-bold">%{sonVital.saturasyonYuzdesi}</b> · Solunum: <b className="text-slate-900 font-bold">{sonVital.soluSayisi}</b></div>
                    <div className="text-[10.5px] text-slate-500 pt-0.5">
                      {new Date(sonVital.tarih).toLocaleString('tr-TR')}
                    </div>
                  </div>
                ) : (
                  <span className="italic text-slate-400">Vital kaydı yok</span>
                )}
              </div>

              {/* Aktif İlaçları Listesi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-tight text-[#142A4A] font-sans">
                    Reçeteleri ({hastaDetay.ilaclar?.length ?? 0})
                  </span>
                  <button
                    onClick={() => setReceteModal(true)}
                    className="px-2 py-0.5 rounded-md bg-[#3E5C76] hover:bg-[#2A3F50] text-white text-[10.5px] font-semibold transition-colors cursor-pointer shadow-2xs font-sans"
                  >
                    + İlaç Yaz
                  </button>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {hastaDetay.ilaclar?.map(i => (
                    <div key={i.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans">
                      <div className="font-bold text-slate-900">{i.ilac?.ad || i.ilacAd || i.ad || 'Tedavi İlacı'}</div>
                      <div className="text-[10.5px] text-slate-500 font-sans mt-0.5">{i.dozaj} · {i.kullanimSikligi}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SAĞ SÜTUN: VİZİTE & MUAYENE FORMU (8 Kolon) ── */}
        <div className="lg:col-span-8 space-y-3.5">

          {/* Muayene Form Kartı */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-tight text-[#142A4A] font-sans">
                  Yeni Vizite Muayene Notu
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">
                  Sakin: {hastaDetay?.ad} {hastaDetay?.soyad} (Oda {hastaDetay?.odaNo || '—'})
                </p>
              </div>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-sans">
                Dr. {kullanici?.ad} {kullanici?.soyad}
              </span>
            </div>

            <form onSubmit={muayeneKaydet} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Şikayet / Başvuru Nedeni:
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Örn: Halsizlik, baş ağrısı, nefes darlığı..."
                    value={muayeneForm.sikayet}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, sikayet: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#3E5C76] focus:ring-1 focus:ring-[#3E5C76] resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Klinik Bulgular & Fizik Muayene:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Örn: Kalp ritmik, bilateral ral yok, batın rahat..."
                    value={muayeneForm.klinikBulgular}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, klinikBulgular: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#3E5C76] focus:ring-1 focus:ring-[#3E5C76] resize-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Hekim Tanısı (Ön / Kesin Tanı):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Hipertansif Alevlenme"
                    value={muayeneForm.tani}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, tani: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#3E5C76] focus:ring-1 focus:ring-[#3E5C76] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Genel Sağlık Durumu:
                  </label>
                  <select
                    value={muayeneForm.durum}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, durum: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none focus:border-[#3E5C76] font-sans"
                  >
                    <option value="Stabil">Stabil (Rutin Bakım)</option>
                    <option value="Takipte">Yakın Takipte (Günde 3 Kez Vital)</option>
                    <option value="Kritik">Kritik (Hekim İzleminde)</option>
                    <option value="SevkPlanlandi">Dış Hastaneye Sevk Planlandı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  Tedavi Planı & Hemşirelik Bakım Direktifleri:
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Örn: İlaç dozu düzenlendi, sabah-akşam tansiyon takibi yapılacak..."
                  value={muayeneForm.tedaviPlani}
                  onChange={(e) => setMuayeneForm({ ...muayeneForm, tedaviPlani: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#3E5C76] focus:ring-1 focus:ring-[#3E5C76] resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Diyet ve Yaşam Tarzı Önerisi:
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Düşük sodyum, bol sıvı alımı"
                    value={muayeneForm.diyetVeBakimOnerisi}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, diyetVeBakimOnerisi: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#3E5C76] focus:ring-1 focus:ring-[#3E5C76] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Sonraki Hekim Kontrol Tarihi:
                  </label>
                  <input
                    type="date"
                    value={muayeneForm.kontrolTarihi}
                    onChange={(e) => setMuayeneForm({ ...muayeneForm, kontrolTarihi: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-[#3E5C76] font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setReceteModal(true)}
                  className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs font-sans"
                >
                  <Pill size={13} strokeWidth={2.2} />
                  <span>Reçeteye İlaç Ekle</span>
                </button>
                <button
                  type="submit"
                  disabled={kaydediliyor}
                  className="h-8 px-4 rounded-lg bg-[#3E5C76] hover:bg-[#2A3F50] disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5 font-sans"
                >
                  {kaydediliyor ? 'Kaydediliyor...' : <><Check size={13} strokeWidth={2.6} /> Vizite Kaydını Onayla</>}
                </button>
              </div>
            </form>
          </div>

          {/* Geçmiş Hekim Muayeneleri Listesi */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-tight text-[#142A4A] font-sans">
                  Bu Sakinin Geçmiş Hekim Viziteleri
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5 font-sans">
                  Kayıtlı muayene ve klinik tedavi geçmişi
                </p>
              </div>
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-sans">
                {gecmisMuayeneler.length} Kayıt
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {gecmisMuayeneler.length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-slate-400 font-sans">
                  Kayıtlı geçmiş muayene bulunmuyor.
                </div>
              ) : (
                gecmisMuayeneler.map(m => (
                  <div key={m.id} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5 hover:bg-slate-100/80 transition-all font-sans text-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                      <span className="font-bold text-[#142A4A] text-xs tracking-tight">{m.tani}</span>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        {new Date(m.muayeneTarihi).toLocaleString('tr-TR')} · {m.doktorAd}
                      </span>
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      <span className="text-slate-800 font-semibold">Şikayet:</span> {m.sikayet}
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      <span className="text-slate-800 font-semibold">Tedavi Planı:</span> {m.tedaviPlani}
                    </div>
                    {m.diyetVeBakimOnerisi && (
                      <div className="text-[11.5px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                        <span className="text-slate-800 font-semibold">Diyet & Öneri:</span>
                        <span>{m.diyetVeBakimOnerisi}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── YENİ İLAÇ REÇETELEME MODALI ── */}
      {receteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-tight text-[#142A4A] font-sans flex items-center gap-2">
                <Pill size={14} strokeWidth={2.4} className="text-[#3E5C76]" />
                <span>Yeni İlaç Tedavisi Reçetele</span>
              </h3>
              <button
                onClick={() => setReceteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={receteEkle} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                  Kurum Ecza Dolabından İlaç Seç:
                </label>
                <select
                  required
                  value={yeniIlacForm.ilacId}
                  onChange={(e) => setYeniIlacForm({ ...yeniIlacForm, ilacId: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#3E5C76] cursor-pointer font-sans"
                >
                  <option value="">İlaç Seçiniz...</option>
                  {ilacKatalogu.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.ad} ({i.etkenMadde || i.form})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Dozaj:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 1x1, 500 mg"
                    value={yeniIlacForm.dozaj}
                    onChange={(e) => setYeniIlacForm({ ...yeniIlacForm, dozaj: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#3E5C76] font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Kullanım Şekli:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ağızdan (Oral)"
                    value={yeniIlacForm.kullanimSekli}
                    onChange={(e) => setYeniIlacForm({ ...yeniIlacForm, kullanimSekli: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#3E5C76] font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Açlık / Tokluk:
                  </label>
                  <select
                    value={yeniIlacForm.kullanimSikligi}
                    onChange={(e) => setYeniIlacForm({ ...yeniIlacForm, kullanimSikligi: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#3E5C76] cursor-pointer font-sans"
                  >
                    <option value="Tok Karnına">Tok Karnına</option>
                    <option value="Aç Karnına">Aç Karnına</option>
                    <option value="Farketmez">Farketmez</option>
                    <option value="Gerektiğinde (PRN)">Gerektiğinde (PRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 font-sans">
                    Bitiş Tarihi:
                  </label>
                  <input
                    type="date"
                    value={yeniIlacForm.bitisTarihi}
                    onChange={(e) => setYeniIlacForm({ ...yeniIlacForm, bitisTarihi: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 cursor-pointer focus:outline-none focus:border-[#3E5C76] font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 font-sans">
                <button
                  type="button"
                  onClick={() => setReceteModal(false)}
                  className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer shadow-2xs font-sans"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-lg bg-[#3E5C76] hover:bg-[#2A3F50] text-white text-xs font-bold cursor-pointer shadow-xs font-sans"
                >
                  Reçeteye Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HekimVizite;
