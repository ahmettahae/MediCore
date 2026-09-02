import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config/api';

// Anlık Çalışma / Mesai Durumu Hesaplayıcı (Saate ve Güne Göre)
export const getAnlikMesaiDurumu = (personelVardiya, personelDurum, suAn = new Date()) => {
  if (personelDurum === 'İzinli') return { mesaidedir: false, etiket: 'İzinli', badgeClass: 'bg-zinc-100 text-zinc-600 border border-zinc-300 font-mono' };
  if (personelDurum === 'Raporlu') return { mesaidedir: false, etiket: 'Raporlu', badgeClass: 'bg-zinc-100 text-zinc-600 border border-zinc-300 font-mono' };

  const gun = suAn.getDay();
  const saat = suAn.getHours();
  const dakika = suAn.getMinutes();
  const toplamDakika = saat * 60 + dakika;

  const vardiya = (personelVardiya || '').toLowerCase();
  let mesaidedir = false;

  if (vardiya.includes('hafta içi') || vardiya.includes('08:00 - 17:00')) {
    const haftaIciMi = gun >= 1 && gun <= 5;
    mesaidedir = haftaIciMi && (toplamDakika >= (8 * 60) && toplamDakika < (17 * 60));
  } else if (vardiya.includes('gündüz') || vardiya.includes('08:00 - 16:00')) {
    mesaidedir = toplamDakika >= (8 * 60) && toplamDakika < (16 * 60);
  } else if (vardiya.includes('akşam') || vardiya.includes('16:00 - 00:00') || vardiya.includes('16:00 - 24:00')) {
    mesaidedir = toplamDakika >= (16 * 60) && toplamDakika < (24 * 60);
  } else if (vardiya.includes('gece') || vardiya.includes('00:00 - 08:00')) {
    mesaidedir = toplamDakika >= 0 && toplamDakika < (8 * 60);
  } else {
    const haftaIciMi = gun >= 1 && gun <= 5;
    mesaidedir = haftaIciMi && (toplamDakika >= (8 * 60) && toplamDakika < (17 * 60));
  }

  if (mesaidedir) {
    return {
      mesaidedir: true,
      etiket: 'MESAİDE',
      badgeClass: 'bg-primary text-white font-mono'
    };
  } else {
    return {
      mesaidedir: false,
      etiket: 'MESAİ DIŞI',
      badgeClass: 'bg-zinc-100 text-zinc-600 border border-zinc-300 font-mono'
    };
  }
};

