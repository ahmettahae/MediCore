import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as signalR from '@microsoft/signalr';
import { ShieldAlert, Activity, AlertTriangle, HeartPulse, Thermometer, Stethoscope, Wind, Ambulance, Siren, ArrowRight, Bell, Volume2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { API_BASE, HUB_URL } from '../config/api';
import { playAlarmSound } from '../utils/sound';

const AdminDashboard = () => {
  const { kullanici, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [hastalar, setHastalar] = useState([]);
  const [sevkler, setSevkler] = useState([]);
  const [ilaclar, setIlaclar] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [hekim, setHekim] = useState(null);
  const [dashboardOzet, setDashboardOzet] = useState(null);
  const [nobetler, setNobetler] = useState([]);
  const [uyarilar, setUyarilar] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [canliAlarmlar, setCanliAlarmlar] = useState([]);

  // Canlı Saat & Tarih Durumu
  const [suAn, setSuAn] = useState(new Date());

  // Hızlı Arama İnput Durumu
  const [aramaMetni, setAramaMetni] = useState('');

  // Açılır - Kapanır Grafik Paneli Durumu
  const [grafiklerAcik, setGrafiklerAcik] = useState(true);

  // Veri Çekme İşlevi (useCallback ile sarmalandı - sessiz mod ekranı titretmeden sayıları günceller)
  const fetchData = useCallback(async (sessiz = false) => {
    if (!sessiz) setYukleniyor(true);
    const headers = getAuthHeaders ? getAuthHeaders() : {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('userToken')}`
    };

    try {
      const [hastalarRes, sevklerRes, ilaclarRes, hekimRes, ozetRes, nobetlerRes, personellerRes, uyarilarRes] = await Promise.all([
        fetch(`${API_BASE}/Hasta`, { headers }),
        fetch(`${API_BASE}/HastahaneSevk`, { headers }),
        fetch(`${API_BASE}/Ilac`, { headers }),
        fetch(`${API_BASE}/Doktor/kurum-hekim`, { headers }),
        fetch(`${API_BASE}/Dashboard/ozet`, { headers }),
        fetch(`${API_BASE}/Nobet/bugun`, { headers }),
        fetch(`${API_BASE}/Personel`, { headers }),
        fetch(`${API_BASE}/Dashboard/uyarilar`, { headers })
      ]);

      if (hastalarRes.ok) setHastalar(await hastalarRes.json());
      if (sevklerRes.ok) setSevkler(await sevklerRes.json());
      if (ilaclarRes.ok) setIlaclar(await ilaclarRes.json());
      if (hekimRes.ok) setHekim(await hekimRes.json());
      if (ozetRes.ok) setDashboardOzet(await ozetRes.json());
      if (nobetlerRes.ok) setNobetler(await nobetlerRes.json());
      if (personellerRes && personellerRes.ok) setPersoneller(await personellerRes.json());
      if (uyarilarRes.ok) {
        const loadedUyarilar = await uyarilarRes.json();
        setUyarilar(loadedUyarilar);
        if (loadedUyarilar && loadedUyarilar.aktifKritikAlarmlar) {
          setCanliAlarmlar(loadedUyarilar.aktifKritikAlarmlar);
        } else {
          setCanliAlarmlar([]);
        }
      }

    } catch (err) {
      console.error('Veri çekme hatası:', err);
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }, [getAuthHeaders]);

  // Dashboard SignalR Gerçek Zamanlı Alarm Dinleyici
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log("AdminDashboard SignalR bağlantısı başarılı."))
      .catch(err => console.error("AdminDashboard SignalR hatası:", err));

    connection.on("ReceiveNotification", () => {
      // Bir bildirim geldiğinde veritabanındaki sayıları ve alarmları anlık güncelle
      fetchData(true);
    });

    return () => {
      connection.stop()
        .then(() => console.log("AdminDashboard SignalR bağlantısı kapatıldı."))
        .catch(err => console.error("AdminDashboard SignalR durdurma hatası:", err));
    };
  }, [fetchData]);

  // İlk Yükleme, Saat Timer'ı ve Canlı Veri Polling'i
  useEffect(() => {
    fetchData(false);

    // Canlı Saat (1 saniye)
    const saatTimer = setInterval(() => {
      setSuAn(new Date());
    }, 1000);

    // Canlı Sayı Güncelleme (3 saniyede bir ekranı yenilemeden sayıları arka planda otomatik günceller)
    const livePollTimer = setInterval(() => {
      fetchData(true);
    }, 3000);

    return () => {
      clearInterval(saatTimer);
      clearInterval(livePollTimer);
    };
  }, [fetchData]);

  // İstatistiksel Hesaplamalar — Backend Verisinden
  const toplamSakin = dashboardOzet?.toplamHasta ?? hastalar.length;
  const hastanedekiler = dashboardOzet?.hastahanedeHasta ?? hastalar.filter(h => h.durum === 'Hastanede').length;
  const kurumdakiler = Math.max(0, toplamSakin - hastanedekiler);
  const hemsireSayisi = dashboardOzet?.toplamPersonel ?? personeller.length;
  const kritikIlacSayisi = dashboardOzet?.kritikStokSayisi ?? 0;
  const sktUyarisiSayisi = dashboardOzet?.sktUyarisiSayisi ?? 0;

  // Yaş Grubu Hesaplaması — Backend Hasta Listesindeki DogumTarihi Alanından (camelCase: dogumTarihi)
  const buYil = new Date().getFullYear();
  const yasHesapla = (h) => {
    if (h.dogumTarihi) {
      const dogum = new Date(h.dogumTarihi);
      const yas = buYil - dogum.getFullYear();
      return yas > 0 && yas < 130 ? yas : 0;
    }
    return 0; // varsayılan
  };
  const yasGruplari = {
    '60-64': hastalar.filter(h => { const y = yasHesapla(h); return y >= 60 && y <= 64; }).length || 0,
    '65-69': hastalar.filter(h => { const y = yasHesapla(h); return y >= 65 && y <= 69; }).length || 0,
    '70-74': hastalar.filter(h => { const y = yasHesapla(h); return y >= 70 && y <= 74; }).length || 0,
    '75-79': hastalar.filter(h => { const y = yasHesapla(h); return y >= 75 && y <= 79; }).length || 0,
    '80-84': hastalar.filter(h => { const y = yasHesapla(h); return y >= 80 && y <= 84; }).length || 0,
    '85-89': hastalar.filter(h => { const y = yasHesapla(h); return y >= 85 && y <= 89; }).length || 0,
    '90+': hastalar.filter(h => yasHesapla(h) >= 90).length || 0
  };
  const yasOrt = hastalar.length > 0
    ? Math.round(hastalar.reduce((s, h) => s + yasHesapla(h), 0) / hastalar.length)
    : 0;

  // Personel & Vardiya Analizi — Backend Personel Listesinden Dinamik Hesaplama
  const toplamNobetSayisi = personeller.reduce((sum, p) => sum + (p.toplamNot || 0), 0);
  const ortalamaVardiyaSaati = hemsireSayisi > 0 ? Math.round((toplamNobetSayisi * 8) / hemsireSayisi) : 0; // Her nöbet 8 saat kabul edilmiştir
  const izinliPersonelSayisi = personeller.filter(p => p.durum === 'İzinli').length;

  // Yatak Kapasitesi
  const yatakKapasite = 50; // Bu sabit kalabilir, kurum kapasitesi
  const dolulukOrani = Math.min(100, Math.round((toplamSakin / yatakKapasite) * 100));

  // Haftalık Sevk Yoğunluğu — Backend Sevk Listesinden Son 7 Gün
  const gunIsimleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const haftalikSevkVerisi = Array.from({ length: 7 }, (_, i) => {
    const tarih = new Date();
    tarih.setDate(tarih.getDate() - (6 - i));
    const gunStr = tarih.toDateString();
    const adet = sevkler.filter(s => new Date(s.sevkTarihi).toDateString() === gunStr).length;
    return {
      gun: gunIsimleri[tarih.getDay()],
      tarihNo: tarih.getDate(),
      sevk: adet
    };
  });

  // Kullanıcı Tam Adı — Backend'den gelen kimlik bilgisi
  const tamAd = kullanici ? `${kullanici.ad} ${kullanici.soyad}` : '';

  // Hızlı Arama Submit
  const [aramaTuru, setAramaTuru] = useState('hasta');

  const handleArama = (e) => {
    e.preventDefault();
    const query = aramaMetni.trim();
    if (aramaTuru === 'personel') {
      navigate(query ? `/personel?q=${encodeURIComponent(query)}` : '/personel');
    } else if (aramaTuru === 'ilac') {
      navigate(query ? `/ilaclar?q=${encodeURIComponent(query)}` : '/ilaclar');
    } else {
      navigate(query ? `/hastalar?q=${encodeURIComponent(query)}` : '/hastalar');
    }
  };

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-primary">Yönetici Paneli Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans pb-12 text-primary max-w-6xl mx-auto">

      {/* ── 1. MONOKROM ÜST BAŞLIK & ARAMA BARI ── */}
      <div className="premium-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-primary tracking-tight uppercase leading-none">
            {tamAd}
          </h1>
          <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono mt-0.5 block">
            {kullanici?.rol === 'Bashekim'
              ? 'Başhekim • Klinik & Operasyonel Yönetim Paneli'
              : 'İdari Yönetici (Denetçi) • Genel İzleme & İstatistik Paneli'}
          </span>
        </div>

        <form onSubmit={handleArama} className="flex items-center h-8 bg-zinc-50 border border-zinc-300 rounded-lg px-1.5 w-full sm:w-72">
          <select
            value={aramaTuru}
            onChange={(e) => setAramaTuru(e.target.value)}
            className="h-6 text-[10px] font-bold uppercase bg-transparent border-r border-zinc-300 focus:outline-none pr-1.5 cursor-pointer font-mono"
          >
            <option value="hasta">HASTA</option>
            <option value="ilac">İLAÇ</option>
            <option value="personel">PERSONEL</option>
          </select>
          <input
            type="text"
            placeholder="Hızlı Ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full h-6 px-1.5 text-xs font-bold text-primary bg-transparent focus:outline-none placeholder:text-zinc-400"
          />
          <button
            type="submit"
            className="h-6 px-2.5 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
          >
            Ara
          </button>
        </form>
      </div>

      {/* ── 1b. NÖBET DURUMU BANNERİ ── */}
      {(() => {
        const vardiyaTanimlari = [
          { tur: 'Gündüz', bas: 8, bit: 16, etiket: 'GÜNDÜZ' },
          { tur: 'Akşam', bas: 16, bit: 24, etiket: 'AKŞAM' },
          { tur: 'Gece', bas: 0, bit: 8, etiket: 'GECE' },
        ];
        const saat = suAn.getHours();
        const aktifTur = saat >= 8 && saat < 16 ? 'Gündüz' : saat >= 16 ? 'Akşam' : 'Gece';

        const gorunecekNobetler = nobetler;

        // Aktif vardiyanın bitiş saatine kalan süre
        const aktifVardiya = vardiyaTanimlari.find(v => v.tur === aktifTur);
        const bitisH = aktifVardiya?.bit === 24 ? 0 : aktifVardiya?.bit;
        const bitisDate = new Date(suAn);
        if (aktifVardiya?.bit === 24) bitisDate.setDate(bitisDate.getDate() + 1);
        bitisDate.setHours(bitisH, 0, 0, 0);
        const kalanMs = bitisDate - suAn;
        const kalanSaat = Math.floor(kalanMs / 3600000);
        const kalanDak = Math.floor((kalanMs % 3600000) / 60000);

        return (
          <div className="premium-card overflow-hidden">
            {/* Banner Header */}
            <div className="px-3.5 py-2 bg-zinc-100/90 border-b border-primary-border flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 font-mono">
                {suAn.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
              </span>
              <span className="text-xs font-black text-primary uppercase tracking-wider font-mono">Anlık Nöbet Durumu</span>
              <span className="text-[11px] font-bold text-zinc-600 font-mono">
                Kalan: {kalanSaat}s {kalanDak}dk
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 text-center">
              {vardiyaTanimlari.map((v) => {
                const nobet = gorunecekNobetler.find(n => n.vardiyaTuru === v.tur);
                const isAktif = v.tur === aktifTur;
                return (
                  <div key={v.tur} className={`p-3 relative flex flex-col items-center justify-center gap-1 ${isAktif ? 'bg-primary text-white' : 'bg-white text-primary'}`}>

                    {/* Saat ve Aktif Etiketi */}
                    <div className="flex flex-col items-center justify-center relative w-full">
                      <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isAktif ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {v.etiket} • {v.bas.toString().padStart(2, '0')}:00 – {v.bit === 24 ? '00:00' : v.bit.toString().padStart(2, '0') + ':00'}
                      </span>
                      {isAktif && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white text-primary px-1.5 py-0.2 rounded mt-0.5 font-mono">
                          ● ŞU AN AKTİF
                        </span>
                      )}
                    </div>

                    {/* Personel İsimleri */}
                    <div className="w-full">
                      {nobet ? (
                        <div className="space-y-0.5">
                          <div className={`text-xs font-bold leading-tight ${isAktif ? 'text-white' : 'text-primary'}`}>
                            {nobet.hemsireAdi || (nobet.hemsire ? `${nobet.hemsire.ad} ${nobet.hemsire.soyad}` : 'Atandı')}
                          </div>
                          {nobet.hemsire2Adi && (
                            <div className={`text-[11px] font-medium ${isAktif ? 'text-zinc-300' : 'text-zinc-600'}`}>
                              {nobet.hemsire2Adi}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`text-xs italic ${isAktif ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          Nöbetçi Atanmadı
                        </div>
                      )}
                    </div>

                    {/* Teslim Notu */}
                    {nobet?.teslimNotu && (
                      <div className={`text-[10px] mt-0.5 italic ${isAktif ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        Not: {nobet.teslimNotu}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── 2. ANA SAYFA METRİK KARTLARI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* KART 1: HEKİMLER */}
        <div className="premium-card p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Kurum Hekimi
          </span>
          <div className="my-2">
            <div className="text-sm font-bold text-primary truncate">
              {hekim?.unvan || 'Dr.'} {hekim?.ad || 'Atanmadı'} {hekim?.soyad || ''}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              {hekim?.uzmanlikAlani || 'Kurum Hekimi'}
            </span>
          </div>
          <Link
            to="/doktorlar"
            className="w-full py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors text-center shadow-2xs"
          >
            Hekim Kadrosu →
          </Link>
        </div>

        {/* KART 2: PERSONELLER */}
        <div className="premium-card p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Sağlık Personeli
          </span>
          <div className="my-2">
            <div className="text-xl font-black text-primary font-mono">
              {hemsireSayisi}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Kadrolu Personel
            </span>
          </div>
          <Link
            to="/personel"
            className="w-full py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors text-center shadow-2xs"
          >
            Personel Listesi →
          </Link>
        </div>

        {/* KART 3: HASTALAR */}
        <div className="premium-card p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Bakım Sakinleri
          </span>
          <div className="my-2">
            <div className="text-xl font-black text-primary font-mono">
              {toplamSakin}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Kayıtlı Sakin
            </span>
          </div>
          <Link
            to="/hastalar"
            className="w-full py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors text-center shadow-2xs"
          >
            Sakin Listesi →
          </Link>
        </div>

        {/* KART 4: İLAÇLAR */}
        <div className="premium-card p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Ecza Dolabı
          </span>
          <div className="my-2">
            <div className="text-xl font-black text-primary font-mono">
              {ilaclar.length}
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">
              Kayıtlı İlaç
            </span>
          </div>
          <Link
            to="/ilaclar"
            className="w-full py-1 rounded bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase transition-colors text-center shadow-2xs"
          >
            İlaç Listesi →
          </Link>
        </div>

      </div>

      {/* ── 3. KURUM VERİ ANALİTİĞİ & ÖZET GRAFİKLER ── */}
      <div className="premium-card overflow-hidden">
        {/* PANEL BAŞLIĞI */}
        <div className="px-3.5 py-2 bg-zinc-100/90 border-b border-primary-border flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 font-mono">
            Kurum Analitiği
          </span>
          <h2 className="text-xs font-black uppercase tracking-wider text-primary font-mono">
            Veri Analitiği & İşleyiş Grafikleri
          </h2>
          <button
            type="button"
            onClick={() => setGrafiklerAcik(!grafiklerAcik)}
            className="px-2 py-0.5 bg-white border border-zinc-300 hover:bg-zinc-200 rounded text-[10px] font-bold uppercase text-zinc-800 cursor-pointer"
          >
            {grafiklerAcik ? '▲ Gizle' : '▼ Göster'}
          </button>
        </div>

        {grafiklerAcik && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white">

            {/* GRAFİK 1: HASTA YAŞ DAĞILIMI */}
            <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg space-y-2">
              <div className="text-center border-b border-zinc-200 pb-1 w-full">
                <span className="text-xs font-bold text-primary font-mono">
                  Hasta Yaş Dağılımı
                </span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={[
                    { grup: '60-64', hasta: yasGruplari['60-64'] },
                    { grup: '65-69', hasta: yasGruplari['65-69'] },
                    { grup: '70-74', hasta: yasGruplari['70-74'] },
                    { grup: '75-79', hasta: yasGruplari['75-79'] },
                    { grup: '80-84', hasta: yasGruplari['80-84'] },
                    { grup: '85-89', hasta: yasGruplari['85-89'] },
                    { grup: '90+', hasta: yasGruplari['90+'] },
                  ]}
                  margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="grup" tick={{ fontSize: 8, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #27272a', borderRadius: '6px', fontSize: 11 }}
                    formatter={(v) => [`${v} Hasta`, 'Sayı']}
                  />
                  <Bar dataKey="hasta" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Toplam Hasta</div>
                  <div className="text-xs font-black text-primary">{toplamSakin} Kişi</div>
                </div>
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Yaş Ortalaması</div>
                  <div className="text-xs font-black text-primary">{yasOrt} Yaş</div>
                </div>
              </div>
            </div>

            {/* GRAFİK 2: PERSONEL VARDİYA ANALİZİ */}
            <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg space-y-2">
              <div className="text-center border-b border-zinc-200 pb-1 w-full">
                <span className="text-xs font-bold text-primary font-mono">
                  Personel Vardiya Analizi
                </span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={[
                    { label: 'Kadrolu', deger: hemsireSayisi },
                    { label: 'Nöbet (s)', deger: ortalamaVardiyaSaati },
                    { label: 'İzinli', deger: izinliPersonelSayisi },
                  ]}
                  margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #27272a', borderRadius: '6px', fontSize: 11 }}
                  />
                  <Bar dataKey="deger" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Kadrolu Personel</div>
                  <div className="text-xs font-black text-primary">{hemsireSayisi} Kişi</div>
                </div>
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Günlük Nöbet</div>
                  <div className="text-xs font-black text-primary">{ortalamaVardiyaSaati} Saat</div>
                </div>
              </div>
            </div>

            {/* GRAFİK 3: HAFTALIK SEVK */}
            <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg space-y-2">
              <div className="text-center border-b border-zinc-200 pb-1 w-full">
                <span className="text-xs font-bold text-primary font-mono">
                  Haftalık Sevk Yoğunluğu
                </span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={haftalikSevkVerisi}
                  margin={{ top: 4, right: 8, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis
                    dataKey="gun"
                    tick={(props) => {
                      const { x, y, payload, index } = props;
                      const item = haftalikSevkVerisi[index];
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={10} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--primary)">{payload.value}</text>
                          <text x={0} y={0} dy={20} textAnchor="middle" fontSize={7} fill="#71717a">{item?.tarihNo}</text>
                        </g>
                      );
                    }}
                    height={32}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ border: '1px solid #27272a', borderRadius: '6px', fontSize: 11 }}
                    formatter={(v) => [`${v} Sevk`, 'Adet']}
                  />
                  <Bar dataKey="sevk" fill="var(--primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Yatak Doluluk</div>
                  <div className="text-xs font-black text-primary">%{dolulukOrani}</div>
                </div>
                <div className="p-1.5 bg-white border border-zinc-200 rounded text-center">
                  <div className="text-[9px] font-bold text-zinc-500">Dolu / Kapasite</div>
                  <div className="text-xs font-black text-primary">{toplamSakin} / {yatakKapasite}</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── 4. HASTA DURUM DAĞILIMI ── */}
      <div className="premium-card overflow-hidden">
        <div className="px-3.5 py-2 bg-zinc-100/90 border-b border-primary-border flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-500 font-mono">Hasta Durumu</span>
          <h2 className="text-xs font-black uppercase tracking-wider text-primary font-mono">Bakım Sakini Durum Dağılımı</h2>
          <span className="text-[11px] font-bold text-zinc-500 font-mono">Gerçek Zamanlı</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
          {/* Kurumda */}
          <div className="p-4 text-center flex flex-col items-center gap-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Kurumda</span>
            <div className="text-2xl font-black text-primary">{kurumdakiler}</div>
            <span className="text-[10px] text-zinc-500 font-medium">{toplamSakin > 0 ? Math.round((kurumdakiler / toplamSakin) * 100) : 0}% toplam</span>
          </div>
          {/* Hastanede */}
          <div className={`p-4 text-center flex flex-col items-center gap-1 font-mono ${hastanedekiler > 0 ? 'bg-primary-light text-primary border-x border-primary-border font-bold' : 'text-zinc-500'}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Hastanede Sevkli</span>
            <div className="text-2xl font-black">{hastanedekiler}</div>
            <span className={`text-[10px] ${hastanedekiler > 0 ? 'text-primary font-bold' : 'text-zinc-500'}`}>
              {hastanedekiler > 0 ? 'Aktif sevk mevcut' : 'Sevk yok'}
            </span>
          </div>
          {/* İstatistik */}
          <div className="p-4 text-center flex flex-col items-center gap-1 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Yatak Doluluk</span>
            <div className="text-2xl font-black text-primary">%{dolulukOrani}</div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase">{toplamSakin} / {yatakKapasite} Kapasite</span>
          </div>
        </div>
      </div>

      {/* ── 5. UYARI & KRİTİK ALARM PANELLERİ ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">

        {/* 1. Canlı Klinik Alarmlar (SignalR) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-[#F0F4F8] dark:bg-slate-800/90">
              <h3 className="font-black text-primary dark:text-slate-100 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5 min-w-0 truncate">
                <Siren size={15} className="text-red-500 shrink-0 animate-pulse" />
                <span className="truncate">Canlı Klinik Alarmlar</span>
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => playAlarmSound('alert')}
                  className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 text-[10px] font-bold font-mono flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Alarm Sesini Sına"
                >
                  <Volume2 size={11} className="text-amber-500 shrink-0" />
                  <span>Sına</span>
                </button>
                {canliAlarmlar.length > 0 ? (
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-red-600 text-white shadow-2xs animate-pulse whitespace-nowrap">
                    {canliAlarmlar.length} Kritik
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-zinc-700 dark:text-slate-300 shadow-2xs whitespace-nowrap">
                    Stabil
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900">
              {canliAlarmlar.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-500 dark:text-slate-400">
                  Şu an aktif kritik alarm bulunmuyor.
                  <div className="text-[10px] text-zinc-400 dark:text-slate-500 font-mono font-medium mt-1">
                    Kritik vital veriler düzelene kadar burada kalmaya devam edecektir.
                  </div>
                </div>
              ) : (
                canliAlarmlar.map(a => {
                  const items = (a.detay || '').split(', ');
                  return (
                    <div
                      key={a.id}
                      onClick={() => navigate(`/hastalar/${a.hastaId}`)}
                      className="p-2.5 transition-colors border-l-3 border-red-500 bg-red-50/40 dark:bg-red-950/30 hover:bg-red-50/80 dark:hover:bg-red-950/50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-zinc-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <Activity size={12} className="text-red-500 shrink-0" />
                          <span className="truncate">{a.hastaAdi}</span>
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 dark:text-slate-400 shrink-0">
                          {a.tarih ? new Date(a.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-zinc-600 dark:text-slate-400 font-mono mt-0.5 pl-4">
                        Oda: {a.odaYatak}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-4">
                        {items.map((item, idx) => {
                          let IconComponent = Activity;
                          if (item.includes("Nabız")) IconComponent = HeartPulse;
                          else if (item.includes("Ateş")) IconComponent = Thermometer;
                          else if (item.includes("Tansiyon")) IconComponent = Stethoscope;
                          else if (item.includes("SpO2") || item.includes("Saturasyon")) IconComponent = Wind;

                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-300 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-md shadow-2xs font-mono"
                            >
                              <IconComponent size={11} className="text-red-500 shrink-0" />
                              <span>{item}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 2. Aktif Hastane Sevkleri */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-[#F0F4F8] dark:bg-slate-800/90">
              <h3 className="font-black text-primary dark:text-slate-100 text-xs uppercase tracking-wider font-mono min-w-0 truncate">
                Hastanedeki Sakinler
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-zinc-700 dark:text-slate-300 shadow-2xs shrink-0 whitespace-nowrap">
                {uyarilar ? uyarilar.aktifSevkler.length : '0'} Hasta
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900">
              {!uyarilar ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-400 animate-pulse">Yükleniyor...</div>
              ) : uyarilar.aktifSevkler.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-500 dark:text-slate-400">Aktif sevk bulunmuyor.</div>
              ) : (
                uyarilar.aktifSevkler.map(s => (
                  <div
                    key={s.id}
                    onClick={() => navigate('/sevkler')}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-900 dark:text-slate-100 truncate">{s.hastaAdi}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-slate-400 truncate font-mono mt-0.5">{s.sevkEdilenHastane} · {s.sevkNedeni}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase rounded bg-primary dark:bg-sky-600 text-white shrink-0 whitespace-nowrap shadow-2xs">
                      Sevkli
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Kritik İlaç Stoğu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-[#F0F4F8] dark:bg-slate-800/90">
              <h3 className="font-black text-primary dark:text-slate-100 text-xs uppercase tracking-wider font-mono min-w-0 truncate">
                Kritik İlaç Stoğu
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-zinc-700 dark:text-slate-300 shadow-2xs shrink-0 whitespace-nowrap">
                {uyarilar ? uyarilar.kritikStoklar.length : '0'} İlaç
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900">
              {!uyarilar ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-400 animate-pulse">Yükleniyor...</div>
              ) : uyarilar.kritikStoklar.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-500 dark:text-slate-400">Ecza dolabı stokları yeterli</div>
              ) : (
                uyarilar.kritikStoklar.map(i => (
                  <div
                    key={i.id}
                    onClick={() => navigate(`/ilaclar/${i.id}`)}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-900 dark:text-slate-100 truncate">{i.ad}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-slate-400 truncate font-mono mt-0.5">{i.form || '—'}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase rounded shrink-0 whitespace-nowrap shadow-2xs ${i.toplamStok === 0
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                      }`}>
                      {i.toplamStok === 0 ? 'Stok Yok' : `${i.toplamStok} Kutu`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 4. SKT Yaklaşan Partiler */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-[#F0F4F8] dark:bg-slate-800/90">
              <h3 className="font-black text-primary dark:text-slate-100 text-xs uppercase tracking-wider font-mono min-w-0 truncate">
                SKT Yaklaşan Partiler
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-zinc-700 dark:text-slate-300 shadow-2xs shrink-0 whitespace-nowrap">
                {uyarilar ? uyarilar.sktUyarilari.length : '0'} Parti
              </span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900">
              {!uyarilar ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-400 animate-pulse">Yükleniyor...</div>
              ) : uyarilar.sktUyarilari.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-zinc-500 dark:text-slate-400">SKT uyarısı bulunmuyor</div>
              ) : (
                uyarilar.sktUyarilari.map((s, i) => {
                  const kalanGun = s.kalanGun;
                  const badge = kalanGun < 0 ? 'Dolmuş' : `${kalanGun}g`;
                  const isKritik = kalanGun <= 7;
                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/ilaclar/${s.ilacId}`)}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 dark:text-slate-100 truncate">{s.ilacAd}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-slate-400 truncate font-mono mt-0.5">
                          {s.adet} Kutu · {s.sonKullanmaTarihi ? new Date(s.sonKullanmaTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9.5px] font-mono font-bold uppercase rounded shrink-0 whitespace-nowrap shadow-2xs ${isKritik
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-zinc-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                        }`}>
                        {badge}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
