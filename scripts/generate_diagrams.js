const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'diyagramlar');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ── 1. SİSTEM MİMARİSİ ŞEMASI ────────────────────────────────────────────────
const svgMimarisi = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090E17"/>
      <stop offset="100%" stop-color="#141E30"/>
    </linearGradient>
    <linearGradient id="feGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="beGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="sigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
    <linearGradient id="dbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064E3B"/>
      <stop offset="100%" stop-color="#022C22"/>
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Arka Plan -->
  <rect width="1400" height="900" fill="url(#bgGrad)"/>

  <!-- Üst Başlık -->
  <g transform="translate(700, 60)" text-anchor="middle">
    <text font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">MEDICORE KLİNİK &amp; BAKIM SİSTEMİ</text>
    <text y="32" font-size="15" font-weight="600" fill="#94A3B8" letter-spacing="1.5">UÇTAN UCA TEKNİK SİSTEM VE YAZILIM MİMARİSİ</text>
  </g>

  <!-- ── 1. KATMAN: FRONTEND (SUNUM KATMANI) ── -->
  <g transform="translate(60, 130)">
    <rect width="380" height="690" rx="16" fill="url(#feGrad)" stroke="#334155" stroke-width="2" filter="url(#cardShadow)"/>
    <rect width="380" height="48" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <text x="190" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#38BDF8" letter-spacing="0.5">İSTEMCİ / FRONTEND KATMANI</text>

    <!-- Frontend Bileşenleri -->
    <g transform="translate(20, 68)">
      <!-- React SPA -->
      <rect width="340" height="90" rx="10" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
      <text x="170" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#F8FAFC">React 19 &amp; Vite SPA</text>
      <text x="170" y="52" text-anchor="middle" font-size="11.5" fill="#94A3B8">TailwindCSS 4 + Modern CSS + Geist Font</text>
      <text x="170" y="72" text-anchor="middle" font-size="11" fill="#38BDF8">Recharts (Klinik İstatistik &amp; Grafikler)</text>

      <!-- Context API -->
      <rect y="105" width="340" height="95" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="170" y="132" text-anchor="middle" font-size="13" font-weight="bold" fill="#F8FAFC">Global State (Context API)</text>
      <text x="170" y="154" text-anchor="middle" font-size="11.5" fill="#94A3B8">• AuthContext (JWT Oturum &amp; RBAC Rolleri)</text>
      <text x="170" y="174" text-anchor="middle" font-size="11.5" fill="#94A3B8">• NotificationContext &amp; ToastContext</text>
      <text x="170" y="191" text-anchor="middle" font-size="11" fill="#E2E8F0">• ThemeContext (Gece / Gündüz Modu)</text>

      <!-- Web Audio API -->
      <rect y="215" width="340" height="85" rx="10" fill="#1E293B" stroke="#F43F5E" stroke-width="1.5"/>
      <text x="170" y="242" text-anchor="middle" font-size="13" font-weight="bold" fill="#FDA4AF">Web Audio API (AudioContext)</text>
      <text x="170" y="264" text-anchor="middle" font-size="11.5" fill="#CBD5E1">Yerleşik Testere Dişi (Sawtooth) Sentezleyici</text>
      <text x="170" y="284" text-anchor="middle" font-size="11" fill="#F43F5E">%100 Kesintisiz, 3 Kademeli Sesli Alarm</text>

      <!-- UI Modülleri -->
      <rect y="315" width="340" height="150" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="170" y="340" text-anchor="middle" font-size="13" font-weight="bold" fill="#F8FAFC">Klinik Operasyon Modülleri</text>
      <text x="25" y="365" font-size="11.5" fill="#CBD5E1">✓ Yönetici, Hekim ve Hemşire Dashboard</text>
      <text x="25" y="388" font-size="11.5" fill="#CBD5E1">✓ Toplu Vital Matrisi &amp; Anlık Renk Kodlaması</text>
      <text x="25" y="411" font-size="11.5" fill="#CBD5E1">✓ Saatlik İlaç Dağıtım Paneli (MAR)</text>
      <text x="25" y="434" font-size="11.5" fill="#CBD5E1">✓ Hekim Muayene &amp; Vizite Formları</text>
      <text x="25" y="455" font-size="11.5" fill="#CBD5E1">✓ 112 Dış Sevk &amp; Vardiya Devir Teslim</text>

      <!-- Native Fetch -->
      <rect y="480" width="340" height="80" rx="10" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
      <text x="170" y="508" text-anchor="middle" font-size="13" font-weight="bold" fill="#38BDF8">Native Fetch Client</text>
      <text x="170" y="528" text-anchor="middle" font-size="11.5" fill="#94A3B8">Bearer Token Injection, Otomatik Hata Yakalama</text>
      <text x="170" y="546" text-anchor="middle" font-size="11" fill="#94A3B8">JSON Serileştirme &amp; Sıfır Harici Paket Bağımlılığı</text>

      <!-- SignalR Client -->
      <rect y="575" width="340" height="35" rx="8" fill="#0369A1" stroke="#38BDF8" stroke-width="1.5"/>
      <text x="170" y="598" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">@microsoft/signalr (WebSocket Client)</text>
    </g>
  </g>

  <!-- ── ORTA: GERÇEK ZAMANLI VERİ HATTI (SIGNALR WEBSOCKET) ── -->
  <g transform="translate(470, 380)">
    <rect width="120" height="150" rx="12" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2" filter="url(#cardShadow)"/>
    <text x="60" y="32" text-anchor="middle" font-size="12" font-weight="bold" fill="#38BDF8">GERÇEK ZAMANLI</text>
    <text x="60" y="50" text-anchor="middle" font-size="14" font-weight="900" fill="#FFFFFF">SignalR</text>
    <text x="60" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="#7DD3FC">Hub Gateway</text>
    <line x1="15" y1="85" x2="105" y2="85" stroke="#38BDF8" stroke-dasharray="3,3"/>
    <text x="60" y="105" text-anchor="middle" font-size="10" fill="#BAE6FD">/hub/klinik</text>
    <text x="60" y="122" text-anchor="middle" font-size="9.5" fill="#93C5FD">WebSocket</text>
    <text x="60" y="138" text-anchor="middle" font-size="9.5" fill="#93C5FD">Auto-Reconnect</text>
  </g>

  <!-- Oklar: Frontend <-> SignalR -->
  <path d="M 440,455 L 470,455" stroke="#38BDF8" stroke-width="3" fill="none" marker-end="url(#arrow)"/>
  <path d="M 590,455 L 620,455" stroke="#38BDF8" stroke-width="3" fill="none"/>

  <!-- ── 2. KATMAN: BACKEND WEB API (.NET 9) ── -->
  <g transform="translate(620, 130)">
    <rect width="390" height="690" rx="16" fill="url(#beGrad)" stroke="#2563EB" stroke-width="2" filter="url(#cardShadow)"/>
    <rect width="390" height="48" rx="16" fill="#1E3A8A" stroke="#2563EB" stroke-width="2"/>
    <text x="195" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#93C5FD" letter-spacing="0.5">BACKEND API KATMANI (.NET 9 C#)</text>

    <!-- Backend Bileşenleri -->
    <g transform="translate(20, 68)">
      <!-- REST Controllers -->
      <rect width="350" height="115" rx="10" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="175" y="28" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">ASP.NET Core RESTful Controllers</text>
      <text x="25" y="52" font-size="11.5" fill="#CBD5E1">• Hasta, Muayene &amp; VitalBulgu Controllers</text>
      <text x="25" y="72" font-size="11.5" fill="#CBD5E1">• IlacUygulama (MAR) &amp; IlacStok Controllers</text>
      <text x="25" y="92" font-size="11.5" fill="#CBD5E1">• HastahaneSevk, Nobet &amp; Vardiya Controllers</text>
      <text x="25" y="110" font-size="11" fill="#93C5FD">• Auth &amp; Personel Yetkilendirme Servisleri</text>

      <!-- Güvenlik & Doğrulama -->
      <rect y="128" width="350" height="95" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="175" y="152" text-anchor="middle" font-size="13" font-weight="bold" fill="#F8FAFC">Güvenlik, Kimlik &amp; Doğrulama</text>
      <text x="175" y="174" text-anchor="middle" font-size="11.5" fill="#94A3B8">JWT Bearer Token + BCrypt Password Hashing</text>
      <text x="175" y="193" text-anchor="middle" font-size="11.5" fill="#94A3B8">RBAC Role-Based Authorization Policy ([Authorize])</text>
      <text x="175" y="212" text-anchor="middle" font-size="11" fill="#60A5FA">ValidationHelpers (Girdi Doğrulama &amp; Güvenlik)</text>

      <!-- İş Mantığı ve Alarm Değerlendirici -->
      <rect y="235" width="350" height="105" rx="10" fill="#1E293B" stroke="#E11D48" stroke-width="1.5"/>
      <text x="175" y="260" text-anchor="middle" font-size="13" font-weight="bold" fill="#FDA4AF">Klinik Değerlendirme &amp; İş Mantığı</text>
      <text x="175" y="282" text-anchor="middle" font-size="12" font-weight="bold" fill="#F43F5E">VitalEvaluator Servisi</text>
      <text x="175" y="302" text-anchor="middle" font-size="11" fill="#CBD5E1">Tansiyon, Nabız, Ateş, SPO2 ve Solunum Eşik Analizi</text>
      <text x="175" y="322" text-anchor="middle" font-size="11" fill="#CBD5E1">Kritik Sapmalarda SignalR Bildirimi Tetikleme</text>

      <!-- Audit Logger -->
      <rect y="352" width="350" height="75" rx="10" fill="#1E293B" stroke="#059669" stroke-width="1.5"/>
      <text x="175" y="375" text-anchor="middle" font-size="13" font-weight="bold" fill="#34D399">AuditLogger &amp; Serilog Altyapısı</text>
      <text x="175" y="396" text-anchor="middle" font-size="11.5" fill="#94A3B8">KVKK Uyumlu İşlem Kaydı (Kullanıcı, IP, Rol, Aksiyon)</text>
      <text x="175" y="415" text-anchor="middle" font-size="11" fill="#6EE7B7">Rolling File Logs &amp; Veritabanı Aktivite Günlüğü</text>

      <!-- Hub & SignalR Server -->
      <rect y="438" width="350" height="75" rx="10" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
      <text x="175" y="462" text-anchor="middle" font-size="13" font-weight="bold" fill="#38BDF8">KlinikHub (SignalR Server)</text>
      <text x="175" y="483" text-anchor="middle" font-size="11.5" fill="#CBD5E1">Clients.All.SendAsync("ReceiveNotification")</text>
      <text x="175" y="501" text-anchor="middle" font-size="11" fill="#7DD3FC">WebSocket Çoklu İstemci Yayın Havuzu</text>

      <!-- EF Core Katmanı -->
      <rect y="525" width="350" height="85" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="175" y="550" text-anchor="middle" font-size="13" font-weight="bold" fill="#6EE7B7">Entity Framework Core 9.0 (ORM)</text>
      <text x="175" y="572" text-anchor="middle" font-size="11.5" fill="#CBD5E1">AppDbContext &amp; Code-First Migrations</text>
      <text x="175" y="593" text-anchor="middle" font-size="11" fill="#34D399">Asenkron LINQ Sorguları (async/await non-blocking)</text>
    </g>
  </g>

  <!-- Oklar: Backend <-> Database -->
  <path d="M 1010,470 L 1050,470" stroke="#10B981" stroke-width="3" fill="none"/>

  <!-- ── 3. KATMAN: VERİTABANI KATMANI (SQLITE WAL) ── -->
  <g transform="translate(1050, 130)">
    <rect width="290" height="690" rx="16" fill="url(#dbGrad)" stroke="#10B981" stroke-width="2" filter="url(#cardShadow)"/>
    <rect width="290" height="48" rx="16" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
    <text x="145" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#6EE7B7" letter-spacing="0.5">VERİ TABANI KATMANI</text>

    <!-- Veritabanı İçeriği -->
    <g transform="translate(15, 68)">
      <!-- SQLite WAL Box -->
      <rect width="260" height="110" rx="10" fill="#064E3B" stroke="#34D399" stroke-width="1.5"/>
      <text x="130" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">SQLite Veritabanı</text>
      <text x="130" y="52" text-anchor="middle" font-size="12" font-weight="bold" fill="#A7F3D0">WAL (Write-Ahead Logging)</text>
      <text x="130" y="72" text-anchor="middle" font-size="11" fill="#D1FAE5">• medicore.db (Ana Veri)</text>
      <text x="130" y="89" text-anchor="middle" font-size="11" fill="#D1FAE5">• medicore.db-wal (Yazma Günlüğü)</text>
      <text x="130" y="105" text-anchor="middle" font-size="11" fill="#D1FAE5">• medicore.db-shm (Paylaşımlı Bellek)</text>

      <!-- Tablolar Listesi -->
      <rect y="125" width="260" height="485" rx="10" fill="#022C22" stroke="#059669" stroke-width="1.5"/>
      <text x="130" y="152" text-anchor="middle" font-size="13" font-weight="bold" fill="#A7F3D0">İlişkisel Varlık Tabloları</text>

      <g transform="translate(15, 170)" font-size="11" fill="#ECFDF5">
        <text y="0">📁 Hastalar (Demografik, Oda, Durum)</text>
        <text y="24">🩺 HekimMuayeneleri (Vizite &amp; Tanı)</text>
        <text y="48">💓 VitalBulgular (Tansiyon, SpO2...)</text>
        <text y="72">💊 Ilaclar (Katalog &amp; Dozaj Formu)</text>
        <text y="96">📋 HastaIlaclari (Reçete Dağılımı)</text>
        <text y="120">⏰ IlacUygulamalari (MAR Matrisi)</text>
        <text y="144">📦 IlacStoklari (Kritik Stok Takibi)</text>
        <text y="168">🚑 HastahaneSevkleri (112 Dış Sevk)</text>
        <text y="192">📅 Nobetler (Aylık Nöbet Çizelgesi)</text>
        <text y="216">📌 Gorevler (Vardiya İçi Görevler)</text>
        <text y="240">📢 Duyurular (Kurum Geneli İletişim)</text>
        <text y="264">📝 VardiyaRaporlari (Teslim Tutanağı)</text>
        <text y="288">👨‍⚕️ Doktorlar &amp; Personel Tablosu</text>
        <text y="312">👥 Kullanicilar (Rol &amp; Auth Hash)</text>
        <text y="336">🛡️ AktiviteLoglari (Audit Trail)</text>
      </g>

      <rect y="540" width="260" height="60" rx="8" fill="#064E3B" stroke="#34D399" stroke-width="1"/>
      <text x="130" y="562" text-anchor="middle" font-size="11" font-weight="bold" fill="#6EE7B7">Eş Zamanlılık Güvencesi</text>
      <text x="130" y="580" text-anchor="middle" font-size="10" fill="#D1FAE5">Paralel Okuma &amp; Kilitlenmesiz Yazma</text>
    </g>
  </g>

  <!-- Alt Bilgi Bandı -->
  <g transform="translate(700, 860)" text-anchor="middle" font-size="12" fill="#64748B">
    <text>T.C. Cumhurbaşkanlığı İletişim Başkanlığı Staj Programı | Geliştirici: Ahmet Taha EROL | MediCore v1.0.0 Architecture</text>
  </g>
</svg>`;

// ── 2. VERİTABANI ER DİYAGRAMI ───────────────────────────────────────────────
const svgERD = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1500" height="960" viewBox="0 0 1500 960" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="erdBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1320"/>
      <stop offset="100%" stop-color="#111C2E"/>
    </linearGradient>
    <filter id="boxShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="1500" height="960" fill="url(#erdBg)"/>

  <!-- Başlık -->
  <g transform="translate(750, 45)" text-anchor="middle">
    <text font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">MEDICORE VERİTABANI VARLIK-İLİŞKİ (ER) DİYAGRAMI</text>
    <text y="26" font-size="14" font-weight="600" fill="#94A3B8">Entity Framework Core 9.0 İlişkisel Veri Modeli</text>
  </g>

  <!-- TABLO FONKSİYONU ŞABLONLARI -->
  <!-- 1. HASTA (Merkez Tablo) -->
  <g transform="translate(610, 110)" filter="url(#boxShadow)">
    <rect width="280" height="230" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
    <rect width="280" height="36" rx="10" fill="#0284C7"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">HASTALAR (Merkez Varlık)</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#38BDF8">🔑 PK Id : int</text>
      <text y="20">TCKimlikNo : string (11)</text>
      <text y="40">Ad : string (50)</text>
      <text y="60">Soyad : string (50)</text>
      <text y="80">DogumTarihi : DateTime</text>
      <text y="100">OdaNo : string, YatakNo : string</text>
      <text y="120">KabulTarihi : DateTime</text>
      <text y="140">Durum : string (Aktif/Taburcu)</text>
      <text y="160">CikisTarihi : DateTime?</text>
    </g>
  </g>

  <!-- 2. VİTAL BULGULAR -->
  <g transform="translate(180, 110)" filter="url(#boxShadow)">
    <rect width="260" height="210" rx="10" fill="#1E293B" stroke="#E11D48" stroke-width="2"/>
    <rect width="260" height="36" rx="10" fill="#BE123C"/>
    <text x="130" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">VITAL_BULGULAR</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FDA4AF">🔑 PK Id : int</text>
      <text y="20" fill="#F43F5E">🏷️ FK HastaId : int</text>
      <text y="40">TansiyonSistolik : int</text>
      <text y="60">TansiyonDiastolik : int</text>
      <text y="80">Nabiz : int</text>
      <text y="100">Ates : decimal</text>
      <text y="120">SPO2 : int, SolunumSayisi : int</text>
      <text y="140">KayitTarihi : DateTime</text>
    </g>
  </g>

  <!-- 3. HEKİM MUAYENE (VİZİTE) -->
  <g transform="translate(1050, 110)" filter="url(#boxShadow)">
    <rect width="270" height="210" rx="10" fill="#1E293B" stroke="#8B5CF6" stroke-width="2"/>
    <rect width="270" height="36" rx="10" fill="#6D28D9"/>
    <text x="135" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">HEKIM_MUAYENELERI</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#C4B5FD">🔑 PK Id : int</text>
      <text y="20" fill="#A78BFA">🏷️ FK HastaId : int</text>
      <text y="40" fill="#A78BFA">🏷️ FK DoktorId : int</text>
      <text y="60">SikayetAnamnez : string</text>
      <text y="80">FizikiMuayene : string</text>
      <text y="100">ICD10Kodu : string</text>
      <text y="120">Tani : string</text>
      <text y="140">MuayeneTarihi : DateTime</text>
    </g>
  </g>

  <!-- 4. HASTA İLAÇ (REÇETE) -->
  <g transform="translate(610, 420)" filter="url(#boxShadow)">
    <rect width="280" height="210" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
    <rect width="280" height="36" rx="10" fill="#047857"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">HASTA_ILACLARI (Reçete)</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#6EE7B7">🔑 PK Id : int</text>
      <text y="20" fill="#34D399">🏷️ FK HastaId : int</text>
      <text y="40" fill="#34D399">🏷️ FK IlacId : int</text>
      <text y="60">Doz : string, Form : string</text>
      <text y="80">Sabah : bool, Ogle : bool</text>
      <text y="100">Aksam : bool, Gece : bool</text>
      <text y="120">BaslangicTarihi : DateTime</text>
      <text y="140">BitisTarihi : DateTime?</text>
    </g>
  </g>

  <!-- 5. İLAÇ UYGULAMA (MAR) -->
  <g transform="translate(180, 420)" filter="url(#boxShadow)">
    <rect width="260" height="210" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
    <rect width="260" height="36" rx="10" fill="#D97706"/>
    <text x="130" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">ILAC_UYGULAMALARI (MAR)</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FDE68A">🔑 PK Id : int</text>
      <text y="20" fill="#FBBF24">🏷️ FK HastaIlacId : int</text>
      <text y="40" fill="#FBBF24">🏷️ FK PersonelId : int</text>
      <text y="60">UygulamaTarihi : DateTime</text>
      <text y="80">Ogun : string (Sabah/Öğle...)</text>
      <text y="100">Durum : string (Uygulandı/Red)</text>
      <text y="120">RedNedeni : string?</text>
      <text y="140">IslemZamani : DateTime</text>
    </g>
  </g>

  <!-- 6. İLAÇ KATALOĞU & STOK -->
  <g transform="translate(1050, 420)" filter="url(#boxShadow)">
    <rect width="270" height="210" rx="10" fill="#1E293B" stroke="#06B6D4" stroke-width="2"/>
    <rect width="270" height="36" rx="10" fill="#0891B2"/>
    <text x="135" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">ILACLAR &amp; STOK</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#A5F3FC">🔑 PK Id : int</text>
      <text y="20">Barkod : string</text>
      <text y="40">IlacAdi : string</text>
      <text y="60">EtkenMadde : string</text>
      <text y="80">MevcutStok : int</text>
      <text y="100">KritikStokSeviyesi : int</text>
      <text y="120">Birim : string (Kutu/Ampul)</text>
      <text y="140">SonGuncelleme : DateTime</text>
    </g>
  </g>

  <!-- 7. HASTANE DIŞ SEVK (112) -->
  <g transform="translate(180, 700)" filter="url(#boxShadow)">
    <rect width="260" height="190" rx="10" fill="#1E293B" stroke="#EF4444" stroke-width="2"/>
    <rect width="260" height="36" rx="10" fill="#DC2626"/>
    <text x="130" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">HASTAHANE_SEVK (112)</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FCA5A5">🔑 PK Id : int</text>
      <text y="20" fill="#F87171">🏷️ FK HastaId : int</text>
      <text y="40">SevkNedeni : string</text>
      <text y="60">HedefHastane : string</text>
      <text y="80">Ambulans112Durum : string</text>
      <text y="100">RefakatciPersonel : string</text>
      <text y="120">CikisTarihi, DonusTarihi</text>
    </g>
  </g>

  <!-- 8. NÖBET & VARDİYA -->
  <g transform="translate(610, 700)" filter="url(#boxShadow)">
    <rect width="280" height="190" rx="10" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
    <rect width="280" height="36" rx="10" fill="#1D4ED8"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">NOBETLER &amp; VARDIYA</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#93C5FD">🔑 PK Id : int</text>
      <text y="20" fill="#60A5FA">🏷️ FK PersonelId / DoktorId</text>
      <text y="40">Tarih : DateTime</text>
      <text y="60">VardiyaTipi : string (Gündüz/Gece)</text>
      <text y="80">GorevAlani : string</text>
      <text y="100">Aciklama : string?</text>
    </g>
  </g>

  <!-- 9. AKTİVİTE LOGLARI (AUDIT TRAIL) -->
  <g transform="translate(1050, 700)" filter="url(#boxShadow)">
    <rect width="270" height="190" rx="10" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
    <rect width="270" height="36" rx="10" fill="#475569"/>
    <text x="135" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">AKTIVITE_LOGLARI (Audit)</text>
    <g transform="translate(15, 54)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#CBD5E1">🔑 PK Id : int</text>
      <text y="20">KullaniciAdi : string</text>
      <text y="40">Rol : string</text>
      <text y="60">IslemTuru : string (Ekle/Sil...)</text>
      <text y="80">Detay : string</text>
      <text y="100">IPAdresi : string</text>
      <text y="120">Tarih : DateTime</text>
    </g>
  </g>

  <!-- İLİŞKİ ÇİZGİLERİ VE ETİKETLER (1:N) -->
  <!-- Hasta -> VitalBulgu -->
  <line x1="610" y1="200" x2="440" y2="200" stroke="#E11D48" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="525" y="190" fill="#FDA4AF" font-size="11" font-weight="bold" text-anchor="middle">1 : N (Bir Hastanın Çok Vitali)</text>

  <!-- Hasta -> Muayene -->
  <line x1="890" y1="200" x2="1050" y2="200" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="970" y="190" fill="#C4B5FD" font-size="11" font-weight="bold" text-anchor="middle">1 : N (Viziteler)</text>

  <!-- Hasta -> HastaIlac -->
  <line x1="750" y1="340" x2="750" y2="420" stroke="#10B981" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="755" y="380" fill="#6EE7B7" font-size="11" font-weight="bold">1 : N (Reçete)</text>

  <!-- Ilac -> HastaIlac -->
  <line x1="1050" y1="520" x2="890" y2="520" stroke="#06B6D4" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="970" y="510" fill="#67E8F9" font-size="11" font-weight="bold" text-anchor="middle">1 : N (İlaç Atama)</text>

  <!-- HastaIlac -> IlacUygulama -->
  <line x1="610" y1="520" x2="440" y2="520" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="525" y="510" fill="#FDE68A" font-size="11" font-weight="bold" text-anchor="middle">1 : N (MAR Dağıtım)</text>

  <!-- Hasta -> HastahaneSevk -->
  <path d="M 650,340 L 650,780 L 440,780" stroke="#EF4444" stroke-width="2" fill="none" stroke-dasharray="4,4"/>
  <text x="545" y="770" fill="#FCA5A5" font-size="11" font-weight="bold" text-anchor="middle">1 : N (Dış Sevkler)</text>

  <!-- Alt Bilgi -->
  <text x="750" y="930" text-anchor="middle" font-size="12" fill="#64748B">MediCore Entity Model İlişkisel Bütünlük | EF Core Code-First | WAL Concurrency Safe</text>
</svg>`;

// ── 3. SIGNALR & SESLİ KRİTİK ALARM AKIŞI ─────────────────────────────────────
const svgSignalR = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1350" height="820" viewBox="0 0 1350 820" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="seqBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080D1A"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="seqShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1350" height="820" fill="url(#seqBg)"/>

  <!-- Başlık -->
  <g transform="translate(675, 45)" text-anchor="middle">
    <text font-size="24" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">KRİTİK VİTAL ALARMI VE SIGNALR WEBSOCKET AKIŞ DİYAGRAMI</text>
    <text y="24" font-size="13.5" font-weight="600" fill="#38BDF8">Toplu Vital Girişi &gt; VitalEvaluator &gt; SignalR Hub &gt; Yerel Web Audio API Sentezleyici</text>
  </g>

  <!-- AKTÖRLER VE KATMANLAR (LIFELINES) -->
  <!-- 1. Hemşire -->
  <g transform="translate(120, 110)">
    <rect width="150" height="48" rx="8" fill="#1E293B" stroke="#38BDF8" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="75" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">💉 Hemşire</text>
    <line x1="75" y1="48" x2="75" y2="650" stroke="#334155" stroke-width="2" stroke-dasharray="6,6"/>
  </g>

  <!-- 2. React UI (Toplu Vital) -->
  <g transform="translate(360, 110)">
    <rect width="170" height="48" rx="8" fill="#1E293B" stroke="#0284C7" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="85" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#38BDF8">💻 React 19 Frontend</text>
    <line x1="85" y1="48" x2="85" y2="650" stroke="#334155" stroke-width="2" stroke-dasharray="6,6"/>
  </g>

  <!-- 3. .NET 9 Web API -->
  <g transform="translate(610, 110)">
    <rect width="180" height="48" rx="8" fill="#1E293B" stroke="#3B82F6" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="90" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#93C5FD">⚙️ .NET 9 Web API</text>
    <line x1="90" y1="48" x2="90" y2="650" stroke="#334155" stroke-width="2" stroke-dasharray="6,6"/>
  </g>

  <!-- 4. SignalR Hub -->
  <g transform="translate(870, 110)">
    <rect width="160" height="48" rx="8" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="80" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">📡 KlinikHub (SignalR)</text>
    <line x1="80" y1="48" x2="80" y2="650" stroke="#0284C7" stroke-width="2" stroke-dasharray="6,6"/>
  </g>

  <!-- 5. Tüm İstemciler (Hekim / Başhekim / Servis) -->
  <g transform="translate(1100, 110)">
    <rect width="180" height="48" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="90" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#6EE7B7">👥 Tüm Sağlık Ekibi</text>
    <line x1="90" y1="48" x2="90" y2="650" stroke="#334155" stroke-width="2" stroke-dasharray="6,6"/>
  </g>

  <!-- ETKİLEŞİM ADIMLARI -->
  <!-- Adım 1: Vital Değerleri Girişi -->
  <g transform="translate(0, 190)">
    <line x1="195" y1="0" x2="445" y2="0" stroke="#38BDF8" stroke-width="2"/>
    <polygon points="445,0 435,-5 435,5" fill="#38BDF8"/>
    <text x="320" y="-8" text-anchor="middle" font-size="11.5" fill="#E2E8F0">1. Nabız: 140 bpm, Ateş: 39.5°C girer ve "Kaydet"e basar</text>
  </g>

  <!-- Adım 2: POST API İsteği -->
  <g transform="translate(0, 240)">
    <line x1="445" y1="0" x2="700" y2="0" stroke="#38BDF8" stroke-width="2"/>
    <polygon points="700,0 690,-5 690,5" fill="#38BDF8"/>
    <text x="572" y="-8" text-anchor="middle" font-size="11.5" fill="#38BDF8" font-family="monospace">2. POST /api/VitalBulgu/toplu (JWT Bearer)</text>
  </g>

  <!-- Adım 3: VitalEvaluator & DB -->
  <g transform="translate(700, 280)">
    <rect x="0" y="0" width="160" height="70" rx="6" fill="#1E293B" stroke="#E11D48" stroke-width="1.5"/>
    <text x="80" y="20" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#FDA4AF">VitalEvaluator Analizi</text>
    <text x="80" y="38" text-anchor="middle" font-size="10.5" fill="#CBD5E1">Nabız &gt; 120 veya Ateş &gt; 38.5</text>
    <text x="80" y="56" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#F43F5E">🚨 KRİTİK EŞİK AŞILDI!</text>
  </g>

  <!-- Adım 4: SignalR Tetikleme -->
  <g transform="translate(0, 390)">
    <line x1="700" y1="0" x2="950" y2="0" stroke="#F43F5E" stroke-width="2.5"/>
    <polygon points="950,0 940,-5 940,5" fill="#F43F5E"/>
    <text x="825" y="-8" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#FDA4AF">4. Clients.All.SendAsync("ReceiveNotification", ...)</text>
  </g>

  <!-- Adım 5: WebSocket Çoklu Yayın (Broadcast) -->
  <g transform="translate(0, 440)">
    <!-- İstemciye geri dönüş -->
    <line x1="950" y1="0" x2="445" y2="0" stroke="#0EA5E9" stroke-width="2" stroke-dasharray="4,4"/>
    <polygon points="445,0 455,-5 455,5" fill="#0EA5E9"/>
    <!-- Diğer istemcilere yayın -->
    <line x1="950" y1="0" x2="1190" y2="0" stroke="#0EA5E9" stroke-width="2.5"/>
    <polygon points="1190,0 1180,-5 1180,5" fill="#0EA5E9"/>
    <text x="1070" y="-8" text-anchor="middle" font-size="11.5" fill="#7DD3FC">5. Anlık WebSocket Yayını (&lt; 20ms)</text>
  </g>

  <!-- Adım 6: İstemci Tarafı Alarm İşleme -->
  <g transform="translate(365, 490)">
    <rect width="160" height="90" rx="8" fill="#881337" stroke="#F43F5E" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="80" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">Web Audio API Sentez</text>
    <text x="80" y="44" text-anchor="middle" font-size="10.5" fill="#FECDD3">3 Kademeli Sawtooth Wave</text>
    <text x="80" y="62" text-anchor="middle" font-size="10.5" fill="#FECDD3">880Hz -&gt; 440Hz Frekans</text>
    <text x="80" y="80" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#FFFFFF">🔊 Kesintisiz Sesli Alarm</text>
  </g>

  <g transform="translate(1110, 490)">
    <rect width="160" height="90" rx="8" fill="#881337" stroke="#F43F5E" stroke-width="2" filter="url(#seqShadow)"/>
    <text x="80" y="24" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">Görsel &amp; Sesli Alarm</text>
    <text x="80" y="44" text-anchor="middle" font-size="10.5" fill="#FECDD3">Kırmızı Toast Uyarısı</text>
    <text x="80" y="62" text-anchor="middle" font-size="10.5" fill="#FECDD3">Dinamik Yönlendirme Linki</text>
    <text x="80" y="80" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#FFFFFF">🚨 Anında Müdahale Çağrısı</text>
  </g>

  <!-- Alt Özet Kutusu -->
  <g transform="translate(180, 690)">
    <rect width="990" height="70" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
    <text x="495" y="26" text-anchor="middle" font-size="12" font-weight="bold" fill="#38BDF8">TEKNİK AVANTAJ: SIFIR HARİCİ SES DOSYASI VE BAĞIMSIZ WEB AUDIO API SENTEZİ</text>
    <text x="495" y="48" text-anchor="middle" font-size="11" fill="#94A3B8">Harici .mp3/.wav dosyaları CDN/CORS veya internet gecikmelerinden etkilenebilir. MediCore yerleşik tarayıcı osilatörü kullanarak %100 çevrimdışı ve sıfır gecikmeli tıbbi alarm üretir.</text>
  </g>
</svg>`;

// ── 4. İLAÇ DAĞITIMI (MAR) DÖNGÜSÜ ───────────────────────────────────────────
const svgMAR = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1300" height="750" viewBox="0 0 1300 750" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="marBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1118"/>
      <stop offset="100%" stop-color="#101F30"/>
    </linearGradient>
    <filter id="fShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1300" height="750" fill="url(#marBg)"/>

  <!-- Başlık -->
  <g transform="translate(650, 45)" text-anchor="middle">
    <text font-size="24" font-weight="900" fill="#FFFFFF">SAATLİK İLAÇ DAĞITIMI (MAR) SÜREÇ VE DURUM MAKİNESİ</text>
    <text y="24" font-size="13.5" font-weight="600" fill="#34D399">Medication Administration Record: Planlama &gt; Uygulama &gt; Doğrulama &gt; Stok Düşümü</text>
  </g>

  <!-- 1. Adım: Hekim Reçetesi -->
  <g transform="translate(80, 200)" filter="url(#fShadow)">
    <rect width="220" height="130" rx="12" fill="#1E293B" stroke="#6D28D9" stroke-width="2"/>
    <rect width="220" height="32" rx="12" fill="#6D28D9"/>
    <text x="110" y="21" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">1. HEKİM İSTEMİ (REÇETE)</text>
    <text x="110" y="60" text-anchor="middle" font-size="11.5" fill="#E2E8F0">İlaç, Dozaj ve Form Seçimi</text>
    <text x="110" y="80" text-anchor="middle" font-size="11" fill="#A78BFA">Öğünler: Sabah/Öğle/Akşam/Gece</text>
    <text x="110" y="100" text-anchor="middle" font-size="11" fill="#94A3B8">Başlangıç &amp; Bitiş Tarihleri</text>
  </g>

  <!-- Ok 1 -> 2 -->
  <line x1="300" y1="265" x2="360" y2="265" stroke="#94A3B8" stroke-width="2.5"/>
  <polygon points="360,265 350,260 350,270" fill="#94A3B8"/>

  <!-- 2. Adım: Günlük MAR Matrisi -->
  <g transform="translate(360, 200)" filter="url(#fShadow)">
    <rect width="230" height="130" rx="12" fill="#1E293B" stroke="#0284C7" stroke-width="2"/>
    <rect width="230" height="32" rx="12" fill="#0284C7"/>
    <text x="115" y="21" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">2. GÜNLÜK MAR ÇİZELGESİ</text>
    <text x="115" y="60" text-anchor="middle" font-size="11.5" fill="#E2E8F0">Sistem Otomatik Oluşturur</text>
    <text x="115" y="80" text-anchor="middle" font-size="11" fill="#7DD3FC">Durum: "Bekliyor / Planlandı"</text>
    <text x="115" y="100" text-anchor="middle" font-size="11" fill="#94A3B8">Klinik Oda &amp; Yatak Sıralı</text>
  </g>

  <!-- Ok 2 -> 3 -->
  <line x1="590" y1="265" x2="650" y2="265" stroke="#94A3B8" stroke-width="2.5"/>
  <polygon points="650,265 640,260 640,270" fill="#94A3B8"/>

  <!-- 3. Adım: Hemşire Uygulaması & Karar -->
  <g transform="translate(650, 200)" filter="url(#fShadow)">
    <rect width="240" height="130" rx="12" fill="#1E293B" stroke="#F59E0B" stroke-width="2"/>
    <rect width="240" height="32" rx="12" fill="#D97706"/>
    <text x="120" y="21" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">3. HEMŞİRE UYGULAMA AN</text>
    <text x="120" y="60" text-anchor="middle" font-size="11.5" fill="#E2E8F0">Hasta Kimlik Doğrulama</text>
    <text x="120" y="80" text-anchor="middle" font-size="11" fill="#FDE68A">İlaç &amp; Dozaj Eşleşmesi</text>
    <text x="120" y="102" text-anchor="middle" font-size="11" font-weight="bold" fill="#FBBF24">Tek Tıkla Durum Güncelleme</text>
  </g>

  <!-- 3 Karar Dalı (Yeşil, Kırmızı, Sarı) -->
  <!-- Dal 1: Uygulandı -->
  <path d="M 890,240 L 980,140" stroke="#10B981" stroke-width="2.5" fill="none"/>
  <polygon points="980,140 970,140 975,148" fill="#10B981"/>

  <g transform="translate(980, 90)" filter="url(#fShadow)">
    <rect width="260" height="100" rx="10" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
    <text x="130" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#6EE7B7">✓ DURUM: UYGULANDI</text>
    <text x="130" y="52" text-anchor="middle" font-size="11" fill="#D1FAE5">• Otomatik Stok Düşümü (Stok - 1)</text>
    <text x="130" y="70" text-anchor="middle" font-size="11" fill="#D1FAE5">• Uygulayan Personel &amp; Saat Logu</text>
    <text x="130" y="88" text-anchor="middle" font-size="10.5" fill="#A7F3D0">• Yeşil Renk Kodu ve Tamamlandı İkonu</text>
  </g>

  <!-- Dal 2: Hasta Reddetti -->
  <line x1="890" y1="265" x2="980" y2="265" stroke="#EF4444" stroke-width="2.5"/>
  <polygon points="980,265 970,260 970,270" fill="#EF4444"/>

  <g transform="translate(980, 215)" filter="url(#fShadow)">
    <rect width="260" height="100" rx="10" fill="#881337" stroke="#EF4444" stroke-width="2"/>
    <text x="130" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FCA5A5">✕ DURUM: HASTA REDDETTİ</text>
    <text x="130" y="52" text-anchor="middle" font-size="11" fill="#FECDD3">• Zorunlu Ret Nedeni Açıklaması</text>
    <text x="130" y="70" text-anchor="middle" font-size="11" fill="#FECDD3">• Stok Düşmez, İlaç Karantinaya Alınır</text>
    <text x="130" y="88" text-anchor="middle" font-size="10.5" fill="#F87171">• Hekime Sistem Bildirimi Fırlatılır</text>
  </g>

  <!-- Dal 3: Ertelendi / Uyuyor -->
  <path d="M 890,290 L 980,390" stroke="#F59E0B" stroke-width="2.5" fill="none"/>
  <polygon points="980,390 975,382 970,390" fill="#F59E0B"/>

  <g transform="translate(980, 340)" filter="url(#fShadow)">
    <rect width="260" height="100" rx="10" fill="#78350F" stroke="#F59E0B" stroke-width="2"/>
    <text x="130" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FDE68A">⏸ DURUM: ERTELENDİ</text>
    <text x="130" y="52" text-anchor="middle" font-size="11" fill="#FEF3C7">• Geçici Neden (Örn: Hasta Uyuyor)</text>
    <text x="130" y="70" text-anchor="middle" font-size="11" fill="#FEF3C7">• Bir Sonraki Tura Hatırlatıcı Bırakılır</text>
    <text x="130" y="88" text-anchor="middle" font-size="10.5" fill="#FCD34D">• Sarı Rozet ve Bekleyen İlaç Sayacı</text>
  </g>

  <!-- Alt Panel: Güvenlik ve Doğruluk Garantileri -->
  <g transform="translate(100, 500)" filter="url(#fShadow)">
    <rect width="1100" height="170" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
    <text x="550" y="32" text-anchor="middle" font-size="14" font-weight="bold" fill="#38BDF8">MEDİCORE MAR SİSTEMİNİN SAĞLADIĞI KLİNİK GÜVENCELER</text>

    <g transform="translate(50, 60)" font-size="11.5" fill="#CBD5E1">
      <text y="0" font-weight="bold" fill="#FFFFFF">1. Mükerrer İlaç Engeli:</text>
      <text y="20" fill="#94A3B8">Bir öğünde uygulanmış ilaç tekrar işaretlenemez; mükerrer doz riski sıfırlanır.</text>

      <text y="50" font-weight="bold" fill="#FFFFFF">2. Kritik Stok Otomasyonu:</text>
      <text y="70" fill="#94A3B8">İlaç uygulandığında stok kritik eşiğe düşerse sistem otomatik ikaz üretir.</text>
    </g>

    <g transform="translate(600, 60)" font-size="11.5" fill="#CBD5E1">
      <text y="0" font-weight="bold" fill="#FFFFFF">3. Şeffaf Denetim İzi (Audit Trail):</text>
      <text y="20" fill="#94A3B8">Her ilaç hareketi hemşirenin kullanıcı adı ve zaman damgası ile loglanır.</text>

      <text y="50" font-weight="bold" fill="#FFFFFF">4. Hafif ve Kesintisiz Arayüz:</text>
      <text y="70" fill="#94A3B8">Ağır kütüphaneler yerine saf CSS grid ile servis genelinde hızlı navigasyon.</text>
    </g>
  </g>
</svg>`;

// ── 5. ROL TABANLI ERİŞİM MATRİSİ (RBAC) ──────────────────────────────────────
const svgRBAC = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1300" height="780" viewBox="0 0 1300 780" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="rbacBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080E18"/>
      <stop offset="100%" stop-color="#121D2C"/>
    </linearGradient>
    <filter id="rShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="1300" height="780" fill="url(#rbacBg)"/>

  <!-- Başlık -->
  <g transform="translate(650, 45)" text-anchor="middle">
    <text font-size="24" font-weight="900" fill="#FFFFFF">ROL TABANLI YETKİLENDİRME MATRİSİ (RBAC)</text>
    <text y="24" font-size="13.5" font-weight="600" fill="#38BDF8">Kullanıcı Rollerine Göre Modül İzinleri ve İşlem Yetkileri</text>
  </g>

  <!-- TABLO GÖVDESİ -->
  <g transform="translate(100, 110)" filter="url(#rShadow)">
    <!-- Başlık Satırı -->
    <rect width="1100" height="50" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <text x="220" y="30" font-size="13" font-weight="bold" fill="#94A3B8">SİSTEM MODÜLÜ / İŞLEM</text>
    <text x="520" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#F59E0B">👑 BAŞHEKİM / ADMİN</text>
    <text x="710" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#8B5CF6">🩺 KURUM HEKİMİ</text>
    <text x="890" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#38BDF8">💉 BAŞHEMŞİRE / HEMŞİRE</text>
    <text x="1030" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#64748B">👁️ İDARİ İZLEYİCİ</text>

    <!-- Satırlar -->
    <!-- 1. Hasta Kabul / Kayıt -->
    <g transform="translate(0, 50)">
      <rect width="1100" height="42" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Hasta Kabul, Düzenleme ve Taburcu</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#38BDF8">Görüntüleme</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
    </g>

    <!-- 2. Hekim Muayene & Vizite -->
    <g transform="translate(0, 92)">
      <rect width="1100" height="42" fill="#141E33" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Muayene, Tanı (ICD-10) ve İlaç Reçeteleme</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
    </g>

    <!-- 3. Toplu Vital Girişi & Alarm Sınama -->
    <g transform="translate(0, 134)">
      <rect width="1100" height="42" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Toplu Vital Girişi &amp; Kritik Alarm İletimi</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#38BDF8">İzleme &amp; Alarm</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#38BDF8">İzleme &amp; Alarm</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
    </g>

    <!-- 4. İlaç Dağıtımı (MAR) -->
    <g transform="translate(0, 176)">
      <rect width="1100" height="42" fill="#141E33" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Saatlik İlaç Dağıtımı (Uygulandı / Red / Ertele)</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#38BDF8">İzleme &amp; Onay</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
    </g>

    <!-- 5. Hastane Sevk & 112 -->
    <g transform="translate(0, 218)">
      <rect width="1100" height="42" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Hastane Dış Sevk, Refakatçi &amp; Ambulans Takibi</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">Sevk Başlat</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">Refakatçi İşle</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
    </g>

    <!-- 6. Vardiya Takvimi & Nöbetler -->
    <g transform="translate(0, 260)">
      <rect width="1100" height="42" fill="#141E33" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Aylık Personel Nöbet Çizelgesi &amp; Vardiya Planı</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#64748B">Kendi Nöbeti</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">Başhemşire: Düzenler</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#64748B">Salt Okunur</text>
    </g>

    <!-- 7. Personel İK & Kullanıcı Hesapları -->
    <g transform="translate(0, 302)">
      <rect width="1100" height="42" fill="#0F172A" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">Kullanıcı Yönetimi, Şifre Değişimi &amp; Kadro</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
    </g>

    <!-- 8. Sistem Denetim İzi (Audit Logları) -->
    <g transform="translate(0, 344)">
      <rect width="1100" height="42" fill="#141E33" stroke="#1E293B" stroke-width="1"/>
      <text x="30" y="26" font-size="12" font-weight="bold" fill="#F8FAFC">KVKK Denetim İzi &amp; Güvenlik Logları İnceleme</text>
      <text x="520" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">TAM YETKİ</text>
      <text x="710" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
      <text x="890" y="26" text-anchor="middle" font-size="13" fill="#EF4444">Yetkisiz</text>
      <text x="1030" y="26" text-anchor="middle" font-size="13" fill="#10B981" font-weight="bold">Görüntüleme</text>
    </g>
  </g>

  <!-- Alt Bilgi Notu -->
  <g transform="translate(100, 560)">
    <rect width="1100" height="90" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
    <text x="550" y="30" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#38BDF8">GÜVENLİK ALTYAPISI: ENTEGRE JWT VE DECORATOR POLİTİKASI</text>
    <text x="550" y="52" text-anchor="middle" font-size="11.5" fill="#CBD5E1">Frontend katmanında menüler rol bazlı gizlenirken, asıl güvenlik Backend ASP.NET Core API üzerinde [Authorize(Roles = "...")]</text>
    <text x="550" y="72" text-anchor="middle" font-size="11.5" fill="#94A3B8">öznitelikleri ve JWT Claim kontrolleriyle uçtan uca güvence altına alınmıştır. İstemci tarafı manipülasyonları API seviyesinde 403 Forbidden ile engellenir.</text>
  </g>
</svg>`;

// Dosyaları Diske Yaz
fs.writeFileSync(path.join(OUT_DIR, '01_sistem_mimarisi.svg'), svgMimarisi, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, '02_veritabani_er_diyagrami.svg'), svgERD, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, '03_signalr_kritik_alarm_akisi.svg'), svgSignalR, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, '04_ilac_dagitim_mar_dongusu.svg'), svgMAR, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, '05_rbac_yetki_matrisi.svg'), svgRBAC, 'utf-8');

console.log("✅ 5 Adet Teknik SVG Diyagramı başarıyla oluşturuldu!");
