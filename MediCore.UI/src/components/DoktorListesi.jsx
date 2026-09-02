import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorUtils';
import { X } from 'lucide-react';
import { API_BASE } from '../config/api';

const API = `${API_BASE}/Doktor`;

const BOS_FORM = {
  ad: '', soyad: '', tcKimlikNo: '', dogumTarihi: '', cinsiyet: '',
  telefon: '+90 ( ) ', ePosta: '', uzmanlikAlani: '', sicilNo: '',
  calistigiBirim: '', goreveBaslamaTarihi: '', kullaniciAdi: '', sifre: '', durum: 'Aktif'
};

const UZMANLIK_LISTESI = [
  'Başhekim', 'Dahiliye (İç Hastalıkları)', 'Kardiyoloji', 'Nöroloji', 'Genel Cerrahi',
  'Pediatri (Çocuk Sağlığı)', 'Fizik Tedavi ve Rehabilitasyon', 'Ortopedi ve Travmatoloji',
  'Göz Hastalıkları', 'Kulak Burun Boğaz', 'Psikiyatri', 'Dermatoloji (Cildiye)', 'Enfeksiyon Hastalıkları'
];

const BIRIM_LISTESI = [
  'Başhekimlik', 'Acil Servis', 'Yoğun Bakım', 'Poliklinik', 'Yataklı Servis', 'Ameliyathane', 'Laboratuvar', 'Radyoloji'
];

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

export const turkceKarakterleriDonustur = (text) => {
  if (!text) return '';
  const mapping = {
    'Ş': 'S', 'ş': 's',
    'Ğ': 'G', 'ğ': 'g',
    'Ç': 'C', 'ç': 'c',
    'İ': 'I', 'ı': 'i',
    'Ö': 'O', 'ö': 'o',
    'Ü': 'U', 'ü': 'u',
  };
  return text.split('').map(c => mapping[c] || c).join('').toLowerCase();
};

export const generateUsername = (ad, soyad, unvan) => {
  const cleanAd = (ad || '').trim();
  const cleanSoyad = (soyad || '').trim();
  if (!cleanAd && !cleanSoyad) return '';

  const adParts = cleanAd.split(/\s+/).filter(Boolean);
  const firstLetters = adParts.map(part => turkceKarakterleriDonustur(part)[0]).join('');
  const surname = turkceKarakterleriDonustur(cleanSoyad);

  let prefix = 'dr';
  const u = (unvan || '').toLowerCase();
  if (u.includes('hemşire') || u.includes('hemsire') || u.includes('başhemşire')) {
    prefix = 'hem';
  } else if (u.includes('doktor') || u.includes('hekim') || u.includes('başhekim') || u.includes('yönetici') || u.includes('yonetici')) {
    prefix = 'dr';
  } else {
    prefix = 'per';
  }

  return `${prefix}_${firstLetters}${surname}`;
};

