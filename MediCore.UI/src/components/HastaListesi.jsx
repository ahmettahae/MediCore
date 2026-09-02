import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorUtils';
import { X, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { API_BASE } from '../config/api';

const API = `${API_BASE}/Hasta`;

const BOS_FORM = {
  tcKimlikNo: '', ad: '', soyad: '', dogumTarihi: '', cinsiyet: '',
  telefon: '+90 ( ) ', hastaYakiniAd: '', hastaYakiniTelefon: '+90 ( ) ',
  odaNo: '', yatakNo: '', hastalik: '', alerjiBilgisi: ''
};

const BASLANGIC_ODASI = 100;
const ODA_SAYISI = 22; // 100 ile 121 dahil (22 oda)

const SortIcon = ({ alan, siralaAlan, siralaYon }) => {
  if (siralaAlan !== alan) return <ArrowUpDown size={12} className="text-zinc-400 shrink-0" />;
  return siralaYon === 'asc' 
    ? <ArrowUp size={12} className="text-primary shrink-0" />
    : <ArrowDown size={12} className="text-primary shrink-0" />;
};

const FormInput = ({ label, alan, type = 'text', required = false, form, setForm, ...rest }) => (
  <div>
    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">{label}</label>
    <input
      type={type}
      required={required}
      className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none focus:border-primary bg-white"
      value={form[alan] ?? ''}
      onChange={(e) => setForm({ ...form, [alan]: e.target.value })}
      {...rest}
    />
  </div>
);

const formatlaTelefon = (value) => {
  if (!value) return '+90 ( ) ';
  let cleaned = value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '');
  cleaned = cleaned.substring(0, 10);
  
  if (cleaned.length === 0) {
    return '+90 ( ) ';
  }
  if (cleaned.length <= 3) {
    return `+90 (${cleaned}) `;
  }
  if (cleaned.length <= 6) {
    return `+90 (${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }
  if (cleaned.length <= 8) {
    return `+90 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return `+90 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
};

export const ayarlaCursor = (input, cleanedLength) => {
  let pos = 5;
  if (cleanedLength === 1) pos = 6;
  else if (cleanedLength === 2) pos = 7;
  else if (cleanedLength === 3) pos = 9;
  else if (cleanedLength === 4) pos = 11;
  else if (cleanedLength === 5) pos = 12;
  else if (cleanedLength === 6) pos = 13;
  else if (cleanedLength === 7) pos = 15;
  else if (cleanedLength === 8) pos = 16;
  else if (cleanedLength === 9) pos = 18;
  else if (cleanedLength === 10) pos = 19;
  
  setTimeout(() => {
    if (input) {
      input.setSelectionRange(pos, pos);
    }
  }, 0);
};

const valideEtTC = (tc) => {
  if (!tc) return true;
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;
  
  const digits = tc.split('').map(Number);
  const teklerToplam = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const ciftlerToplam = digits[1] + digits[3] + digits[5] + digits[7];
  
  const h10 = ((teklerToplam * 7) - ciftlerToplam) % 10;
  if ((h10 < 0 ? h10 + 10 : h10) !== digits[9]) return false;
  
  const h11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  if (h11 !== digits[10]) return false;
  
  return true;
};

const HastaListesi = () => {
  const [hastalar, setHastalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [filtreDurum, setFiltreDurum] = useState('Tümü');
  const [modalMod, setModalMod] = useState(null); // null | 'ekle' | 'duzenle'
  const [silOnayId, setSilOnayId] = useState(null);
  const [form, setForm] = useState(BOS_FORM);
  const [suAn, setSuAn] = useState(new Date());

  const [siralaAlan, setSiralaAlan] = useState('odaNo'); // 'odaNo', 'ad', 'hastaNo', 'yas', 'durum'
  const [siralaYon, setSiralaYon] = useState('asc'); // 'asc' | 'desc'

  const navigate = useNavigate();
  const location = useLocation();
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();

  const yatakDoluMu = useCallback((odaNo, yatakNo, currentId) => {
    if (!odaNo || !yatakNo) return null;
    return hastalar.find(h => 
      h.id !== currentId && 
      (h.durum === 'Kurumda' || h.durum === 'Aktif' || h.durum === 'Hastanede' || h.durum === 'Hastahanede') &&
      h.odaNo?.toString() === odaNo.toString() &&
      h.yatakNo?.toString() === yatakNo.toString()
    );
  }, [hastalar]);

  // URL'den q parametresini oku
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setAramaMetni(q);
    }
  }, [location.search]);

  // Canlı saat sayacı
  useEffect(() => {
    const timer = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hastalariGetir = useCallback(async (ara = '', showLoading = true) => {
    if (showLoading) setYukleniyor(true);
    try {
      const url = ara ? `${API}?ara=${encodeURIComponent(ara)}` : API;
      const [cevap, sevkCevap] = await Promise.all([
        fetch(url, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/HastahaneSevk`, { headers: getAuthHeaders() })
      ]);
      if (cevap.status === 401) { navigate('/login'); return; }

      const hData = cevap.ok ? await cevap.json() : [];
      const sData = sevkCevap.ok ? await sevkCevap.json() : [];

      const simdi = new Date();
      const son24SaatMs = 24 * 60 * 60 * 1000;

      const islenmis = hData.map(hasta => {
        const sonSevk = sData
          .filter(s => s.hastaId === hasta.id && s.geriDonusTarihi)
          .sort((a, b) => new Date(b.geriDonusTarihi) - new Date(a.geriDonusTarihi))[0];

        const yeniDonduMu = sonSevk && (simdi - new Date(sonSevk.geriDonusTarihi)) < son24SaatMs;
        return { 
          ...hasta, 
          yeniDondu: yeniDonduMu, 
          sonGeriDonusTarihi: sonSevk?.geriDonusTarihi 
        };
      });

      setHastalar(islenmis);
    } catch (e) {
      console.error(e);
      showToast('Sakinler yüklenirken bağlantı hatası oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders, navigate, showToast]);

  useEffect(() => { hastalariGetir('', true); }, [hastalariGetir]);

  const handleKaydet = async (e) => {
    e.preventDefault();

    if (form.tcKimlikNo && !valideEtTC(form.tcKimlikNo)) {
      showToast('Geçersiz TC Kimlik Numarası (11 haneli algoritma kurallarına uygun olmalıdır).', 'error');
      return;
    }

    if (form.odaNo && form.yatakNo) {
      const occupant = yatakDoluMu(form.odaNo, form.yatakNo, form.id);
      if (occupant) {
        showToast(`Seçilen yatak dolu! (Sakin: ${occupant.ad} ${occupant.soyad})`, 'error');
        return;
      }
    }

    const teli = form.telefon === '+90 ( ) ' ? '' : form.telefon;
    const yTeli = form.hastaYakiniTelefon === '+90 ( ) ' ? '' : form.hastaYakiniTelefon;

    const digitsOnly = teli.replace(/\D/g, '');
    const yDigitsOnly = yTeli.replace(/\D/g, '');

    if (teli && (!digitsOnly.startsWith('90') || digitsOnly.length !== 12)) {
      showToast('Telefon numarası geçerli bir formatta olmalıdır (Örn: +90 (532) 123 45 67).', 'error');
      return;
    }

    if (yTeli && (!yDigitsOnly.startsWith('90') || yDigitsOnly.length !== 12)) {
      showToast('Yakın/Vasi telefon numarası geçerli bir formatta olmalıdır (Örn: +90 (532) 123 45 67).', 'error');
      return;
    }

    const isEdit = modalMod === 'duzenle';
    const url = isEdit ? `${API}/${form.id}` : API;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      ...form,
      telefon: teli,
      hastaYakiniTelefon: yTeli
    };

    const cevap = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (cevap.ok) {
      setModalMod(null);
      setForm(BOS_FORM);
      hastalariGetir();
      showToast(isEdit ? 'Sakin bilgileri başarıyla güncellendi.' : 'Yeni bakım sakini kaydedildi.', 'success');
    } else {
      const errMesaj = await parseApiError(cevap, 'Sakin kaydedilemedi.');
      showToast('İşlem başarısız: ' + errMesaj, 'error');
    }
  };

  const handleSil = async (id) => {
    const cevap = await fetch(`${API}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (cevap.ok) {
      setSilOnayId(null);
      hastalariGetir();
      showToast('Sakin kaydı silindi.', 'info');
    } else {
      const errMesaj = await parseApiError(cevap, 'Silme işlemi gerçekleştirilemedi.');
      showToast(errMesaj, 'error');
    }
  };

  const duzenlemeAc = (hasta) => {
    setForm({
      id: hasta.id,
      tcKimlikNo: hasta.tcKimlikNo || '',
      ad: hasta.ad || '',
      soyad: hasta.soyad || '',
      dogumTarihi: hasta.dogumTarihi ? hasta.dogumTarihi.split('T')[0] : '',
      cinsiyet: hasta.cinsiyet || '',
      telefon: hasta.telefon || '+90 ( ) ',
      hastaYakiniAd: hasta.hastaYakiniAd || '',
      hastaYakiniTelefon: hasta.hastaYakiniTelefon || '+90 ( ) ',
      odaNo: hasta.odaNo || '',
      yatakNo: hasta.yatakNo || '',
      hastalik: hasta.hastalik || '',
      alerjiBilgisi: hasta.alerjiBilgisi || '',
    });
    setModalMod('duzenle');
  };

  const siralamayiDegistir = (alan) => {
    if (siralaAlan === alan) {
      setSiralaYon(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSiralaAlan(alan);
      setSiralaYon('asc');
    }
  };

  const yas = (dogumTarihi) => {
    if (!dogumTarihi) return '-';
    const bugun = new Date();
    const dogum = new Date(dogumTarihi);
    return bugun.getFullYear() - dogum.getFullYear();
  };

  const siralanmisVeFiltrelenmisHastalar = useMemo(() => {
    return hastalar
      .filter(h => {
        const q = aramaMetni.trim().toLocaleLowerCase('tr-TR');
        const aramaUyum = !q || 
          (h.ad || '').toLocaleLowerCase('tr-TR').includes(q) ||
          (h.soyad || '').toLocaleLowerCase('tr-TR').includes(q) ||
          (h.hastaNo || '').toLocaleLowerCase('tr-TR').includes(q) ||
          (h.tcKimlikNo || '').includes(q) ||
          (h.odaNo || '').toString().toLocaleLowerCase('tr-TR').includes(q) ||
          (h.hastalik || '').toLocaleLowerCase('tr-TR').includes(q);

        let durumUyum = true;
        if (filtreDurum === 'Tümü') durumUyum = true;
        else if (filtreDurum === 'Kurumda') durumUyum = h.durum === 'Kurumda' || h.durum === 'Aktif';
        else if (filtreDurum === 'Hastanede') durumUyum = h.durum === 'Hastanede' || h.durum === 'Hastahanede';
        else durumUyum = h.durum === filtreDurum;

        return aramaUyum && durumUyum;
      })
      .sort((a, b) => {
        if (siralaAlan === 'odaNo') {
          const odaA = parseInt(a.odaNo, 10) || 0;
          const odaB = parseInt(b.odaNo, 10) || 0;
          if (odaA !== odaB) return siralaYon === 'asc' ? odaA - odaB : odaB - odaA;
          const yatakA = parseInt(a.yatakNo, 10) || 0;
          const yatakB = parseInt(b.yatakNo, 10) || 0;
          return siralaYon === 'asc' ? yatakA - yatakB : yatakB - yatakA;
        }

        if (siralaAlan === 'yas') {
          const yasA = yas(a.dogumTarihi);
          const yasB = yas(b.dogumTarihi);
          const valA = typeof yasA === 'number' ? yasA : 0;
          const valB = typeof yasB === 'number' ? yasB : 0;
          return siralaYon === 'asc' ? valA - valB : valB - valA;
        }

        let valA = a[siralaAlan];
        let valB = b[siralaAlan];

        if (siralaAlan === 'ad') {
          valA = `${a.ad || ''} ${a.soyad || ''}`.toLocaleLowerCase('tr-TR');
          valB = `${b.ad || ''} ${b.soyad || ''}`.toLocaleLowerCase('tr-TR');
        } else {
          valA = (valA || '').toString().toLocaleLowerCase('tr-TR');
          valB = (valB || '').toString().toLocaleLowerCase('tr-TR');
        }

        if (siralaYon === 'asc') {
          return valA.localeCompare(valB, 'tr-TR');
        } else {
          return valB.localeCompare(valA, 'tr-TR');
        }
      });
  }, [hastalar, aramaMetni, filtreDurum, siralaAlan, siralaYon]);

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & İSTATİSTİKLER ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Bakım Sakinleri & Dosyalar
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Toplam {hastalar.length} Kayıtlı Sakin • Kurum & Dış Hastane Takibi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Arama Kutusu */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
            <input
              type="text"
              placeholder="Sakin, Oda veya TC Ara..."
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

          {/* Durum Filtresi */}
          <select
            value={filtreDurum}
            onChange={(e) => setFiltreDurum(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Durumlar</option>
            <option value="Kurumda">Kurumda</option>
            <option value="Hastanede">Hastanede</option>
            <option value="Taburcu">Taburcu</option>
          </select>

          {/* Yeni Sakin Ekle Butonu */}
          {kullanici?.rol === 'Bashekim' && (
            <button
              onClick={() => { setForm(BOS_FORM); setModalMod('ekle'); }}
              className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center shrink-0 cursor-pointer shadow-2xs"
            >
              + Yeni Sakin
            </button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {yukleniyor ? (
            <div className="text-center py-16 text-zinc-500 font-mono text-xs animate-pulse uppercase">Sakin Listesi Yükleniyor...</div>
          ) : siralanmisVeFiltrelenmisHastalar.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Kayıtlı sakin bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left font-sans border-collapse">
              <thead className="bg-zinc-100/90 text-primary text-[10px] font-black uppercase tracking-wider border-b border-primary select-none">
                <tr>
                  <th 
                    onClick={() => siralamayiDegistir('hastaNo')}
                    className="px-3.5 py-2.5 border-r border-zinc-300 w-28 whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 font-mono">
                      <span>Sakin No</span>
                      <SortIcon alan="hastaNo" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  <th 
                    onClick={() => siralamayiDegistir('ad')}
                    className="px-3.5 py-2.5 border-r border-zinc-300 w-48 min-w-[180px] cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Ad Soyad</span>
                      <SortIcon alan="ad" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  <th 
                    onClick={() => siralamayiDegistir('yas')}
                    className="px-2 py-2.5 border-r border-zinc-300 w-16 text-center cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span>Yaş</span>
                      <SortIcon alan="yas" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  <th className="px-2 py-2.5 border-r border-zinc-300 w-20 text-center">Cinsiyet</th>
                  
                  <th 
                    onClick={() => siralamayiDegistir('odaNo')}
                    className="px-3 py-2.5 border-r border-zinc-300 w-28 text-center whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span>Oda / Yatak</span>
                      <SortIcon alan="odaNo" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  <th className="px-3.5 py-2.5 border-r border-zinc-300 min-w-[200px]">Hastalık / Tanı</th>

                  <th 
                    onClick={() => siralamayiDegistir('durum')}
                    className="px-3 py-2.5 border-r border-zinc-300 w-36 text-center whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span>Durum</span>
                      <SortIcon alan="durum" siralaAlan={siralaAlan} siralaYon={siralaYon} />
                    </div>
                  </th>

                  <th className="px-3.5 py-2.5 text-right w-44">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {siralanmisVeFiltrelenmisHastalar.map((h, idx) => (
                  <tr key={h.id} className={`hover:bg-zinc-50 transition-colors ${idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'}`}>
                    <td className="px-3.5 py-2 font-mono text-xs font-bold border-r border-zinc-200 whitespace-nowrap text-primary">{h.hastaNo || '—'}</td>
                    <td className="px-3.5 py-2 font-bold text-primary border-r border-zinc-200">
                      {h.ad} {h.soyad}
                    </td>
                    <td className="px-2 py-2 font-mono font-bold text-center border-r border-zinc-200">{yas(h.dogumTarihi)}</td>
                    <td className="px-2 py-2 text-center border-r border-zinc-200 text-zinc-600 font-medium">
                      {h.cinsiyet === 'Erkek' ? 'Erkek' : h.cinsiyet === 'Kadın' ? 'Kadın' : '—'} 
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-center border-r border-zinc-200 whitespace-nowrap text-primary">{h.odaNo || '—'} / {h.yatakNo || '—'}</td>
                    <td className="px-3.5 py-2 text-xs font-medium border-r border-zinc-200 min-w-[200px] text-zinc-700" title={h.hastalik}>
                      <div className="line-clamp-1">{h.hastalik || '—'}</div>
                    </td>
                    <td className="px-3 py-2 border-r border-zinc-200 text-center whitespace-nowrap">
                      {h.durum === 'Hastahanede' || h.durum === 'Hastanede' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-primary text-white">HASTANEDE</span>
                      ) : h.durum === 'Taburcu' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono border border-zinc-300 text-zinc-400">TABURCU</span>
                      ) : h.yeniDondu ? (
                        <span 
                          className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-primary text-white border border-primary" 
                          title={`Hastaneden Dönüş: ${new Date(h.sonGeriDonusTarihi).toLocaleString('tr-TR')}`}
                        >
                          YENİ DÖNDÜ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono bg-zinc-100 text-zinc-800 border border-zinc-300">KURUMDA</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <div className="flex justify-end gap-1 whitespace-nowrap">
                        <button onClick={() => navigate(`/hastalar/${h.id}`)} className="text-[10px] font-bold px-2 py-1 rounded bg-primary text-white hover:bg-primary-hover transition-colors">
                          Detay
                        </button>
                        {kullanici?.rol === 'Bashekim' && (
                          <button onClick={() => duzenlemeAc(h)} className="text-[10px] font-bold px-2 py-1 rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 transition-colors">
                            Düzenle
                          </button>
                        )}
                        {kullanici?.rol === 'Bashekim' && (
                          <button onClick={() => setSilOnayId(h.id)} className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white transition-colors">
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── HASTA EKLEME / DÜZENLEME MODALI ── */}
      {modalMod && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-20 bg-zinc-100 px-5 py-3 border-b border-zinc-300 flex justify-between items-center rounded-t-xl">
              <h3 className="text-sm font-black text-primary uppercase tracking-wider font-mono">
                {modalMod === 'ekle' ? '+ Yeni Sakin Ekle' : 'Sakin Bilgilerini Düzenle'}
              </h3>
              <button onClick={() => setModalMod(null)} className="text-zinc-500 hover:text-primary text-xs font-bold cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            <form onSubmit={handleKaydet} className="p-5 space-y-4 text-xs">

              {/* Kişisel Bilgiler */}
              <div className="border border-zinc-300 rounded-lg p-3.5 relative bg-zinc-50/50">
                <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600 font-mono">Kişisel Bilgiler</span>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <FormInput label="Ad *" alan="ad" required form={form} setForm={setForm} />
                  <FormInput label="Soyad *" alan="soyad" required form={form} setForm={setForm} />
                  <FormInput label="TC Kimlik No" alan="tcKimlikNo" maxLength={11} placeholder="11 Haneli TC Kimlik No" form={form} setForm={setForm} />
                  <FormInput label="Doğum Tarihi *" alan="dogumTarihi" type="date" required form={form} setForm={setForm} />
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Cinsiyet</label>
                    <select
                      className="w-full h-8 px-2 rounded-lg border border-zinc-300 text-xs font-bold focus:outline-none focus:border-primary bg-white"
                      value={form.cinsiyet}
                      onChange={(e) => setForm({ ...form, cinsiyet: e.target.value })}
                    >
                      <option value="">Seçiniz</option>
                      <option>Erkek</option>
                      <option>Kadın</option>
                    </select>
                  </div>
                  <FormInput 
                    label="Telefon" 
                    alan="telefon" 
                    type="tel" 
                    placeholder="+90 (5XX) XXX XX XX" 
                    form={form} 
                    setForm={setForm} 
                    onFocus={(e) => {
                      const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                      ayarlaCursor(e.target, cleaned.length);
                    }}
                    onChange={(e) => {
                      const formatted = formatlaTelefon(e.target.value);
                      const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                      setForm({ ...form, telefon: formatted });
                      ayarlaCursor(e.target, cleaned.length);
                    }}
                  />
                </div>
              </div>

              {/* Vasi / İrtibat Kişisi */}
              <div className="border border-zinc-300 rounded-lg p-3.5 relative bg-zinc-50/50">
                <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600 font-mono">Vasi / İrtibat Kişisi</span>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <FormInput label="Vasi / Yakın Adı" alan="hastaYakiniAd" form={form} setForm={setForm} />
                  <FormInput 
                    label="Vasi / Yakın Telefonu" 
                    alan="hastaYakiniTelefon" 
                    type="tel" 
                    placeholder="+90 (5XX) XXX XX XX" 
                    form={form} 
                    setForm={setForm} 
                    onFocus={(e) => {
                      const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                      ayarlaCursor(e.target, cleaned.length);
                    }}
                    onChange={(e) => {
                      const formatted = formatlaTelefon(e.target.value);
                      const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                      setForm({ ...form, hastaYakiniTelefon: formatted });
                      ayarlaCursor(e.target, cleaned.length);
                    }}
                  />
                </div>
              </div>

              {/* Konum */}
              <div className="border border-zinc-300 rounded-lg p-3.5 relative bg-zinc-50/50">
                <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600 font-mono">Konum</span>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Oda No *</label>
                    <select
                      required
                      className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none focus:border-primary bg-white cursor-pointer"
                      value={form.odaNo || ''}
                      onChange={(e) => setForm({ ...form, odaNo: e.target.value })}
                    >
                      <option value="">Seçiniz</option>
                      {Array.from({ length: ODA_SAYISI }, (_, i) => BASLANGIC_ODASI + i).map(num => (
                        <option key={num} value={num.toString()}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Yatak No *</label>
                    <select
                      required
                      className="w-full h-8 px-2.5 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none focus:border-primary bg-white cursor-pointer"
                      value={form.yatakNo || ''}
                      onChange={(e) => setForm({ ...form, yatakNo: e.target.value })}
                    >
                      <option value="">Seçiniz</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                </div>
                {yatakDoluMu(form.odaNo, form.yatakNo, form.id) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold mt-2 bg-red-50 border border-red-200 p-2 rounded-lg font-mono">
                    <AlertTriangle size={14} className="shrink-0 text-red-600" />
                    <span>Bu yatak şu anda dolu! (Sakin: {yatakDoluMu(form.odaNo, form.yatakNo, form.id).ad} {yatakDoluMu(form.odaNo, form.yatakNo, form.id).soyad})</span>
                  </div>
                )}
              </div>

              {/* Sağlık Bilgileri */}
              <div className="border border-zinc-300 rounded-lg p-3.5 relative bg-zinc-50/50">
                <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-600 font-mono">Sağlık Bilgileri</span>
                <div className="grid grid-cols-1 gap-3 mt-1">
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Hastalık / Tanı</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs font-bold focus:outline-none focus:border-primary resize-none bg-white"
                      value={form.hastalik}
                      onChange={(e) => setForm({ ...form, hastalik: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase mb-0.5 text-zinc-600 font-mono">Alerji Bilgisi</label>
                    <textarea
                      rows={2}
                      className="w-full p-2 rounded-lg border border-zinc-300 text-xs font-bold focus:outline-none focus:border-primary resize-none bg-white"
                      value={form.alerjiBilgisi}
                      onChange={(e) => setForm({ ...form, alerjiBilgisi: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button type="button" onClick={() => setModalMod(null)}
                  className="px-4 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 font-bold uppercase text-[11px] hover:bg-zinc-100 transition-colors cursor-pointer">
                  İptal
                </button>
                <button type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-bold uppercase text-[11px] hover:bg-primary-hover transition-colors cursor-pointer shadow-2xs">
                  {modalMod === 'ekle' ? 'Kaydet' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SİLME ONAY MODALI ── */}
      {silOnayId && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl p-5 max-w-sm w-full text-center">
            <h3 className="text-base font-black text-primary uppercase tracking-wider mb-2 font-mono">Hastayı Sil</h3>
            <p className="text-zinc-600 text-xs font-medium mb-4">Bu hastanın tüm kayıtları silinecek. Emin misiniz?</p>
            <div className="flex gap-2">
              <button onClick={() => setSilOnayId(null)}
                className="flex-1 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs uppercase transition-colors cursor-pointer">
                Vazgeç
              </button>
              <button onClick={() => handleSil(silOnayId)}
                className="flex-1 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase transition-colors cursor-pointer">
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HastaListesi;