export const formatlaTelefon = (value) => {
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

export const generateUsername = (adSoyad, unvan) => {
  if (!adSoyad) return '';
  const cleanName = adSoyad
    .replace("Dr.", "")
    .replace("Hemşire", "")
    .replace("Hem.", "")
    .trim();

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  const surname = turkceKarakterleriDonustur(parts[parts.length - 1]);
  let firstLetters = '';
  for (let i = 0; i < parts.Length - 1 || i < parts.length - 1; i++) {
    const cleanedPart = turkceKarakterleriDonustur(parts[i]);
    if (cleanedPart.length > 0) {
      firstLetters += cleanedPart[0];
    }
  }

  let prefix = 'per';
  const u = (unvan || '').toLowerCase();
  if (u.includes('hemşire') || u.includes('hemsire') || u.includes('başhemşire')) {
    prefix = 'hem';
  } else if (u.includes('doktor') || u.includes('hekim') || u.includes('başhekim') || u.includes('yönetici') || u.includes('yonetici')) {
    prefix = 'dr';
  }

  if (parts.length === 1) {
    return `${prefix}_${turkceKarakterleriDonustur(parts[0])}`;
  }

  return `${prefix}_${firstLetters}${surname}`;
};

const PersonelListesi = ({ gomulu = false, disAramaMetni }) => {
  const { getAuthHeaders, kullanici } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const baslangicArama = disAramaMetni !== undefined ? disAramaMetni : (queryParams.get('q') || '');

  const [hemsireler, setHemsireler] = useState([]);
  const [doktor, setDoktor] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Filtreleme State'leri
  const [filtreVardiya, setFiltreVardiya] = useState('Tümü');
  const [filtreDurum, setFiltreDurum] = useState('Tümü');
  const [filtreCinsiyet, setFiltreCinsiyet] = useState('Tümü');
  const [filtreGorev, setFiltreGorev] = useState('Tümü');
  const [siralama, setSiralama] = useState('varsayilan');

  // Modal State'leri
  const [seciliPersonel, setSeciliPersonel] = useState(null);
  const [modalAcik, setModalAcik] = useState(false);
  const [modalTipi, setModalTipi] = useState('nobet');
  const [silmeOnayPersonel, setSilmeOnayPersonel] = useState(null);

  // Modal Form State'leri
  const [yeniVardiya, setYeniVardiya] = useState('');
  const [yeniDurum, setYeniDurum] = useState('');
  const [yeniUnvan, setYeniUnvan] = useState('');

  const BOS_PERSONEL = { adSoyad: '', unvan: 'Hemşire', cinsiyet: 'Belirtilmedi', telefon: '+90 ( ) ', durum: 'Mesaide', vardiya: 'Gündüz (08:00 - 16:00)' };
  const [yeniPersonelForm, setYeniPersonelForm] = useState(BOS_PERSONEL);
  const [suAn, setSuAn] = useState(new Date());
  const [aramaMetni, setAramaMetni] = useState(baslangicArama);
  
  useEffect(() => {
    if (disAramaMetni !== undefined) {
      setAramaMetni(disAramaMetni);
    } else {
      setAramaMetni(queryParams.get('q') || '');
    }
  }, [queryParams, disAramaMetni]);

  const fetchPersonel = useCallback(async () => {
    setYukleniyor(true);
    try {
      const h = getAuthHeaders();
      const [personelRes, doktorRes] = await Promise.all([
        fetch(`${API_BASE}/Personel`, { headers: h }),
        fetch(`${API_BASE}/Doktor/kurumhekim`, { headers: h })
      ]);

      if (doktorRes.ok) setDoktor(await doktorRes.json());
      if (personelRes.ok) {
        setHemsireler(await personelRes.json());
      }
    } catch (err) {
      console.error('Veri çekilemedi', err);
    } finally {
      setYukleniyor(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchPersonel();
    const interval = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(interval);
  }, [fetchPersonel]);

  const modalAc = (personel, tip = 'nobet') => {
    setSeciliPersonel(personel);
    setModalTipi(tip);
    if (tip === 'nobet') {
      setYeniVardiya(personel.vardiya || 'Gündüz (08:00 - 16:00)');
      setYeniDurum(personel.durum || 'Mesaide');
    } else if (tip === 'gorev') {
      setYeniUnvan(personel.unvan || 'Hemşire');
    } else if (tip === 'ekle') {
      setYeniPersonelForm(BOS_PERSONEL);
    }
    setModalAcik(true);
  };

  const handleKaydet = async () => {
    try {
      const h = { 'Content-Type': 'application/json', ...getAuthHeaders() };
      
      if (modalTipi === 'ekle') {
        const teli = yeniPersonelForm.telefon === '+90 ( ) ' ? '' : yeniPersonelForm.telefon;
        const digitsOnly = teli.replace(/\D/g, '');
        
        if (teli && (!digitsOnly.startsWith('90') || digitsOnly.length !== 12)) {
          showToast('Telefon numarası geçerli bir formatta olmalıdır (Örn: +90 (532) 123 45 67).', 'error');
          return;
        }

        const res = await fetch(`${API_BASE}/Personel`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({ ...yeniPersonelForm, telefon: teli })
        });
        if (res.ok) {
          showToast('Yeni personel kadroya eklendi.', 'success');
          setModalAcik(false);
          setYeniPersonelForm(BOS_PERSONEL);
          fetchPersonel();
        } else {
          showToast('Personel eklenemedi.', 'error');
        }
      } else {
        const guncel = {
          ...seciliPersonel,
          vardiya: modalTipi === 'nobet' ? yeniVardiya : seciliPersonel.vardiya,
          durum: modalTipi === 'nobet' ? yeniDurum : seciliPersonel.durum,
          unvan: modalTipi === 'gorev' ? yeniUnvan : seciliPersonel.unvan
        };
        const res = await fetch(`${API_BASE}/Personel/${seciliPersonel.id}`, {
          method: 'PUT',
          headers: h,
          body: JSON.stringify(guncel)
        });
        if (res.ok) {
          showToast('Personel kaydı güncellendi.', 'success');
          setModalAcik(false);
          fetchPersonel();
        } else {
          showToast('Güncelleme başarısız.', 'error');
        }
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  const handleSil = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/Personel/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Personel silindi.', 'info');
        fetchPersonel();
      }
    } catch {
      showToast('İşlem başarısız.', 'error');
    }
  };

  const filtrelenmisHemsireler = hemsireler.filter(h => {
    const adUygun = (h.adSoyad || '').toLowerCase().includes(aramaMetni.toLowerCase()) ||
                    (h.unvan || '').toLowerCase().includes(aramaMetni.toLowerCase());
    const vardiyaUygun = filtreVardiya === 'Tümü' || (h.vardiya || '').includes(filtreVardiya);
    const cinsiyetUygun = filtreCinsiyet === 'Tümü' || h.cinsiyet === filtreCinsiyet;
    const gorevUygun = filtreGorev === 'Tümü' || h.unvan === filtreGorev;
    let durumUygun = true;
    if (filtreDurum === 'BugünBurada') {
      durumUygun = getAnlikMesaiDurumu(h.vardiya, h.durum, suAn).mesaidedir;
    } else if (filtreDurum !== 'Tümü') {
      durumUygun = h.durum === filtreDurum;
    }
    return adUygun && vardiyaUygun && cinsiyetUygun && gorevUygun && durumUygun;
  });

  return (
    <div className={`space-y-4 font-sans text-primary ${gomulu ? '' : 'pb-12 max-w-6xl mx-auto'}`}>
      
      {/* ── 1. ÜST BAŞLIK (GÖMÜLÜ DEĞİLSE) ── */}
      {!gomulu && (
        <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
              Sağlık & Bakım Personeli
            </h1>
            <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
              Hemşireler, Yaşlı Bakım Personelleri ve Destek Ekibi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-60">
              <input
                type="text"
                placeholder="Personel veya Görev Ara..."
                value={aramaMetni}
                onChange={(e) => setAramaMetni(e.target.value)}
                className="w-full h-6 text-xs font-bold text-primary bg-transparent focus:outline-none placeholder:text-zinc-400"
              />
            </form>
          </div>
        </div>
      )}

      {/* ── 2. FİLTRELER & AKSİYON BARI ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-primary p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={filtreGorev} 
            onChange={(e) => setFiltreGorev(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Görevler</option>
            <option value="Hemşire">Hemşire</option>
            <option value="Başhemşire">Başhemşire</option>
            <option value="Hasta Bakımcı">Bakım Personeli</option>
            <option value="Temizlik Görevlisi">Temizlik Görevlisi</option>
            <option value="Mutfak Personeli">Mutfak Personeli</option>
            <option value="Güvenlik">Güvenlik</option>
          </select>

          <select 
            value={filtreVardiya} 
            onChange={(e) => setFiltreVardiya(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Vardiyalar</option>
            <option value="Gündüz">Gündüz</option>
            <option value="Akşam">Akşam</option>
            <option value="Gece">Gece</option>
            <option value="Hafta İçi">Hafta İçi Mesai</option>
          </select>

          <select 
            value={filtreDurum} 
            onChange={(e) => setFiltreDurum(e.target.value)}
            className="h-8 px-2.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none cursor-pointer text-zinc-800"
          >
            <option value="Tümü">Tüm Durumlar</option>
            <option value="BugünBurada">Şu An Mesaide Olanlar</option>
            <option value="Mesaide">Mesaide</option>
            <option value="İzinli">İzinli</option>
          </select>

          <div className="text-[11px] font-mono font-bold px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-300 text-zinc-700">
            <b>{filtrelenmisHemsireler.length}</b> Personel
          </div>
        </div>

        {kullanici?.rol === 'Bashekim' && (
          <button 
            onClick={() => modalAc(null, 'ekle')}
            className="h-8 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center shrink-0 cursor-pointer shadow-2xs"
          >
            + Yeni Personel
          </button>
        )}
      </div>

      {/* ── 3. PERSONEL KARTLARI (GRID) ── */}
      <div className="bg-white border border-primary rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-100/90 border-b border-primary flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-primary font-mono">
            Sağlık & Bakım Kadrosu ({filtrelenmisHemsireler.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500 font-bold">
            {filtrelenmisHemsireler.filter(h => getAnlikMesaiDurumu(h.vardiya, h.durum, suAn).mesaidedir).length} Kişi Şu An Mesaide
          </span>
        </div>

        {yukleniyor ? (
          <div className="text-center py-16 text-zinc-500 font-mono text-xs animate-pulse uppercase">
            Personel Kadrosu Yükleniyor...
          </div>
        ) : filtrelenmisHemsireler.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            Kayıtlı personel bulunamadı.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filtrelenmisHemsireler.map((h, idx) => {
              const mesaiBilgisi = getAnlikMesaiDurumu(h.vardiya, h.durum, suAn);

              return (
                <div key={h.id || idx} className="p-3.5 rounded-xl bg-white border border-zinc-300 hover:border-primary transition-colors flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-primary">{h.adSoyad}</h4>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${mesaiBilgisi.badgeClass}`}>
                        {mesaiBilgisi.etiket}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-mono mt-0.5 pb-1.5 border-b border-zinc-200">
                      {h.unvan === 'Doktor' ? 'Kurum Hekimi' : h.unvan}
                    </p>
                    
                    <div className="mt-2 space-y-0.5 text-xs text-zinc-700">
                      <p><span className="text-zinc-400 font-mono text-[10px]">Kullanıcı Adı:</span> <b className="font-mono text-[11px] text-zinc-900">{generateUsername(h.adSoyad, h.unvan)}</b></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">Vardiya:</span> <b className="font-mono text-[11px]">{h.vardiya}</b></p>
                      <p><span className="text-zinc-400 font-mono text-[10px]">İletişim:</span> <b className="font-mono text-[11px]">{h.telefon || '—'}</b></p>
                    </div>
                  </div>

                  {kullanici?.rol === 'Bashekim' && (
                    <div className="pt-2 border-t border-zinc-200 space-y-1">
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => modalAc(h, 'nobet')}
                          className="flex-1 py-1 rounded border border-zinc-300 bg-white text-zinc-800 text-[10px] font-bold uppercase hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          Nöbet
                        </button>
                        <button 
                          onClick={() => modalAc(h, 'gorev')}
                          className="flex-1 py-1 rounded border border-zinc-300 bg-white text-zinc-800 text-[10px] font-bold uppercase hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                          Görev
                        </button>
                        <button 
                          onClick={() => setSilmeOnayPersonel(h)}
                          className="py-1 px-2 rounded bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PERSONEL MODALI ── */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-primary rounded-xl p-5 w-full max-w-md shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h2 className="text-xs font-black uppercase text-primary font-mono">
                {modalTipi === 'nobet' ? 'Nöbet & Vardiya Yönetimi' : modalTipi === 'gorev' ? 'Görev (Unvan) Atama' : 'Yeni Personel Tanımla'}
              </h2>
              <button onClick={() => setModalAcik(false)} className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"><X size={13} strokeWidth={2.5} /></button>
            </div>
            
            {modalTipi !== 'ekle' && seciliPersonel && (
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-0.5">
                <p className="text-primary"><b>{seciliPersonel.adSoyad}</b> ({seciliPersonel.unvan})</p>
                <p className="text-zinc-500 font-mono text-[11px]">Mevcut Vardiya: {seciliPersonel.vardiya}</p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {modalTipi === 'nobet' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Yeni Vardiya</label>
                    <select 
                      className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                      value={yeniVardiya}
                      onChange={(e) => setYeniVardiya(e.target.value)}
                    >
                      <option value="Gündüz (08:00 - 16:00)">Gündüz (08:00 - 16:00)</option>
                      <option value="Akşam (16:00 - 24:00)">Akşam (16:00 - 24:00)</option>
                      <option value="Gece (00:00 - 08:00)">Gece (00:00 - 08:00)</option>
                      <option value="Hafta İçi (08:00 - 17:00)">Hafta İçi (08:00 - 17:00)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Durumu Güncelle</label>
                    <select 
                      className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                      value={yeniDurum}
                      onChange={(e) => setYeniDurum(e.target.value)}
                    >
                      <option value="Mesaide">Mesaide</option>
                      <option value="Nöbetçi">Nöbetçi</option>
                      <option value="İzinli">İzinli</option>
                    </select>
                  </div>
                </>
              )}
              
              {modalTipi === 'gorev' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Yeni Görev (Unvan)</label>
                  <select 
                    className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                    value={yeniUnvan}
                    onChange={(e) => setYeniUnvan(e.target.value)}
                  >
                    <option value="Başhemşire">Başhemşire</option>
                    <option value="Hemşire">Hemşire</option>
                    <option value="Hasta Bakımcı">Bakım Personeli</option>
                    <option value="Temizlik Görevlisi">Temizlik Görevlisi</option>
                    <option value="Mutfak Personeli">Mutfak Personeli</option>
                    <option value="Güvenlik">Güvenlik</option>
                  </select>
                </div>
              )}

              {modalTipi === 'ekle' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Ad Soyad *</label>
                    <input 
                      type="text"
                      required
                      className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold focus:outline-none"
                      value={yeniPersonelForm.adSoyad}
                      onChange={(e) => setYeniPersonelForm({...yeniPersonelForm, adSoyad: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Unvan</label>
                      <select 
                        className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                        value={yeniPersonelForm.unvan}
                        onChange={(e) => setYeniPersonelForm({...yeniPersonelForm, unvan: e.target.value})}
                      >
                        <option value="Hemşire">Hemşire</option>
                        <option value="Başhemşire">Başhemşire</option>
                        <option value="Hasta Bakımcı">Bakım Personeli</option>
                        <option value="Temizlik Görevlisi">Temizlik Görevlisi</option>
                        <option value="Mutfak Personeli">Mutfak Personeli</option>
                        <option value="Güvenlik">Güvenlik</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Cinsiyet</label>
                      <select 
                        className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                        value={yeniPersonelForm.cinsiyet}
                        onChange={(e) => setYeniPersonelForm({...yeniPersonelForm, cinsiyet: e.target.value})}
                      >
                        <option value="Erkek">Erkek</option>
                        <option value="Kadın">Kadın</option>
                        <option value="Belirtilmedi">Belirtilmedi</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Telefon</label>
                    <input 
                      type="text"
                      placeholder="+90 (5XX) XXX XX XX"
                      className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold focus:outline-none font-mono placeholder:text-zinc-400"
                      value={yeniPersonelForm.telefon}
                      onFocus={(e) => {
                        const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                        ayarlaCursor(e.target, cleaned.length);
                      }}
                      onChange={(e) => {
                        const formatted = formatlaTelefon(e.target.value);
                        const cleaned = e.target.value.replace(/^\+90\s?\(?/, '').replace(/\D/g, '').substring(0, 10);
                        setYeniPersonelForm({
                          ...yeniPersonelForm,
                          telefon: formatted
                        });
                        ayarlaCursor(e.target, cleaned.length);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-0.5 text-zinc-600 font-mono">Vardiya</label>
                    <select 
                      className="w-full border border-zinc-300 rounded-lg p-2 text-xs font-bold bg-white focus:outline-none" 
                      value={yeniPersonelForm.vardiya}
                      onChange={(e) => setYeniPersonelForm({...yeniPersonelForm, vardiya: e.target.value})}
                    >
                      <option value="Gündüz (08:00 - 16:00)">Gündüz (08:00 - 16:00)</option>
                      <option value="Akşam (16:00 - 24:00)">Akşam (16:00 - 24:00)</option>
                      <option value="Gece (00:00 - 08:00)">Gece (00:00 - 08:00)</option>
                      <option value="Hafta İçi (08:00 - 17:00)">Hafta İçi (08:00 - 17:00)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button 
                  onClick={() => setModalAcik(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
                >
                  İptal
                </button>
                <button 
                  onClick={handleKaydet}
                  disabled={modalTipi === 'ekle' && !yeniPersonelForm.adSoyad.trim()}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SİLME ONAY MODALI ── */}
      {silmeOnayPersonel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-red-500 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h2 className="text-xs font-black uppercase text-red-600 font-mono flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-600 shrink-0" />
                <span>Personel Silme Onayı</span>
              </h2>
              <button 
                onClick={() => setSilmeOnayPersonel(null)} 
                className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="text-xs text-zinc-700 space-y-2 leading-relaxed">
              <p>
                <span className="font-bold text-primary">{silmeOnayPersonel.adSoyad}</span> ({silmeOnayPersonel.unvan}) isimli personelin kaydını silmek istediğinize emin misiniz?
              </p>
              <p className="text-zinc-500 text-[11px] font-mono bg-zinc-50 border border-zinc-200 p-2.5 rounded">
                Bu işlem geri alınamaz ve personele ait tüm aktif nöbet/vardiya tanımlamaları kaldırılacaktır.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button 
                onClick={() => setSilmeOnayPersonel(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold uppercase text-[11px] cursor-pointer"
              >
                Vazgeç
              </button>
              <button 
                onClick={() => {
                  handleSil(silmeOnayPersonel.id);
                  setSilmeOnayPersonel(null);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase text-[11px] tracking-wider transition-colors cursor-pointer shadow-2xs"
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

export default PersonelListesi;
