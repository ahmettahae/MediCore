import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Pill, AlertTriangle, Clock, Check, X, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { API_BASE as API_ROOT } from '../config/api';

const API_BASE = `${API_ROOT}/IlacUygulama`;

const OGUNLER = [
  { id: 'Sabah', etiket: 'Sabah', saat: '08:00', ikon: Sunrise },
  { id: 'Öğle', etiket: 'Öğle', saat: '13:00', ikon: Sun },
  { id: 'Akşam', etiket: 'Akşam', saat: '19:00', ikon: Sunset },
  { id: 'Gece', etiket: 'Gece', saat: '22:00', ikon: Moon },
];

const IlacDagitimPaneli = () => {
  const { getAuthHeaders } = useAuth();
  const { showToast } = useToast();

  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [secilenOgun, setSecilenOgun] = useState(() => {
    const saat = new Date().getHours();
    if (saat < 11) return 'Sabah';
    if (saat < 16) return 'Öğle';
    if (saat < 21) return 'Akşam';
    return 'Gece';
  });

  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [katFiltresi, setKatFiltresi] = useState('Tumu');
  const [durumFiltresi, setDurumFiltresi] = useState('Tumu');

  // Açıklama / Neden Modal
  const [aciklamaModal, setAciklamaModal] = useState(false);
  const [secilenIlacUygulama, setSecilenIlacUygulama] = useState(null);
  const [aciklamaMetni, setAciklamaMetni] = useState('');
  const [hedefDurum, setHedefDurum] = useState('Reddedildi');

  const verileriGetir = useCallback(async (showLoading = false) => {
    if (showLoading) setYukleniyor(true);
    try {
      const res = await fetch(`${API_BASE}/gunluk?tarih=${tarih}&ogun=${encodeURIComponent(secilenOgun)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const d = await res.json();
        setVeri(d);
      } else {
        showToast('İlaç dağıtım verileri alınamadı.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Bağlantı hatası oluştu.', 'error');
    } finally {
      if (showLoading) setYukleniyor(false);
    }
  }, [tarih, secilenOgun, getAuthHeaders, showToast]);

  useEffect(() => {
    verileriGetir(true);
  }, [tarih, secilenOgun]);

  // Optimistic Durum Güncellemesi
  const durumGuncelle = async (hastaIlacId, yeniDurum, aciklama = null) => {
    setVeri(prev => {
      if (!prev || !prev.cizelge) return prev;
      const yeniCizelge = prev.cizelge.map(h => {
        const yeniIlaclar = h.ilaclar.map(i => {
          if (i.hastaIlacId === hastaIlacId) {
            return {
              ...i,
              durum: yeniDurum,
              aciklama: aciklama || (yeniDurum === 'Bekliyor' ? null : i.aciklama),
              uygulamaZamani: yeniDurum === 'Bekliyor' ? null : new Date().toISOString()
            };
          }
          return i;
        });
        const tamamlanan = yeniIlaclar.filter(i => i.durum === 'Verildi').length;
        return { ...h, ilaclar: yeniIlaclar, tamamlananIlac: tamamlanan };
      });
      const toplamTamamlanan = yeniCizelge.reduce((sum, h) => sum + h.tamamlananIlac, 0);
      return { ...prev, cizelge: yeniCizelge, tamamlananIlac: toplamTamamlanan };
    });

    try {
      const res = await fetch(`${API_BASE}/durum-guncelle`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hastaIlacId,
          tarih,
          ogun: secilenOgun,
          durum: yeniDurum,
          aciklama
        })
      });

      if (res.ok) {
        showToast(`İlaç durumu "${yeniDurum}" olarak kaydedildi.`, 'success');
        verileriGetir(false);
      } else {
        showToast('Durum güncellenirken hata oluştu.', 'error');
        verileriGetir(false);
      }
    } catch {
      showToast('Sunucu bağlantı hatası.', 'error');
      verileriGetir(false);
    }
  };

  // Toplu Verildi (Optimistic)
  const topluVerildiYap = async (hastaIlacIdler) => {
    if (!hastaIlacIdler || hastaIlacIdler.length === 0) return;

    setVeri(prev => {
      if (!prev || !prev.cizelge) return prev;
      const idSet = new Set(hastaIlacIdler);
      const yeniCizelge = prev.cizelge.map(h => {
        const yeniIlaclar = h.ilaclar.map(i => {
          if (idSet.has(i.hastaIlacId)) {
            return {
              ...i,
              durum: 'Verildi',
              uygulamaZamani: new Date().toISOString()
            };
          }
          return i;
        });
        const tamamlanan = yeniIlaclar.filter(i => i.durum === 'Verildi').length;
        return { ...h, ilaclar: yeniIlaclar, tamamlananIlac: tamamlanan };
      });
      const toplamTamamlanan = yeniCizelge.reduce((sum, h) => sum + h.tamamlananIlac, 0);
      return { ...prev, cizelge: yeniCizelge, tamamlananIlac: toplamTamamlanan };
    });

    try {
      const res = await fetch(`${API_BASE}/toplu-verildi`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hastaIlacIdler,
          tarih,
          ogun: secilenOgun
        })
      });

      if (res.ok) {
        showToast('Tüm ilaçlar başarıyla verildi olarak kaydedildi.', 'success');
        verileriGetir(false);
      } else {
        showToast('İşlem başarısız oldu.', 'error');
        verileriGetir(false);
      }
    } catch {
      showToast('Sunucu bağlantı hatası.', 'error');
      verileriGetir(false);
    }
  };

  const aciklamaModaliAc = (ilac, durum) => {
    setSecilenIlacUygulama(ilac);
    setHedefDurum(durum);
    setAciklamaMetni(ilac.aciklama || '');
    setAciklamaModal(true);
  };

  const aciklamaKaydet = () => {
    if (!secilenIlacUygulama) return;
    durumGuncelle(secilenIlacUygulama.hastaIlacId, hedefDurum, aciklamaMetni);
    setAciklamaModal(false);
    setSecilenIlacUygulama(null);
    setAciklamaMetni('');
  };

  const filtrelenmisHastalar = veri?.cizelge?.filter(h => {
    const tamAd = `${h.ad} ${h.soyad}`.toLowerCase();
    const hastaNo = (h.hastaNo || '').toLowerCase();
    const oda = (h.odaNo || '').toLowerCase();
    const aramaUygun =
      tamAd.includes(aramaMetni.toLowerCase()) ||
      hastaNo.includes(aramaMetni.toLowerCase()) ||
      oda.includes(aramaMetni.toLowerCase()) ||
      h.ilaclar.some(i => i.ilacAd.toLowerCase().includes(aramaMetni.toLowerCase()));

    const katNo = (h.odaNo || '')[0];
    const katUygun = katFiltresi === 'Tumu' || katNo === katFiltresi;

    const durumUygun =
      durumFiltresi === 'Tumu' ||
      (durumFiltresi === 'Bekleyen' && h.ilaclar.some(i => i.durum === 'Bekliyor')) ||
      (durumFiltresi === 'Tamamlanan' && h.ilaclar.every(i => i.durum === 'Verildi'));

    return aramaUygun && katUygun && durumUygun;
  }) || [];

  const yuzde = veri?.toplamPlanlananIlac > 0
    ? Math.round((veri.tamamlananIlac / veri.toplamPlanlananIlac) * 100)
    : 0;

  return (
    <div className="space-y-3.5 font-sans pb-12 text-primary max-w-6xl mx-auto">
      {/* ── 1. MONOKROM ÜST BAŞLIK & ÖĞÜN SEÇİCİ ── */}
      <div className="bg-white rounded-xl border border-primary p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Pill size={20} strokeWidth={2} className="text-primary shrink-0" />
            <div>
              <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
                İlaç Dağıtım Çizelgesi (MAR)
              </h1>
              <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
                {secilenOgun} Öğünü • {veri?.tamamlananIlac ?? 0} / {veri?.toplamPlanlananIlac ?? 0} Verildi (%{yuzde})
              </span>
            </div>
          </div>

          {/* Tarih & İlerleme */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 w-32">
              <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden border border-zinc-400">
                <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${yuzde}%` }} />
              </div>
              <span className="text-[11px] font-black font-mono">%{yuzde}</span>
            </div>

            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-zinc-50 border border-zinc-400 text-xs font-bold text-primary focus:outline-none focus:border-primary cursor-pointer font-mono"
            />
          </div>
        </div>

        {/* ── MONOKROM ÖĞÜN SEKMELERİ ── */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-zinc-200">
          {OGUNLER.map(o => {
            const aktif = secilenOgun === o.id;
            const Ikon = o.ikon;
            return (
              <button
                key={o.id}
                onClick={() => setSecilenOgun(o.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  aktif
                    ? 'bg-primary text-white border border-primary shadow-xs'
                    : 'bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {Ikon && <Ikon size={13} strokeWidth={2.2} className="shrink-0" />}
                <span>{o.etiket}</span>
                <span className={`text-[10px] font-mono font-bold ${aktif ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {o.saat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. MONOKROM FİLTRE ŞERİDİ ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl border border-primary p-2 shadow-2xs">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Sakin Adı, Oda No veya İlaç Ara..."
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

        <select
          value={durumFiltresi}
          onChange={(e) => setDurumFiltresi(e.target.value)}
          className="h-8 px-2.5 rounded-lg bg-white border border-zinc-400 text-xs font-bold text-zinc-800 cursor-pointer focus:outline-none"
        >
          <option value="Tumu">Tüm Durumlar</option>
          <option value="Bekleyen">Bekleyenler</option>
          <option value="Tamamlanan">Tamamlananlar</option>
        </select>

        <span className="text-[11px] font-mono font-bold px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-300">
          <b>{filtrelenmisHastalar.length}</b> Sakin
        </span>
      </div>

      {/* ── 3. KOMPAKT MONOKROM SAKİN & İLAÇ KARTLARI ── */}
      {yukleniyor ? (
        <div className="p-12 text-center text-xs font-bold text-zinc-500 font-mono flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Çizelge yükleniyor...</span>
        </div>
      ) : filtrelenmisHastalar.length === 0 ? (
        <div className="bg-white rounded-xl border border-primary p-8 text-center text-xs font-bold text-zinc-500 uppercase">
          Kayıtlı ilaç dağıtım verisi bulunamadı.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtrelenmisHastalar.map(h => {
            const hepsiVerildi = h.ilaclar.every(i => i.durum === 'Verildi');
            const bekleyenIlaclar = h.ilaclar.filter(i => i.durum === 'Bekliyor');

            return (
              <div
                key={h.hastaId}
                className={`bg-white rounded-xl border ${
                  hepsiVerildi ? 'border-primary bg-zinc-50/40' : 'border-primary'
                } shadow-2xs overflow-hidden`}
              >
                {/* Sakin Başlık Şeridi */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-zinc-100/90 border-b border-primary text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-black font-mono">
                      Oda {h.odaNo || '—'} / Y.{h.yatakNo || '—'}
                    </span>
                    <span className="font-black text-primary text-xs">
                      {h.ad} {h.soyad}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ({h.hastaNo})
                    </span>
                    {h.alerjiBilgisi && h.alerjiBilgisi !== 'Yok' && (
                      <span className="px-1.5 py-0.2 rounded bg-zinc-200 text-primary border border-zinc-500 text-[9px] font-black flex items-center gap-0.5">
                        <AlertTriangle size={9} strokeWidth={2.5} /> Alerji: {h.alerjiBilgisi}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-600">
                      {h.tamamlananIlac}/{h.toplamIlac}
                    </span>
                    {bekleyenIlaclar.length > 0 && (
                      <button
                        onClick={() => topluVerildiYap(bekleyenIlaclar.map(i => i.hastaIlacId))}
                        className="px-2.5 py-0.5 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase transition-colors cursor-pointer flex items-center gap-0.5"
                      >
                        <Check size={10} strokeWidth={2.5} /> Odadaki Tümünü Ver
                      </button>
                    )}
                  </div>
                </div>

                {/* İlaç Satırları (Kompakt Tek Satır) */}
                <div className="divide-y divide-zinc-200">
                  {h.ilaclar.map(ilac => {
                    const isVerildi = ilac.durum === 'Verildi';
                    const isRed = ilac.durum === 'Reddedildi';
                    const isUyuyor = ilac.durum === 'Uyuyor';
                    const isAc = ilac.durum === 'AcVerilemedi';

                    return (
                      <div
                        key={ilac.hastaIlacId}
                        className={`px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-zinc-50 transition-colors ${
                          isVerildi ? 'bg-zinc-50/70' : ''
                        }`}
                      >
                        {/* İlaç Bilgisi */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="font-bold text-primary">
                              {ilac.ilacAd}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-500">
                              ({ilac.form} • {ilac.dozaj})
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 text-[9px] font-semibold border border-zinc-300">
                              {ilac.kullanimSikligi}
                            </span>
                            {ilac.durum !== 'Bekliyor' && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border whitespace-nowrap ${
                                isVerildi ? 'bg-primary text-white border-primary' :
                                'bg-zinc-200 text-primary border-zinc-400'
                              }`}>
                                {ilac.durum}
                              </span>
                            )}
                          </div>

                          {ilac.durum !== 'Bekliyor' && ilac.uygulamaZamani && (
                            <div className="text-[10px] text-zinc-500 font-bold mt-0.5 font-mono flex items-center gap-1 flex-wrap">
                              <span>Uygulayan: {ilac.uygulayanKullaniciAd || 'Bilinmeyen'}</span>
                              <span>•</span>
                              <span>Saat: {new Date(ilac.uygulamaZamani).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          {ilac.aciklama && (
                            <div className="text-[10px] text-zinc-600 font-bold mt-0.5 font-mono">
                              Not: {ilac.aciklama}
                            </div>
                          )}
                        </div>

                        {/* Aksiyon Butonları (Monokrom Mikro Buton Grubu) */}
                        <div className="flex items-center gap-1 shrink-0 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => durumGuncelle(ilac.hastaIlacId, 'Verildi')}
                            className={`h-6 px-2.5 rounded text-[10px] font-black uppercase transition-colors cursor-pointer border flex items-center justify-center gap-1 whitespace-nowrap ${
                              isVerildi
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white hover:bg-zinc-100 text-primary border-zinc-400'
                            }`}
                          >
                            <Check size={10} strokeWidth={2.5} />
                            <span>Verildi</span>
                          </button>

                          <button
                            onClick={() => aciklamaModaliAc(ilac, 'Reddedildi')}
                            className={`h-6 px-2 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border flex items-center justify-center gap-1 whitespace-nowrap ${
                              isRed
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                            }`}
                          >
                            <X size={10} strokeWidth={2.5} />
                            <span>Red</span>
                          </button>

                          <button
                            onClick={() => aciklamaModaliAc(ilac, 'Uyuyor')}
                            className={`h-6 px-2 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border flex items-center justify-center gap-1 whitespace-nowrap ${
                              isUyuyor
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                            }`}
                          >
                            <Clock size={10} strokeWidth={2.5} />
                            <span>Uyuyor</span>
                          </button>

                          <button
                            onClick={() => aciklamaModaliAc(ilac, 'AcVerilemedi')}
                            title="Aç/Tok Uyuşmazlığı"
                            className={`h-6 px-1.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer border flex items-center justify-center gap-1 whitespace-nowrap ${
                              isAc
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                            }`}
                          >
                            <AlertTriangle size={10} strokeWidth={2.5} />
                          </button>

                          {ilac.durum !== 'Bekliyor' && (
                            <button
                              onClick={() => durumGuncelle(ilac.hastaIlacId, 'Bekliyor')}
                              title="Sıfırla"
                              className="h-6 px-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold border border-zinc-300 cursor-pointer flex items-center justify-center whitespace-nowrap"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MONOKROM AÇIKLAMA MODALI ── */}
      {aciklamaModal && (
        <div className="fixed inset-0 bg-primary/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-primary w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-primary">
                Gerekçe Notu: {hedefDurum}
              </h3>
              <button
                onClick={() => setAciklamaModal(false)}
                className="text-zinc-500 font-bold text-xs hover:text-primary cursor-pointer"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-zinc-800 mb-1">
                İlaç: <span className="font-black text-primary">{secilenIlacUygulama?.ilacAd}</span>
              </p>
              <textarea
                rows={2}
                value={aciklamaMetni}
                onChange={(e) => setAciklamaMetni(e.target.value)}
                placeholder="Gerekçe veya açıklama giriniz..."
                className="w-full p-2 rounded-lg bg-zinc-50 border border-zinc-300 text-xs font-bold text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setAciklamaModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold uppercase cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={aciklamaKaydet}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-black uppercase cursor-pointer"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IlacDagitimPaneli;
