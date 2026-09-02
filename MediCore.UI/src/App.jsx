import React, { useState, useEffect, useCallback, createContext, useContext, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useNotifications } from './context/NotificationContext';
import * as signalR from '@microsoft/signalr';
import {
  Search, Pill, Stethoscope, Users, FileText, Pin, Calendar,
  Megaphone, Ambulance, FolderOpen, ClipboardList, Package,
  LogOut, LayoutDashboard, Terminal, Sun, Moon, Bell
} from 'lucide-react';
import Login from './components/Login';
import MediCoreLogo from './components/MediCoreLogo';
import GlobalAramaModal from './components/GlobalAramaModal';
import BildirimMerkeziModal from './components/BildirimMerkeziModal';

import { API_BASE, HUB_URL } from './config/api';
import { playAlarmSound } from './utils/sound';

// 🚀 Lazy-Loaded Route Modülleri (Code-Splitting & Yüksek Performans)
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const SistemLoglari = lazy(() => import('./components/SistemLoglari'));
const HemsireDashboard = lazy(() => import('./components/HemsireDashboard'));
const DoktorDashboard = lazy(() => import('./components/DoktorDashboard'));
const IlacDagitimPaneli = lazy(() => import('./components/IlacDagitimPaneli'));
const TopluVitalGiris = lazy(() => import('./components/TopluVitalGiris'));
const HekimVizite = lazy(() => import('./components/HekimVizite'));
const HastaListesi = lazy(() => import('./components/HastaListesi'));
const HastaDetay = lazy(() => import('./components/HastaDetay'));
const IlacListesi = lazy(() => import('./components/IlacListesi'));
const IlacStokDetay = lazy(() => import('./components/IlacStokDetay'));
const HastahaneSevk = lazy(() => import('./components/HastahaneSevk'));
const KadroYonetimi = lazy(() => import('./components/KadroYonetimi'));
const VardiyaTakvim = lazy(() => import('./components/VardiyaTakvim'));
const GorevPanosu = lazy(() => import('./components/GorevPanosu'));
const VardiyaRaporu = lazy(() => import('./components/VardiyaRaporu'));
const DuyuruPanosu = lazy(() => import('./components/DuyuruPanosu'));

const SayfaYukleniyor = () => (
  <div className="flex items-center justify-center py-20 min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-bold text-zinc-500 font-mono">Modül Yükleniyor...</span>
    </div>
  </div>
);


// 🌓 Anlık Tema Context'i (Sıfır Gecikme)
const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} });