const DoktorListesi = ({ gomulu = false, disAramaMetni }) => {
  const [doktorlar, setDoktorlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState(disAramaMetni !== undefined ? disAramaMetni : '');
  const [filtreBirim, setFiltreBirim] = useState('Tümü');
  const [modalMod, setModalMod] = useState(null); // null | 'ekle' | 'duzenle'
  const [silOnayId, setSilOnayId] = useState(null);
  const [form, setForm] = useState(BOS_FORM);
  const [suAn, setSuAn] = useState(new Date());

  const navigate = useNavigate();
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (disAramaMetni !== undefined) {
      setAramaMetni(disAramaMetni);
    }
  }, [disAramaMetni]);

  // Canlı saat sayacı
  useEffect(() => {
    const timer = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doktorlariGetir = useCallback(async (ara = '', showLoading = true) => {
    if (showLoading) setYukleniyor(true);
    try {
      const url = ara ? `${API}?ara=${encodeURIComponent(ara)}` : API;
      const cevap = await fetch(url, { headers: getAuthHeaders() });
      if (cevap.status === 401) { navigate('/login'); return; }
      if (cevap.ok) {
        const data = await cevap.json();
        setDoktorlar(Array.isArray(data) ? data : []);
      } else {
        setDoktorlar([]);
      }
    } catch {
      setDoktorlar([]);
      showToast('Hekim listesi yüklenirken hata oluştu.', 'error');
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders, navigate, showToast]);

  useEffect(() => { doktorlariGetir('', true); }, [doktorlariGetir]);

  useEffect(() => {
    const t = setTimeout(() => doktorlariGetir(aramaMetni, false), 400);
    return () => clearTimeout(t);
  }, [aramaMetni, doktorlariGetir]);

  const handleKaydet = async (e) => {
    e.preventDefault();

    if (form.tcKimlikNo && !valideEtTC(form.tcKimlikNo)) {
      showToast('Geçersiz TC Kimlik Numarası (11 haneli algoritma kurallarına uygun olmalıdır).', 'error');
      return;
    }

    const teli = form.telefon === '+90 ( ) ' ? '' : form.telefon;
    const digitsOnly = teli.replace(/\D/g, '');
    
    if (teli && (!digitsOnly.startsWith('90') || digitsOnly.length !== 12)) {
      showToast('Telefon numarası geçerli bir formatta olmalıdır (Örn: +90 (532) 123 45 67).', 'error');
      return;
    }

    const isEdit = modalMod === 'duzenle';
    const payload = {
      ...form,
      telefon: teli,
      dogumTarihi: form.dogumTarihi || null,
      goreveBaslamaTarihi: form.goreveBaslamaTarihi || null,
    };

    try {
      const cevap = await fetch(isEdit ? `${API}/${form.id}` : API, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (cevap.ok) {
        setModalMod(null);
        setForm(BOS_FORM);
        doktorlariGetir(aramaMetni);
        showToast(isEdit ? 'Hekim bilgileri başarıyla güncellendi.' : 'Yeni hekim başarıyla eklendi.', 'success');
      } else {
        const errMesaj = await parseApiError(cevap, 'Hekim kaydedilemedi.');
        showToast('İşlem başarısız: ' + errMesaj, 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const handleSil = async (id) => {
    try {
      const cevap = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (cevap.ok) {
        setSilOnayId(null);
        doktorlariGetir(aramaMetni);
        showToast('Hekim kaydı silindi.', 'info');
      } else {
        const errMesaj = await parseApiError(cevap, 'Silme işlemi gerçekleştirilemedi.');
        showToast(errMesaj, 'error');
      }
    } catch {
      showToast('Silme işleminde hata oluştu.', 'error');
    }
  };

  const duzenlemeAc = (d) => {
    setForm({
      ...d,
      dogumTarihi: d.dogumTarihi ? d.dogumTarihi.split('T')[0] : '',
      goreveBaslamaTarihi: d.goreveBaslamaTarihi ? d.goreveBaslamaTarihi.split('T')[0] : '',
      telefon: d.telefon || '+90 ( ) ',
      sifre: ''
    });
    setModalMod('duzenle');
  };

  const filtrelenmisDoktorlar = doktorlar.filter(d => {
    const birimUygun = filtreBirim === 'Tümü' || d.calistigiBirim === filtreBirim;
    return birimUygun;
  });

  return (
    <div className={`space-y-4 font-sans text-primary ${gomulu ? '' : 'pb-12 max-w-6xl mx-auto'}`}>
      
      {/* ── 1. ÜST BAŞLIK (GÖMÜLÜ DEĞİLSE) ── */}
      {!gomulu && (
        <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
              Kurum Hekim Kadrosu
            </h1>
            <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
              Kurum Hekimleri, Branş Doktorları ve Vizite Sorumluları
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
              <input
                type="text"
                placeholder="Hekim veya Branş Ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full h-6 text-xs font-bold text-primary bg-transparent focus:outline-none placeholder:text-zinc-400"
              />
            </form>
          </div>
        </div>
      )}

      {/* ── 2. FİLTRE & AKSİYON BARI ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-primary p-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <select
            value={filtreBirim}
            onChange={(e) => setFiltreBirim(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Birimler</option>
            {BIRIM_LISTESI.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <div className="text-[11px] font-mono font-bold px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-300 text-zinc-700">
            <b>{filtrelenmisDoktorlar.length}</b> Hekim Kaydı
          </div>
        </div>

        {kullanici?.rol === 'Bashekim' && (
          <button
            onClick={() => { setForm(BOS_FORM); setModalMod('ekle'); }}
            className="h-8 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center shrink-0 cursor-pointer shadow-2xs"
          >
            + Yeni Hekim Ekle
          </button>
        )}
      </div>

      {/* ── 3. HEKİM KARTLARI (GRID) ── */}
      <div className="bg-white border border-primary rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-100/90 border-b border-primary flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
            Hekim Kadrosu ({filtrelenmisDoktorlar.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            Aktif Vizite & Konsültasyon
          </span>
        </div>

        {yukleniyor ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs animate-pulse uppercase">
            Hekim Kadrosu Yükleniyor...
          </div>
        ) : filtrelenmisDoktorlar.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Kayıtlı hekim bulunamadı.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filtrelenmisDoktorlar.map((d) => {
              const gun = suAn.getDay();
              const toplamDakika = suAn.getHours() * 60 + suAn.getMinutes();
              const hekimMesaide = d.durum === 'Aktif' && (gun >= 1 && gun <= 5) && (toplamDakika >= 8 * 60 && toplamDakika < 17 * 60);

              return (
                <div key={d.id} className="p-3.5 rounded-xl bg-white border border-zinc-300 hover:border-primary transition-colors flex flex-col justify-between space-y-3 shadow-2xs">
                  
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-primary">Dr. {d.ad} {d.soyad}</h4>
                      <span className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded ${
                        hekimMesaide ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                      }`}>
                        {hekimMesaide ? 'MESAİDE' : 'MESAİ DIŞI'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5 pb-1.5 border-b border-zinc-200">
                      {d.uzmanlikAlani || 'Genel Tıp Uzmanı'}
                    </p>
                    
                    <div className="mt-2 space-y-0.5 text-xs text-zinc-700">
                      <p><span className="text-zinc-400 font-mono text-[10px]">Kullanıcı Adı:</span> <b className="font-mono text-[11px] text-zinc-900">{d.kullaniciAdi || generateUsername(d.ad + ' ' + d.soyad, 'Doktor')}</b></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">Birim:</span> <b className="font-mono">{d.calistigiBirim || '—'}</b></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">Çalışma:</span> <span className="font-mono text-[11px]">08:00 - 17:00</span></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">Sicil:</span> <b className="font-mono text-[11px]">{d.sicilNo || '—'}</b></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">İletişim:</span> <b className="font-mono text-[11px]">{d.telefon || '—'}</b></p>
                    </div>
                  </div>

                  {kullanici?.rol === 'Bashekim' && (
                    <div className="pt-2 border-t border-zinc-200 flex gap-1.5">
                      <button 
                        onClick={() => duzenlemeAc(d)}
                        className="flex-1 py-1 rounded border border-zinc-300 bg-white text-zinc-800 text-[10px] font-bold uppercase hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        Düzenle
                      </button>
                      <button 
                        onClick={() => setSilOnayId(d.id)}
                        className="py-1 px-2.5 rounded bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        Sil
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. HEKİM EKLEME / DÜZENLEME MODALI ── */}
      {modalMod && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
              <h3 className="text-xs font-black text-primary uppercase tracking-wider font-mono">
                {modalMod === 'ekle' ? 'Yeni Hekim Tanımla' : 'Hekim Bilgilerini Düzenle'}
              </h3>
              <button onClick={() => setModalMod(null)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>

            <form onSubmit={handleKaydet} className="space-y-4 text-xs">
              <div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">Kişisel Bilgiler</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Ad *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white" 
                      value={form.ad} 
                      onChange={(e) => {
                        const adVal = e.target.value;
                        setForm({
                          ...form,
                          ad: adVal,
                          kullaniciAdi: generateUsername(adVal, form.soyad, 'Doktor')
                        });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Soyad *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white" 
                      value={form.soyad} 
                      onChange={(e) => {
                        const soyadVal = e.target.value;
                        setForm({
                          ...form,
                          soyad: soyadVal,
                          kullaniciAdi: generateUsername(form.ad, soyadVal, 'Doktor')
                        });
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">TC Kimlik No</label>
                    <input type="text" maxLength={11} placeholder="11 Haneli TC Kimlik No" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono placeholder:text-zinc-400 placeholder:font-sans" value={form.tcKimlikNo} onChange={(e) => setForm({ ...form, tcKimlikNo: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Doğum Tarihi</label>
                    <input type="date" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono" value={form.dogumTarihi} onChange={(e) => setForm({ ...form, dogumTarihi: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Cinsiyet</label>
                    <select
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                      value={form.cinsiyet}
                      onChange={(e) => setForm({ ...form, cinsiyet: e.target.value })}
                    >
                      <option value="">Seçiniz...</option>
                      <option value="Erkek">Erkek</option>
                      <option value="Kadın">Kadın</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Telefon</label>
                    <input 
                      type="tel" 
                      placeholder="+90 (5XX) XXX XX XX" 
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono placeholder:text-zinc-400" 
                      value={form.telefon} 
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
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">E-posta</label>
                    <input type="email" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white" value={form.ePosta} onChange={(e) => setForm({ ...form, ePosta: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">Mesleki Bilgiler</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Uzmanlık Alanı *</label>
                    <input
                      list="uzmanlik-listesi"
                      type="text"
                      required
                      placeholder="Seçin veya yazın"
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                      value={form.uzmanlikAlani}
                      onChange={(e) => setForm({ ...form, uzmanlikAlani: e.target.value })}
                    />
                    <datalist id="uzmanlik-listesi">
                      {UZMANLIK_LISTESI.map(u => <option key={u} value={u} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Çalıştığı Birim</label>
                    <input
                      list="birim-listesi"
                      type="text"
                      placeholder="Seçin veya yazın"
                      className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white"
                      value={form.calistigiBirim}
                      onChange={(e) => setForm({ ...form, calistigiBirim: e.target.value })}
                    />
                    <datalist id="birim-listesi">
                      {BIRIM_LISTESI.map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Diploma / Sicil No</label>
                    <input type="text" placeholder="Örn: S-98765" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono" value={form.sicilNo} onChange={(e) => setForm({ ...form, sicilNo: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Göreve Başlama Tarihi</label>
                    <input type="date" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white font-mono" value={form.goreveBaslamaTarihi} onChange={(e) => setForm({ ...form, goreveBaslamaTarihi: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">Kullanıcı Hesabı</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Kullanıcı Adı</label>
                    <input type="text" placeholder="dr.ahmet" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white" value={form.kullaniciAdi} onChange={(e) => setForm({ ...form, kullaniciAdi: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Şifre</label>
                    <input type="password" placeholder="••••••••" className="w-full h-8 px-2 border border-zinc-300 rounded-lg text-xs font-bold focus:outline-none bg-white" value={form.sifre} onChange={(e) => setForm({ ...form, sifre: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setModalMod(null)}
                  className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold uppercase bg-primary hover:bg-primary-hover text-white rounded-lg tracking-wider transition-colors cursor-pointer shadow-2xs"
                >
                  {modalMod === 'ekle' ? 'Kaydet' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. SİLME ONAY MODALI ── */}
      {silOnayId && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-primary rounded-xl shadow-2xl p-5 max-w-xs w-full text-center space-y-3">
            <h3 className="text-sm font-black text-primary uppercase font-mono">Doktor Kaydını Sil</h3>
            <p className="text-zinc-600 text-xs font-medium">Bu doktor kaydı kalıcı olarak silinecek. Emin misiniz?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSilOnayId(null)}
                className="flex-1 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleSil(silOnayId)}
                className="flex-1 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
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

export default DoktorListesi;