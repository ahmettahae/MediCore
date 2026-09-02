import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, Sun, Sunset, Moon, CalendarDays, Calendar, Plus } from 'lucide-react';
import { API_BASE } from '../config/api';

const VardiyaTakvim = () => {
  const { getAuthHeaders, kullanici } = useAuth();
  const [suAn, setSuAn] = useState(new Date());
  const [nobetler, setNobetler] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [modalAcik, setModalAcik] = useState(false);
  const [seciliGun, setSeciliGun] = useState(null);
  
  // Nöbet modalı state'leri
  const [yeniNobet, setYeniNobet] = useState({ personelId: '', vardiyaTuru: 'Gündüz' });
  const [aramaMetni, setAramaMetni] = useState('');

  // Takvim ay/yıl kontrolü — Varsayılan olarak güncel tarih
  const [seciliTarih, setSeciliTarih] = useState(new Date()); 
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const aktifAyStr = `${aylar[seciliTarih.getMonth()]} ${seciliTarih.getFullYear()}`;
  const gunler = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  // Canlı saat sayacı
  useEffect(() => {
    const timer = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPersoneller = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/Personel`, { headers: getAuthHeaders() });
      if (res.ok) setPersoneller(await res.json());
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  const fetchNobetler = useCallback(async (tarih) => {
    try {
      const res = await fetch(`${API_BASE}/Nobet`, { headers: getAuthHeaders() });
      if (res.ok) {
        const tumNobetler = await res.json();
        const yy = tarih.getFullYear();
        const mm = tarih.getMonth() + 1;
        const buAydakiler = tumNobetler.filter(n => {
          if (!n.nobetTarihi) return false;
          const d = new Date(n.nobetTarihi);
          return d.getFullYear() === yy && (d.getMonth() + 1) === mm;
        });
        
        setNobetler(buAydakiler);
      }
    } catch (e) {
      console.error(e);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchPersoneller();
  }, [fetchPersoneller]);

  useEffect(() => {
    fetchNobetler(seciliTarih);
  }, [fetchNobetler, seciliTarih]);

  const nobetEkle = async (e) => {
    e.preventDefault();
    if (!yeniNobet.personelId || !seciliGun) return;

    try {
      const gunStr = seciliGun.toString().padStart(2, '0');
      const ayStr = (seciliTarih.getMonth() + 1).toString().padStart(2, '0');
      const tarihStr = `${seciliTarih.getFullYear()}-${ayStr}-${gunStr}`;

      let bs = "08:00:00", bt = "16:00:00";
      if (yeniNobet.vardiyaTuru === 'Akşam') { bs = "16:00:00"; bt = "00:00:00"; }
      if (yeniNobet.vardiyaTuru === 'Gece') { bs = "00:00:00"; bt = "08:00:00"; }

      const data = {
        personelId: parseInt(yeniNobet.personelId),
        vardiyaTuru: yeniNobet.vardiyaTuru,
        nobetTarihi: tarihStr,
        baslangicSaati: bs,
        bitisSaati: bt,
        aktif: true
      };
      await fetch(`${API_BASE}/Nobet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      setYeniNobet({ personelId: '', vardiyaTuru: 'Gündüz' });
      fetchNobetler(seciliTarih);
    } catch (e) {
      console.error(e);
    }
  };

  const nobetSil = async (id) => {
    try {
      await fetch(`${API_BASE}/Nobet/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchNobetler(seciliTarih);
    } catch (e) {
      console.error(e);
    }
  };

  const AYLAR = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];

  // Arama metni girildiğinde Ay veya Yıl kontrolü yapıp takvimi o tarihe getir
  useEffect(() => {
    if (!aramaMetni.trim()) return;
    const metin = aramaMetni.trim().toLowerCase();

    // 1. Ay araması (Örn: "Ocak", "Ağustos", "Ağustos 2026")
    const ayIndex = AYLAR.findIndex(a => metin.includes(a));
    if (ayIndex !== -1) {
      setSeciliTarih(prev => {
        const yeniTarih = new Date(prev);
        yeniTarih.setMonth(ayIndex);
        const yilMatch = metin.match(/\b(20\d\d)\b/);
        if (yilMatch) {
          yeniTarih.setFullYear(parseInt(yilMatch[1], 10));
        }
        return yeniTarih;
      });
    }
  }, [aramaMetni]);

  // Takvim ayı içindeki gün sayısını bul
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const gunSayisi = getDaysInMonth(seciliTarih.getFullYear(), seciliTarih.getMonth());

  // Gün araması kontrolü
  const gunMatch = aramaMetni.trim().match(/\b([1-9]|[12]\d|3[01])\b/);
  const arananGunSayisi = gunMatch ? parseInt(gunMatch[1], 10) : NaN;
  const gunFiltresiAktif = !isNaN(arananGunSayisi);

  const takvimGunleri = Array.from({ length: gunSayisi }, (_, i) => {
    const gun = i + 1;
    const yy = seciliTarih.getFullYear();
    const mm = seciliTarih.getMonth() + 1;
    
    let gununNobetleri = nobetler.filter(n => {
      if (!n.nobetTarihi) return false;
      const d = new Date(n.nobetTarihi);
      return d.getFullYear() === yy && (d.getMonth() + 1) === mm && d.getDate() === gun;
    });

    const bugunMu = suAn.getDate() === gun && suAn.getMonth() === seciliTarih.getMonth() && suAn.getFullYear() === seciliTarih.getFullYear();
    const arananGunMu = gunFiltresiAktif && gun === arananGunSayisi;

    return {
      gun,
      gunduz: gununNobetleri.filter(n => n.vardiyaTuru === 'Gündüz'),
      aksam: gununNobetleri.filter(n => n.vardiyaTuru === 'Akşam'),
      gece: gununNobetleri.filter(n => n.vardiyaTuru === 'Gece'),
      haftaici: gununNobetleri.filter(n => n.vardiyaTuru === 'Hafta İçi'),
      bugunMu,
      arananGunMu
    };
  });

  const oncekiAy = () => {
    const yeni = new Date(seciliTarih);
    yeni.setMonth(yeni.getMonth() - 1);
    setSeciliTarih(yeni);
  };

  const sonrakiAy = () => {
    const yeni = new Date(seciliTarih);
    yeni.setMonth(yeni.getMonth() + 1);
    setSeciliTarih(yeni);
  };

  const buguneGit = () => {
    setSeciliTarih(new Date());
  };

  const ilkGunBosluklari = new Date(seciliTarih.getFullYear(), seciliTarih.getMonth(), 1).getDay();
  const boslukSayisi = ilkGunBosluklari === 0 ? 6 : ilkGunBosluklari - 1;

  return (
    <div className="space-y-4 font-sans text-primary pb-12 max-w-6xl mx-auto">
      
      {/* ── 1. MONOKROM ÜST BAŞLIK & ARAMA ── */}
      <div className="bg-white rounded-xl border border-primary p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            Vardiya & Nöbet Takvimi
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            Aylık Personel Nöbet Çizelgesi & Vardiya Planlaması
          </span>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-2 w-full sm:w-72">
          <input
            type="text"
            placeholder="Gün veya Ay Ara (Örn: 15, Ağustos)..."
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
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </form>
      </div>

      {/* ── AY KONTROLLERİ & HIZLI GEÇİŞ ── */}
      <div className="bg-white rounded-xl border border-primary p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={oncekiAy} 
            className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            ← Önceki Ay
          </button>
          <button 
            onClick={sonrakiAy} 
            className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Sonraki Ay →
          </button>
        </div>

        <h2 className="text-base font-black text-primary uppercase tracking-wider font-mono">
          {aktifAyStr}
        </h2>

        <button 
          onClick={buguneGit} 
          className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
        >
          Bugüne Dön
        </button>
      </div>

      {/* ── 2. TAKVİM GRID ── */}
      <div className="bg-white rounded-xl border border-primary shadow-xs overflow-hidden">
        
        {/* Gün İsimleri Başlığı */}
        <div className="grid grid-cols-7 border-b border-primary bg-zinc-100/90">
          {gunler.map(gun => (
            <div key={gun} className="py-2.5 text-center border-r border-zinc-300 last:border-r-0 font-mono font-bold text-xs uppercase text-primary">
              {gun}
            </div>
          ))}
        </div>

        {/* Gün Hücreleri */}
        <div className="grid grid-cols-7 bg-zinc-100/30">
          {Array.from({ length: boslukSayisi }).map((_, idx) => (
            <div key={`bos-${idx}`} className="border-r border-b border-zinc-200 bg-zinc-50/50 min-h-[120px]"></div>
          ))}
          
          {takvimGunleri.map((veri) => {
            const vurguluMu = veri.bugunMu || veri.arananGunMu;

            return (
              <div 
                key={veri.gun} 
                className={`border-r border-b border-zinc-200 p-2 min-h-[120px] flex flex-col group transition-colors relative cursor-pointer ${
                  vurguluMu 
                    ? 'bg-primary text-white hover:bg-primary-hover' 
                    : 'bg-white text-primary hover:bg-zinc-50'
                }`}
                onClick={() => { setSeciliGun(veri.gun); setModalAcik(true); }}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-black font-mono ${vurguluMu ? 'text-white' : 'text-zinc-800'}`}>
                      {veri.gun}
                    </span>
                    {veri.bugunMu && (
                      <span className="text-[8px] font-black uppercase bg-white text-primary px-1 py-0.2 rounded font-mono">
                        BUGÜN
                      </span>
                    )}
                    {veri.arananGunMu && !veri.bugunMu && (
                      <span className="text-[8px] font-black uppercase bg-white text-primary px-1 py-0.2 rounded font-mono animate-pulse">
                        ARANAN
                      </span>
                    )}
                  </div>

                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    vurguluMu ? 'bg-primary text-white' : 'bg-zinc-200 text-zinc-800'
                  }`}>
                    Düzenle
                  </span>
                </div>
                
                <div className="space-y-1 mt-auto text-[10px]">
                  <div className={`p-1 rounded leading-tight border ${
                    vurguluMu ? 'bg-primary/80 border-primary text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}>
                    <span className={`flex items-center gap-1 text-[8px] font-mono font-bold uppercase mb-0.2 ${vurguluMu ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Sun size={9} strokeWidth={2.2} className="shrink-0" /> Gündüz:
                    </span>
                    <div className="truncate font-medium">{veri.gunduz.map(n => n.hemsireAd).join(', ') || '—'}</div>
                  </div>

                  <div className={`p-1 rounded leading-tight border ${
                    vurguluMu ? 'bg-primary/80 border-primary text-zinc-200' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                  }`}>
                    <span className={`flex items-center gap-1 text-[8px] font-mono font-bold uppercase mb-0.2 ${vurguluMu ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Sunset size={9} strokeWidth={2.2} className="shrink-0" /> Akşam:
                    </span>
                    <div className="truncate font-medium">{veri.aksam.map(n => n.hemsireAd).join(', ') || '—'}</div>
                  </div>

                  <div className={`p-1 rounded leading-tight border ${
                    vurguluMu ? 'bg-primary/80 border-primary text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  }`}>
                    <span className={`flex items-center gap-1 text-[8px] font-mono font-bold uppercase mb-0.2 ${vurguluMu ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <Moon size={9} strokeWidth={2.2} className="shrink-0" /> Gece:
                    </span>
                    <div className="truncate font-medium">{veri.gece.map(n => n.hemsireAd).join(', ') || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NÖBET DÜZENLEME / ATAMA MODALI ── */}
      {modalAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-primary rounded-xl p-5 w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-3">
              <h2 className="text-sm font-black uppercase text-primary font-mono flex items-center gap-1.5">
                <CalendarDays size={14} className="text-primary" />
                <span>{seciliGun} {aktifAyStr} Nöbetleri</span>
              </h2>
              <button 
                onClick={() => setModalAcik(false)} 
                className="text-zinc-400 hover:text-primary font-bold text-xs cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-3 space-y-3 pr-1">
              {[
                { tur: 'Gündüz', ikon: Sun },
                { tur: 'Akşam', ikon: Sunset },
                { tur: 'Gece', ikon: Moon },
                { tur: 'Hafta İçi', ikon: Calendar }
              ].map(({ tur: vardiyaTuru, ikon: VardiyaIkon }) => {
                const mapKey = { 'Gündüz': 'gunduz', 'Akşam': 'aksam', 'Gece': 'gece', 'Hafta İçi': 'haftaici' };
                const gununNobetleri = takvimGunleri.find(g => g.gun === seciliGun)?.[mapKey[vardiyaTuru]] || [];
                return (
                  <div key={vardiyaTuru} className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase text-zinc-600 font-mono px-1 flex items-center gap-1.5">
                      <VardiyaIkon size={12} strokeWidth={2} className="shrink-0 text-zinc-500 dark:text-zinc-400" />
                      <span>{vardiyaTuru} Vardiyası</span>
                    </h3>
                    {gununNobetleri.length === 0 ? (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-center text-[10px] text-zinc-400 font-medium">
                        Nöbetçi atanmadı
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {gununNobetleri.map(n => (
                          <div key={n.id} className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs">
                            <span className="font-bold text-primary">{n.hemsireAd} {n.hemsireSoyad} <span className="text-[10px] font-mono text-zinc-500 font-normal">({n.hemsireTelefon})</span></span>
                            {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') && (
                              <button 
                                onClick={() => nobetSil(n.id)} 
                                className="text-[10px] bg-zinc-200 text-red-700 hover:bg-red-600 hover:text-white px-2 py-0.5 rounded font-bold uppercase transition-colors cursor-pointer"
                              >
                                Sil
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(kullanici?.rol === 'Bashekim' || kullanici?.rol === 'Bashemsire') && (
              <form onSubmit={nobetEkle} className="border-t border-zinc-200 pt-3 space-y-2 bg-zinc-50 p-3 rounded-lg">
                <h3 className="text-xs font-black uppercase text-primary font-mono">Yeni Nöbetçi Ekle</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    required 
                    className="flex-1 border border-zinc-300 rounded-lg p-1.5 text-xs font-bold focus:outline-none bg-white" 
                    value={yeniNobet.personelId} 
                    onChange={(e) => setYeniNobet({...yeniNobet, personelId: e.target.value})}
                  >
                    <option value="">Personel Seçiniz...</option>
                    {personeller.map(p => (
                      <option key={p.id} value={p.id}>{p.adSoyad} ({p.unvan})</option>
                    ))}
                  </select>
                  <select 
                    className="border border-zinc-300 rounded-lg p-1.5 text-xs font-bold focus:outline-none bg-white w-32" 
                    value={yeniNobet.vardiyaTuru} 
                    onChange={(e) => setYeniNobet({...yeniNobet, vardiyaTuru: e.target.value})}
                  >
                    <option value="Gündüz">Gündüz</option>
                    <option value="Akşam">Akşam</option>
                    <option value="Gece">Gece</option>
                    <option value="Hafta İçi">Hafta İçi</option>
                  </select>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white uppercase font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default VardiyaTakvim;