const MenuLink = ({ to, etiket, ikon: Ikon, eslesmeler = [], rozet = null }) => {
  const location = useLocation();
  const { isDark } = useContext(ThemeContext);
  const aktif = location.pathname === to || eslesmeler.includes(location.pathname);

  return (
    <Link
      to={to}
      style={{
        backgroundColor: aktif ? '#3E5C76' : (isDark ? '#162232' : '#FFFFFF'),
        color: aktif ? '#FFFFFF' : (isDark ? '#CBD5E1' : '#334155'),
        borderColor: aktif ? '#3E5C76' : (isDark ? '#26334D' : '#E2E8F0')
      }}
      className={`group flex items-center justify-between px-3 py-2 transition-all duration-150 ease-out text-xs rounded-lg whitespace-nowrap truncate border shadow-2xs ${
        aktif ? 'font-black translate-x-0.5' : 'font-bold hover:translate-x-0.5'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        {Ikon && (
          <Ikon 
            size={14} 
            strokeWidth={aktif ? 2.4 : 2} 
            className="shrink-0 transition-colors"
            style={{ color: aktif ? '#FFFFFF' : (isDark ? '#93C5FD' : '#3E5C76') }}
          />
        )}
        <span className="truncate">{etiket}</span>
      </div>
      {rozet && (
        <span className="px-1.5 py-0.5 min-w-[18px] h-4 inline-flex items-center justify-center rounded-full text-[9px] font-mono font-black leading-none bg-red-600 text-white border border-red-400/50 shadow-2xs shrink-0 animate-pulse">
          {rozet}
        </span>
      )}
    </Link>
  );
};

// ─── Ana Uygulama ─────────────────────────────────────────────────────────────
function App() {
  const { kullanici, yukleniyor, cikisYap, getAuthHeaders } = useAuth();
  const [aramaModalAcik, setAramaModalAcik] = useState(false);
  const [suAn, setSuAn] = useState(new Date());
  const [aktifAlarmSayisi, setAktifAlarmSayisi] = useState(0);
  const [geceModu, setGeceModu] = useState(() => {
    const kayitli = localStorage.getItem('medicore_gece_modu') === 'true';
    if (kayitli) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return kayitli;
  });

  const toggleTheme = useCallback(() => {
    setGeceModu(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('medicore_gece_modu', next);
      return next;
    });
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { bildirimEkle, okunmamisSayisi } = useNotifications();
  const [bildirimMerkeziAcik, setBildirimMerkeziAcik] = useState(false);

  // Aktif Klinik Alarm Sayısını Çek
  const kontrolAktifAlarmlar = useCallback(async () => {
    if (!kullanici) return;
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('userToken')}`
      };
      const res = await fetch(`${API_BASE}/Dashboard/uyarilar`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.aktifKritikAlarmlar) {
          setAktifAlarmSayisi(data.aktifKritikAlarmlar.length);
        }
      }
    } catch (e) {
      console.error("Alarm kontrol hatası:", e);
    }
  }, [kullanici, getAuthHeaders]);

  useEffect(() => {
    kontrolAktifAlarmlar();
  }, [kontrolAktifAlarmlar]);

  // SignalR Real-Time Bağlantı Yönetimi
  useEffect(() => {
    if (!kullanici) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("SignalR WebSocket bağlantısı kuruldu.");
      })
      .catch(err => {
        console.error("SignalR bağlantı hatası:", err);
      });

    connection.on("ReceiveNotification", (baslik, mesaj, tip) => {
      // Sesli alarm / bildirim çal (Web Audio API - Kesintisiz & Yerel)
      try {
        playAlarmSound(tip || 'info');
      } catch (e) {
        console.warn("Ses çalınamadı:", e);
      }

      // Bildirim linkini dinamik saptama
      let link = null;
      const bLower = (baslik + " " + mesaj).toLowerCase();
      if (bLower.includes("sevk") || bLower.includes("112") || bLower.includes("ambulans")) link = "/sevkler";
      else if (bLower.includes("vital") || bLower.includes("tansiyon") || bLower.includes("nabız") || bLower.includes("ateş")) link = "/toplu-vital";
      else if (bLower.includes("ilaç") || bLower.includes("mar")) link = "/ilac-dagitim";
      else if (bLower.includes("duyuru")) link = "/duyurular";
      else if (bLower.includes("görev")) link = "/gorev-panosu";
      else if (bLower.includes("muayene") || bLower.includes("vizite")) link = "/vizite";

      // Bildirim Merkezine Kaydet
      bildirimEkle(baslik, mesaj, tip, link);

      // Ekranda şık toast bildirimi göster
      let toastTip = "info";
      if (tip === "alert") toastTip = "error";
      else if (tip === "success") toastTip = "success";

      showToast(`${baslik}\n${mesaj}`, toastTip, 6500);

      // Aktif alarm durumunu yenile
      kontrolAktifAlarmlar();
    });

    return () => {
      connection.stop()
        .then(() => console.log("SignalR WebSocket bağlantısı kapatıldı."))
        .catch(err => console.error("SignalR durdurma hatası:", err));
    };
  }, [kullanici, showToast, bildirimEkle, kontrolAktifAlarmlar]);

  // Canlı Saat Timer'ı (Tüm Sistem İçin Tek Merkezden)
  useEffect(() => {
    const timer = setInterval(() => setSuAn(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCikis = () => {
    cikisYap();
    navigate('/login');
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-primary text-lg font-bold animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>MediCore Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!kullanici && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  const isBashekim = kullanici?.rol === 'Bashekim';
  const isBashemsire = kullanici?.rol === 'Bashemsire';
  const isYonetici = kullanici?.rol === 'Yonetici';
  const isDoktor = kullanici?.rol === 'Doktor';
  const isHemsire = kullanici?.rol === 'Hemsire';

  const kullaniciTamAd = kullanici ? `${kullanici.ad} ${kullanici.soyad}` : '';
  const rolEtiketi = isBashekim
    ? 'Başhekim'
    : isBashemsire
      ? 'Başhemşire'
      : isYonetici
        ? 'İdari Yönetici (İzleyici)'
        : isDoktor
          ? 'Kurum Hekimi'
          : 'Sağlık Personeli (Hemşire)';

  return (
    <ThemeContext.Provider value={{ isDark: geceModu, toggleTheme }}>
      <GlobalAramaModal acik={aramaModalAcik} setAcik={setAramaModalAcik} />
      <BildirimMerkeziModal acik={bildirimMerkeziAcik} onKapat={() => setBildirimMerkeziAcik(false)} isDark={geceModu} />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="*" element={
          <div className="flex h-screen bg-slate-50 text-primary overflow-hidden font-sans">

            {/* ── 1. SOL SIDEBAR ── */}
            <div 
              style={{ backgroundColor: geceModu ? '#0D1322' : '#F8FAFC', borderColor: geceModu ? '#26334D' : '#E2E8F0' }}
              className="w-56 text-slate-800 dark:text-slate-100 flex flex-col border-r shadow-2xs flex-shrink-0"
            >

              {/* Logo & Başlık */}
              <Link 
                to="/" 
                style={{ backgroundColor: geceModu ? '#131C28' : '#FFFFFF', borderColor: geceModu ? '#26334D' : '#E2E8F0' }}
                className="p-3.5 border-b flex flex-col items-center justify-center hover:opacity-95 transition-colors"
              >
                <MediCoreLogo size="sm" isDark={geceModu} />
                <div className="text-center mt-1.5">
                  <h1 
                    style={{ color: geceModu ? '#FFFFFF' : '#142A4A' }}
                    className="text-lg font-black tracking-tight flex items-center justify-center font-poppins select-none"
                  >
                    MediCore
                  </h1>
                  <p 
                    style={{ color: geceModu ? '#94A3B8' : '#3E5C76' }}
                    className="text-[8.5px] font-bold uppercase tracking-[0.22em] font-poppins mt-0.5 select-none"
                  >
                    HASTA BAKIM SİSTEMİ
                  </p>
                </div>
              </Link>

              {/* Kullanıcı Bilgisi Rozeti */}
              <div 
                style={{ backgroundColor: geceModu ? '#1A2838' : '#FFFFFF', borderColor: geceModu ? '#26334D' : '#E2E8F0' }}
                className="px-3 py-2 border-b text-center"
              >
                <p 
                  style={{ color: geceModu ? '#FFFFFF' : '#142A4A' }}
                  className="text-xs font-black truncate tracking-tight font-sans"
                >
                  {kullaniciTamAd}
                </p>
                <span 
                  style={{ color: geceModu ? '#6EB2E8' : '#3E5C76' }}
                  className="inline-block text-[9.5px] font-mono font-bold uppercase tracking-wider mt-0.5"
                >
                  {rolEtiketi}
                </span>
              </div>

              {/* Hızlı Arama, Bildirimler & Gece Modu İkonu */}
              <div 
                style={{ backgroundColor: geceModu ? '#16222F' : '#F8FAFC', borderColor: geceModu ? '#26334D' : '#E2E8F0' }}
                className="p-2 border-b flex items-center gap-1.5"
              >
                {/* Hızlı Ara Butonu */}
                <button
                  type="button"
                  onClick={() => setAramaModalAcik(true)}
                  style={{
                    backgroundColor: geceModu ? '#223347' : '#FFFFFF',
                    borderColor: geceModu ? '#2D445D' : '#CBD5E1',
                    color: geceModu ? '#F1F5F9' : '#1E293B'
                  }}
                  className="flex-1 h-[30px] flex items-center justify-between px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-[#2D445D] hover:border-slate-400 dark:hover:border-slate-500 shadow-2xs group"
                >
                  <span 
                    style={{ color: geceModu ? '#F1F5F9' : '#1E293B' }}
                    className="text-[11px] flex items-center gap-1.5 font-bold"
                  >
                    <Search size={14} strokeWidth={2.4} style={{ color: geceModu ? '#F1F5F9' : '#1E293B' }} className="shrink-0" /> Ara...
                  </span>
                  <span 
                    style={{
                      backgroundColor: geceModu ? '#16222F' : '#F1F5F9',
                      borderColor: geceModu ? '#2D445D' : '#CBD5E1',
                      color: geceModu ? '#94A3B8' : '#1E293B'
                    }}
                    className="text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded shadow-2xs leading-none"
                  >
                    Ctrl+K
                  </span>
                </button>

                {/* Bildirim Çanı Butonu */}
                <button
                  type="button"
                  onClick={() => setBildirimMerkeziAcik(true)}
                  title="Bildirim Merkezi"
                  style={{
                    backgroundColor: geceModu ? '#223347' : '#FFFFFF',
                    borderColor: geceModu ? '#2D445D' : '#CBD5E1',
                    color: geceModu ? '#F1F5F9' : '#1E293B'
                  }}
                  className="relative h-[30px] w-[30px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs hover:bg-slate-100 dark:hover:bg-[#2D445D] hover:border-slate-400 dark:hover:border-slate-500 group"
                >
                  <Bell 
                    size={14} 
                    strokeWidth={2.4} 
                    style={{ color: geceModu ? '#F1F5F9' : '#1E293B' }}
                    className="shrink-0 transition-colors" 
                  />
                  {okunmamisSayisi > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8.5px] font-black font-mono flex items-center justify-center shadow-xs animate-pulse">
                      {okunmamisSayisi > 9 ? '9+' : okunmamisSayisi}
                    </span>
                  )}
                </button>

                {/* Tema Değiştirme Butonu */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={geceModu ? "Gündüz Moduna Geç" : "Gece Moduna Geç"}
                  style={{
                    backgroundColor: geceModu ? '#223347' : '#FFFFFF',
                    borderColor: geceModu ? '#2D445D' : '#CBD5E1',
                    color: geceModu ? '#F1F5F9' : '#1E293B'
                  }}
                  className="h-[30px] w-[30px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs hover:bg-slate-100 dark:hover:bg-[#2D445D] hover:border-slate-400 dark:hover:border-slate-500 group"
                >
                  {geceModu ? (
                    <Sun size={14} strokeWidth={2.4} style={{ color: '#F1F5F9' }} className="shrink-0 transition-colors" />
                  ) : (
                    <Moon size={14} strokeWidth={2.4} style={{ color: '#1E293B' }} className="shrink-0 transition-colors" />
                  )}
                </button>
              </div>

              {/* Dinamik Rol Navigasyon Menüsü */}
              <nav className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                <MenuLink 
                  to="/" 
                  ikon={LayoutDashboard} 
                  etiket="Ana Sayfa" 
                  rozet={aktifAlarmSayisi > 0 ? aktifAlarmSayisi : null} 
                />

                {/* Hemşireye Özel Öncelikli Menüler */}
                {isHemsire && (
                  <>
                    <MenuLink to="/ilac-dagitim" ikon={Pill} etiket="İlaç Dağıtımı (MAR)" />
                    <MenuLink to="/toplu-vital" ikon={Stethoscope} etiket="Toplu Vital Girişi" />
                    <MenuLink to="/hastalar" ikon={Users} etiket="Bakım Sakinleri" />
                    <MenuLink to="/vardiya-raporu" ikon={FileText} etiket="Teslim Raporu" />
                    <MenuLink to="/gorev-panosu" ikon={Pin} etiket="Görev Panosu" />
                    <MenuLink to="/vardiya-takvim" ikon={Calendar} etiket="Nöbet Takvimi" />
                    <MenuLink to="/duyurular" ikon={Megaphone} etiket="Duyuru Panosu" />
                  </>
                )}

                {/* Kurum Hekimine Özel Menüler */}
                {isDoktor && (
                  <>
                    <MenuLink to="/kadro" eslesmeler={['/personel', '/doktorlar']} ikon={Users} etiket="Kadro Yönetimi" />
                    <MenuLink to="/vizite" ikon={Stethoscope} etiket="Hekim Viziteleri" />
                    <MenuLink to="/hastalar" ikon={Users} etiket="Bakım Sakinleri" />
                    <MenuLink to="/ilaclar" ikon={Pill} etiket="İlaç & Tedavi" />
                    <MenuLink to="/sevkler" ikon={Ambulance} etiket="Hastane Sevkleri" />
                    <MenuLink to="/vardiya-takvim" ikon={Calendar} etiket="Nöbet Takvimi" />
                    <MenuLink to="/duyurular" ikon={Megaphone} etiket="Duyuru Panosu" />
                  </>
                )}

                {/* Başhekim Menüleri (Tüm Operasyonel & Klinik Yetkiler) */}
                {isBashekim && (
                  <>
                    <MenuLink to="/kadro" eslesmeler={['/personel', '/doktorlar']} ikon={Users} etiket="Kadro Yönetimi" />
                    <MenuLink to="/hastalar" ikon={FolderOpen} etiket="Bakım Sakinleri" />
                    <MenuLink to="/ilac-dagitim" ikon={Pill} etiket="İlaç Dağıtımı (MAR)" />
                    <MenuLink to="/toplu-vital" ikon={Stethoscope} etiket="Toplu Vital Girişi" />
                    <MenuLink to="/vizite" ikon={ClipboardList} etiket="Hekim Viziteleri" />
                    <MenuLink to="/ilaclar" ikon={Package} etiket="İlaçlar & Stok" />
                    <MenuLink to="/sevkler" ikon={Ambulance} etiket="Hastane Sevkleri" />
                    <MenuLink to="/vardiya-takvim" ikon={Calendar} etiket="Vardiya Takvimi" />
                    <MenuLink to="/gorev-panosu" ikon={Pin} etiket="Görev Panosu" />
                    <MenuLink to="/vardiya-raporu" ikon={FileText} etiket="Teslim Raporu" />
                    <MenuLink to="/duyurular" ikon={Megaphone} etiket="Duyuru Panosu" />
                    <MenuLink to="/sistem-loglari" ikon={Terminal} etiket="Aktivite Geçmişi" />
                  </>
                )}

                {/* Başhemşire Menüleri */}
                {isBashemsire && (
                  <>
                    <MenuLink to="/kadro" eslesmeler={['/personel', '/doktorlar']} ikon={Users} etiket="Kadro Yönetimi" />
                    <MenuLink to="/hastalar" ikon={FolderOpen} etiket="Bakım Sakinleri" />
                    <MenuLink to="/ilac-dagitim" ikon={Pill} etiket="İlaç Dağıtımı (MAR)" />
                    <MenuLink to="/toplu-vital" ikon={Stethoscope} etiket="Toplu Vital Girişi" />
                    <MenuLink to="/ilaclar" ikon={Package} etiket="İlaçlar & Stok" />
                    <MenuLink to="/sevkler" ikon={Ambulance} etiket="Hastane Sevkleri" />
                    <MenuLink to="/vardiya-takvim" ikon={Calendar} etiket="Vardiya Takvimi" />
                    <MenuLink to="/gorev-panosu" ikon={Pin} etiket="Görev Panosu" />
                    <MenuLink to="/vardiya-raporu" ikon={FileText} etiket="Teslim Raporu" />
                    <MenuLink to="/duyurular" ikon={Megaphone} etiket="Duyuru Panosu" />
                    <MenuLink to="/sistem-loglari" ikon={Terminal} etiket="Aktivite Geçmişi" />
                  </>
                )}

                {/* Denetçi Yönetici Menüleri (Salt Okunur İzleme + Duyuru/Görev) */}
                {isYonetici && (
                  <>
                    <MenuLink to="/kadro" eslesmeler={['/personel', '/doktorlar']} ikon={Users} etiket="Kadro Yönetimi" />
                    <MenuLink to="/hastalar" ikon={FolderOpen} etiket="Bakım Sakinleri (İzleme)" />
                    <MenuLink to="/vizite" ikon={ClipboardList} etiket="Hekim Viziteleri" />
                    <MenuLink to="/ilaclar" ikon={Package} etiket="İlaçlar & Stok" />
                    <MenuLink to="/sevkler" ikon={Ambulance} etiket="Hastane Sevkleri" />
                    <MenuLink to="/vardiya-takvim" ikon={Calendar} etiket="Vardiya Takvimi" />
                    <MenuLink to="/gorev-panosu" ikon={Pin} etiket="Görev Panosu" />
                    <MenuLink to="/vardiya-raporu" ikon={FileText} etiket="Teslim Raporu" />
                    <MenuLink to="/duyurular" ikon={Megaphone} etiket="Duyuru Panosu" />
                    <MenuLink to="/sistem-loglari" ikon={Terminal} etiket="Aktivite Geçmişi" />
                  </>
                )}
              </nav>

              {/* Alt Bölüm: Canlı Saat & Güvenli Çıkış */}
              <div 
                style={{ backgroundColor: geceModu ? '#131C28' : '#FFFFFF', borderColor: geceModu ? '#26334D' : '#E2E8F0' }}
                className="p-2.5 border-t space-y-1.5"
              >
                {/* Canlı Dijital Saat */}
                <div 
                  style={{ backgroundColor: geceModu ? '#1A2838' : '#F8FAFC', borderColor: geceModu ? '#2D445D' : '#E2E8F0' }}
                  className="p-1.5 rounded-lg border text-center flex flex-col items-center justify-center"
                >
                  <div 
                    style={{ color: geceModu ? '#6EB2E8' : '#142A4A' }}
                    className="flex items-center gap-1.5 text-xs font-black font-mono"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{suAn.toLocaleTimeString('tr-TR')}</span>
                  </div>
                  <span 
                    style={{ color: geceModu ? '#94A3B8' : '#64748B' }}
                    className="text-[9px] font-bold uppercase font-mono mt-0.5"
                  >
                    {suAn.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}
                  </span>
                </div>

                {/* Çıkış Butonu */}
                <button
                  onClick={handleCikis}
                  style={{
                    backgroundColor: geceModu ? '#223347' : '#FFFFFF',
                    borderColor: geceModu ? '#2D445D' : '#E2E8F0',
                    color: geceModu ? '#CBD5E1' : '#334155'
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold cursor-pointer shadow-2xs transition-all duration-200 group hover:!bg-red-50 dark:hover:!bg-red-950/40 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200 dark:hover:!border-red-800/60 hover:shadow-xs active:scale-[0.98]"
                >
                  <LogOut size={13} strokeWidth={2.2} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>

            {/* ── 2. SAĞ ANA İÇERİK ALANI ── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
              <div className="max-w-7xl mx-auto">
                <Suspense fallback={<SayfaYukleniyor />}>
                  <Routes>
                    {/* Dinamik Dashboard Yönlendirmesi */}
                    <Route
                      path="/"
                      element={
                        isBashekim || isYonetici ? (
                          <AdminDashboard />
                        ) : isBashemsire ? (
                          <HemsireDashboard />
                        ) : isDoktor ? (
                          <DoktorDashboard />
                        ) : (
                          <HemsireDashboard />
                        )
                      }
                    />

                    {/* Klinik & Operasyonel Rotalar */}
                    <Route path="/ilac-dagitim" element={<IlacDagitimPaneli />} />
                    <Route path="/toplu-vital" element={<TopluVitalGiris />} />
                    <Route path="/vizite" element={<HekimVizite />} />

                    {/* Diğer Modüller */}
                    <Route path="/admin-dashboard" element={<AdminDashboard />} />
                    <Route path="/doktor-dashboard" element={<DoktorDashboard />} />
                    <Route path="/hemsire-dashboard" element={<HemsireDashboard />} />

                    <Route path="/kadro" element={<KadroYonetimi />} />
                    <Route path="/personel" element={<KadroYonetimi />} />
                    <Route path="/doktorlar" element={<KadroYonetimi />} />
                    <Route path="/vardiya-takvim" element={<VardiyaTakvim />} />
                    <Route path="/gorev-panosu" element={<GorevPanosu />} />
                    <Route path="/vardiya-raporu" element={<VardiyaRaporu />} />
                    <Route path="/duyurular" element={<DuyuruPanosu />} />
                    <Route path="/hastalar" element={<HastaListesi />} />
                    <Route path="/hastalar/:id" element={<HastaDetay />} />
                    <Route path="/ilaclar" element={<IlacListesi />} />
                    <Route path="/ilaclar/:id" element={<IlacStokDetay />} />
                    <Route path="/sevkler" element={<HastahaneSevk />} />
                    <Route path="/sistem-loglari" element={<SistemLoglari />} />
                  </Routes>
                </Suspense>
              </div>
            </div>

          </div>
        } />
      </Routes>
    </ThemeContext.Provider>
  );
}

export default App;