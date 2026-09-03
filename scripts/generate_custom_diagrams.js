const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'diyagramlar');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 1. SİSTEM MİMARİSİ: İSTEK-YANIT VE SIGNALR AKIŞ ŞEMASI ────────────────────
const svgSistemAkis = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1500" height="920" viewBox="0 0 1500 920" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="bgAkis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070B14"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#38BDF8"/>
    </marker>
    <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#10B981"/>
    </marker>
    <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#F43F5E"/>
    </marker>
    <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="7" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#F59E0B"/>
    </marker>
  </defs>

  <!-- Arka Plan -->
  <rect width="1500" height="920" fill="url(#bgAkis)"/>

  <!-- Başlık -->
  <g transform="translate(750, 50)" text-anchor="middle">
    <text font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">MEDICORE UÇTAN UCA SİSTEM MİMARİSİ VE AKIŞ ŞEMASI</text>
    <text y="28" font-size="14" font-weight="600" fill="#38BDF8">HTTP REST API İsteği &gt; EF Core &gt; SQLite (WAL) &gt; SignalR WebSocket Geri Dönüş Döngüsü</text>
  </g>

  <!-- KATMAN 1: KULLANICI & REACT FRONTEND -->
  <g transform="translate(70, 120)" filter="url(#shadow)">
    <rect width="330" height="690" rx="16" fill="url(#cardGrad)" stroke="#38BDF8" stroke-width="2"/>
    <rect width="330" height="48" rx="16" fill="#0284C7"/>
    <text x="165" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#FFFFFF">1. İSTEMCİ (REACT 19 SPA)</text>

    <!-- Kullanıcı Aksiyonu Kutusu -->
    <g transform="translate(20, 68)">
      <rect width="290" height="115" rx="10" fill="#1E293B" stroke="#0284C7" stroke-width="1.5"/>
      <text x="145" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#F8FAFC">👤 Sağlık Personeli / Hekim</text>
      <text x="15" y="52" font-size="11.5" fill="#CBD5E1">• Hasta Kaydı / Muayene Girişi</text>
      <text x="15" y="72" font-size="11.5" fill="#CBD5E1">• Toplu Vital: Nabız: 140 bpm, Ateş: 39°C</text>
      <text x="15" y="94" font-size="11.5" fill="#38BDF8">• Saatlik İlaç Uygulaması (MAR)</text>
    </g>

    <!-- Native Fetch İstemcisi -->
    <g transform="translate(20, 205)">
      <rect width="290" height="110" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5"/>
      <text x="145" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#F8FAFC">🌐 Native Fetch API Client</text>
      <text x="15" y="52" font-size="11" fill="#94A3B8">• Authorization: Bearer &lt;JWT Token&gt;</text>
      <text x="15" y="72" font-size="11" fill="#94A3B8">• Content-Type: application/json</text>
      <text x="15" y="92" font-size="11" fill="#7DD3FC">• JSON Payload Serileştirme</text>
    </g>

    <!-- SignalR İstemci Dinleyicisi -->
    <g transform="translate(20, 335)">
      <rect width="290" height="140" rx="10" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2"/>
      <text x="145" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">📡 SignalR WebSocket Client</text>
      <text x="15" y="54" font-size="11.5" fill="#BAE6FD">connection.on("ReceiveNotification")</text>
      <text x="15" y="76" font-size="11" fill="#E0F2FE">✓ withAutomaticReconnect() devrede</text>
      <text x="15" y="98" font-size="11" fill="#E0F2FE">✓ Dinamik Yönlendirme (/toplu-vital)</text>
      <text x="15" y="120" font-size="11" fill="#FDE047">✓ Aktif Alarm Sayacı +1 artırılır</text>
    </g>

    <!-- Web Audio API ve Görsel Alarm -->
    <g transform="translate(20, 495)">
      <rect width="290" height="155" rx="10" fill="#881337" stroke="#F43F5E" stroke-width="2"/>
      <text x="145" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">🔊 Web Audio API + Toast UI</text>
      <text x="15" y="54" font-size="11.5" fill="#FECDD3">• Yerleşik AudioContext Osilatörü</text>
      <text x="15" y="74" font-size="11.5" fill="#FECDD3">• 3 Kademeli Sawtooth Wave (880Hz)</text>
      <text x="15" y="94" font-size="11.5" fill="#FFFFFF" font-weight="bold">• Sıfır Dosya Bağımlılığı, Kesintisiz Ses</text>
      <text x="15" y="118" font-size="11" fill="#FFE4E6">• Kırmızı Renkli Toast Alarm Uyarısı</text>
      <text x="15" y="138" font-size="11" fill="#FFE4E6">• Ekranda Anlık Tablo Güncellemesi</text>
    </g>
  </g>

  <!-- KATMAN 2: .NET 9 REST WEB API -->
  <g transform="translate(560, 120)" filter="url(#shadow)">
    <rect width="380" height="690" rx="16" fill="url(#cardGrad)" stroke="#3B82F6" stroke-width="2"/>
    <rect width="380" height="48" rx="16" fill="#1D4ED8"/>
    <text x="190" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#FFFFFF">2. BACKEND API (.NET 9 C#)</text>

    <!-- 1. Pipeline & Auth -->
    <g transform="translate(20, 68)">
      <rect width="340" height="95" rx="10" fill="#1E293B" stroke="#3B82F6" stroke-width="1.5"/>
      <text x="170" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#93C5FD">JWT Kimlik &amp; Yetki Doğrulama</text>
      <text x="15" y="48" font-size="11" fill="#CBD5E1">• [Authorize(Roles = "Bashekim,Hemsire...")]</text>
      <text x="15" y="68" font-size="11" fill="#CBD5E1">• Token Süresi &amp; İmza Denetimi</text>
      <text x="15" y="86" font-size="11" fill="#93C5FD">• ValidationHelpers: Güvenli Girdi Kontrolü</text>
    </g>

    <!-- 2. Controller & İş Mantığı -->
    <g transform="translate(20, 180)">
      <rect width="340" height="135" rx="10" fill="#1E293B" stroke="#059669" stroke-width="1.5"/>
      <text x="170" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#6EE7B7">REST Controller &amp; Servis Katmanı</text>
      <text x="15" y="50" font-size="11" fill="#E2E8F0">📌 VitalBulguController / HastaController</text>
      <text x="15" y="70" font-size="11.5" font-weight="bold" fill="#F43F5E">⚙️ VitalEvaluator.Evaluate()</text>
      <text x="25" y="90" font-size="10.5" fill="#FECDD3">Eşik Kontrolü: Nabız &gt; 120 veya Ateş &gt; 38.5</text>
      <text x="15" y="112" font-size="11" fill="#CBD5E1">🛡️ AuditLogger: KVKK Denetim İzi Hazırlama</text>
    </g>

    <!-- 3. EF Core ORM Katmanı -->
    <g transform="translate(20, 335)">
      <rect width="340" height="110" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="170" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#34D399">Entity Framework Core 9.0 (ORM)</text>
      <text x="15" y="50" font-size="11" fill="#CBD5E1">• AppDbContext.VitalBulgular.AddAsync(v)</text>
      <text x="15" y="70" font-size="11" fill="#CBD5E1">• await _context.SaveChangesAsync()</text>
      <text x="15" y="92" font-size="11" fill="#6EE7B7">• LINQ İfadeleri ve Asenkron Veri Dönüşümü</text>
    </g>

    <!-- 4. SignalR Hub Sunucusu -->
    <g transform="translate(20, 465)">
      <rect width="340" height="185" rx="10" fill="#0C4A6E" stroke="#38BDF8" stroke-width="2"/>
      <text x="170" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">📡 KlinikHub (SignalR Gateway)</text>
      <text x="15" y="54" font-size="11.5" fill="#BAE6FD">Kritik Alarm Algılandığında Tetiklenir:</text>
      <text x="15" y="78" font-size="11" fill="#FFFFFF" font-family="monospace">await _hubContext.Clients.All.SendAsync(</text>
      <text x="25" y="98" font-size="11" fill="#FDE047" font-family="monospace">"ReceiveNotification",</text>
      <text x="25" y="118" font-size="11" fill="#FDE047" font-family="monospace">"KRİTİK ALARM: Ayşe Çetin",</text>
      <text x="25" y="138" font-size="11" fill="#FDE047" font-family="monospace">"Nabız: 140 bpm | Oda: 101", "alert");</text>
      <text x="15" y="165" font-size="11" fill="#BAE6FD">Tüm Nöbetçi İstemcilere &lt; 20ms'de Yayın Yapılır</text>
    </g>
  </g>

  <!-- KATMAN 3: SQLITE VERİTABANI (WAL MODU) -->
  <g transform="translate(1110, 120)" filter="url(#shadow)">
    <rect width="320" height="690" rx="16" fill="url(#cardGrad)" stroke="#10B981" stroke-width="2"/>
    <rect width="320" height="48" rx="16" fill="#064E3B"/>
    <text x="160" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#6EE7B7">3. VERİTABANI (SQLITE WAL)</text>

    <g transform="translate(20, 68)">
      <rect width="280" height="150" rx="10" fill="#064E3B" stroke="#34D399" stroke-width="1.5"/>
      <text x="140" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">medicore.db (Fiziki Dosya)</text>
      <text x="15" y="52" font-size="11" fill="#D1FAE5">• medicore.db (Ana Veritabanı)</text>
      <text x="15" y="74" font-size="11" fill="#D1FAE5">• medicore.db-wal (Yazma Günlüğü)</text>
      <text x="15" y="96" font-size="11" fill="#D1FAE5">• medicore.db-shm (Paylaşımlı Bellek)</text>
      <text x="15" y="125" font-size="11" font-weight="bold" fill="#6EE7B7">✓ WAL Sayesinde Okuma/Yazma Paralel</text>
    </g>

    <g transform="translate(20, 240)">
      <rect width="280" height="300" rx="10" fill="#022C22" stroke="#059669" stroke-width="1.5"/>
      <text x="140" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#A7F3D0">İlişkisel Tablolara Yazım</text>
      <g transform="translate(15, 52)" font-size="11" fill="#ECFDF5">
        <text y="0">INSERT INTO VitalBulgular ...</text>
        <text y="24">INSERT INTO AktiviteLoglari ...</text>
        <text y="48">UPDATE Ilaclar SET Stok = Stok - 1</text>
        <text y="72">UPDATE Hastalar SET Durum = '...'</text>
        <text y="105" font-weight="bold" fill="#34D399">Bütünlük &amp; Kısıtlamalar:</text>
        <text y="130">• PRIMARY KEY (Id AutoInc)</text>
        <text y="152">• FOREIGN KEY (HastaId Cascade)</text>
        <text y="174">• ACID Transaction Garantisi</text>
        <text y="200" fill="#FDE047">Sorgu Yanıt Süresi: ~2.4 ms</text>
      </g>
    </g>

    <g transform="translate(20, 560)">
      <rect width="280" height="90" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1"/>
      <text x="140" y="26" text-anchor="middle" font-size="12" font-weight="bold" fill="#94A3B8">Kilitlenmesiz Mimari</text>
      <text x="140" y="48" text-anchor="middle" font-size="10.5" fill="#CBD5E1">SQLite "Database Locked" sorunu</text>
      <text x="140" y="68" text-anchor="middle" font-size="10.5" fill="#34D399">WAL Modu ile tamamen aşılmıştır.</text>
    </g>
  </g>

  <!-- AKIŞ OKLARI VE NUMARALARI -->
  <!-- 1. Adım: React -> API (Mavi Ok) -->
  <path d="M 400,240 L 560,240" stroke="#38BDF8" stroke-width="4" fill="none" marker-end="url(#arrowBlue)"/>
  <rect x="420" y="210" width="120" height="24" rx="4" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1"/>
  <text x="480" y="226" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1. HTTP POST (REST)</text>

  <!-- 2. Adım: API -> SQLite (Yeşil Ok) -->
  <path d="M 940,390 L 1110,390" stroke="#10B981" stroke-width="4" fill="none" marker-end="url(#arrowGreen)"/>
  <rect x="965" y="360" width="120" height="24" rx="4" fill="#064E3B" stroke="#10B981" stroke-width="1"/>
  <text x="1025" y="376" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">2. EF Core SaveChanges</text>

  <!-- 3. Adım: SQLite -> API Onay (Turuncu Ok) -->
  <path d="M 1110,430 L 940,430" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,4" fill="none" marker-end="url(#arrowOrange)"/>
  <rect x="965" y="440" width="120" height="22" rx="4" fill="#78350F" stroke="#F59E0B" stroke-width="1"/>
  <text x="1025" y="455" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#FFFFFF">3. SQL Commit (2.4ms)</text>

  <!-- 4. Adım: API -> SignalR Hub Tetikleme -->
  <path d="M 750,315 L 750,465" stroke="#F43F5E" stroke-width="3" fill="none" marker-end="url(#arrowRed)"/>
  <text x="760" y="390" font-size="11" font-weight="bold" fill="#FDA4AF">4. Alarm Algılandı</text>

  <!-- 5. Adım: SignalR Hub -> React Client (WebSocket Geri Dönüş) -->
  <path d="M 560,560 L 400,560" stroke="#38BDF8" stroke-width="4" fill="none" marker-end="url(#arrowBlue)"/>
  <rect x="420" y="530" width="120" height="24" rx="4" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1"/>
  <text x="480" y="546" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">5. WebSocket Yayını</text>

  <!-- Alt Bilgi Bandı -->
  <g transform="translate(750, 860)" text-anchor="middle" font-size="12" fill="#64748B">
    <text>T.C. Cumhurbaşkanlığı İletişim Başkanlığı Staj Programı | Geliştirici: Ahmet Taha EROL | MediCore Sistem Akışı</text>
  </g>
</svg>`;

// ── 2. VERİTABANI İLİŞKİLERİ: HASTA, HEKİM, İLAÇ VE VİZİTE (1:N ve M:N) ────────
const svgVeritabaniHaritasi = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1550" height="950" viewBox="0 0 1550 950" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="dbBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090E17"/>
      <stop offset="100%" stop-color="#111B2B"/>
    </linearGradient>
    <filter id="cShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect width="1550" height="950" fill="url(#dbBg)"/>

  <!-- Başlık -->
  <g transform="translate(775, 45)" text-anchor="middle">
    <text font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">MEDICORE ANA VERİTABANI İLİŞKİLERİ VE KARDİNALİTE HARİTASI</text>
    <text y="28" font-size="14" font-weight="600" fill="#94A3B8">Hasta, Hekim, İlaç ve Vizite Tabloları Arasındaki Bire-Çok (1:N) ve Çoka-Çok (M:N) İlişki Ağı</text>
  </g>

  <!-- 1. DOKTORLAR TABLOSU -->
  <g transform="translate(80, 120)" filter="url(#cShadow)">
    <rect width="280" height="230" rx="10" fill="#1E293B" stroke="#8B5CF6" stroke-width="2"/>
    <rect width="280" height="38" rx="10" fill="#6D28D9"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">👨‍⚕️ DOKTORLAR</text>
    <g transform="translate(15, 56)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="22">Ad : string (50)</text>
      <text y="44">Soyad : string (50)</text>
      <text y="66">Brans : string (Geriatri/Dahiliye)</text>
      <text y="88">Telefon : string</text>
      <text y="110">EPosta : string</text>
      <text y="132">KullaniciId : int</text>
      <text y="154">Aktif : bool</text>
    </g>
  </g>

  <!-- 2. HASTALAR TABLOSU (MERKEZ) -->
  <g transform="translate(635, 120)" filter="url(#cShadow)">
    <rect width="280" height="250" rx="10" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
    <rect width="280" height="38" rx="10" fill="#0284C7"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">📁 HASTALAR (Merkez Varlık)</text>
    <g transform="translate(15, 56)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="22">HastaNo : string (H-2026-001)</text>
      <text y="44">TcKimlikNo : string (11)</text>
      <text y="66">Ad, Soyad : string</text>
      <text y="88">DogumTarihi, Cinsiyet</text>
      <text y="110">OdaNo, YatakNo : string</text>
      <text y="132">Hastalik, AlerjiBilgisi</text>
      <text y="154">GirisTarihi : DateTime</text>
      <text y="174" fill="#38BDF8">Durum : Aktif / Hastanede</text>
    </g>
  </g>

  <!-- 3. İLAÇLAR TABLOSU -->
  <g transform="translate(1190, 120)" filter="url(#cShadow)">
    <rect width="280" height="230" rx="10" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
    <rect width="280" height="38" rx="10" fill="#047857"/>
    <text x="140" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">💊 İLAÇLAR (Katalog)</text>
    <g transform="translate(15, 56)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="22">Barkod : string (EAN-13)</text>
      <text y="44">Ad : string (Parol 500mg...)</text>
      <text y="66">EtkenMadde : string</text>
      <text y="88">Form : string (Tablet/Ampul)</text>
      <text y="110">UreticiFirma : string</text>
      <text y="132">KritikStokSeviyesi : int</text>
    </g>
  </g>

  <!-- 4. HEKİM MUAYENELERİ (VİZİTE & TANI) -->
  <g transform="translate(280, 480)" filter="url(#cShadow)">
    <rect width="320" height="230" rx="10" fill="#1E293B" stroke="#A855F7" stroke-width="2"/>
    <rect width="320" height="38" rx="10" fill="#7E22CE"/>
    <text x="160" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">🩺 HEKİM_MUAYENELERİ (Vizite)</text>
    <g transform="translate(15, 56)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="22" fill="#38BDF8">🏷️ FK HastaId : int (Hastalar)</text>
      <text y="44" fill="#A855F7">🏷️ FK DoktorId : int (Doktorlar)</text>
      <text y="66">DoktorAd : string</text>
      <text y="88">MuayeneTarihi : DateTime</text>
      <text y="110">ICD10Kodu, Tani : string</text>
      <text y="132">Sikayet, KlinikBulgular</text>
      <text y="154">TedaviPlani, Durum</text>
    </g>
  </g>

  <!-- 5. HASTA İLAÇLARI (REÇETE - KÖPRÜ TABLOSU M:N) -->
  <g transform="translate(950, 480)" filter="url(#cShadow)">
    <rect width="320" height="230" rx="10" fill="#1E293B" stroke="#F59E0B" stroke-width="2.5"/>
    <rect width="320" height="38" rx="10" fill="#D97706"/>
    <text x="160" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#FFFFFF">📋 HASTA_İLAÇLARI (Reçete / M:N)</text>
    <g transform="translate(15, 56)" font-size="11.5" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="22" fill="#38BDF8">🏷️ FK HastaId : int (Hastalar)</text>
      <text y="44" fill="#10B981">🏷️ FK IlacId : int (Ilaclar)</text>
      <text y="66">Doz : string, Form : string</text>
      <text y="88">Sabah, Ogle, Aksam, Gece : bool</text>
      <text y="110">BaslangicTarihi : DateTime</text>
      <text y="132">BitisTarihi : DateTime?</text>
      <text y="154">KullanimTalimati : string</text>
    </g>
  </g>

  <!-- 6. İLAÇ UYGULAMALARI (MAR DAĞITIM) -->
  <g transform="translate(950, 770)" filter="url(#cShadow)">
    <rect width="320" height="140" rx="10" fill="#1E293B" stroke="#059669" stroke-width="2"/>
    <rect width="320" height="32" rx="10" fill="#059669"/>
    <text x="160" y="21" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">⏰ İLAÇ_UYGULAMALARI (MAR)</text>
    <g transform="translate(15, 48)" font-size="11" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FBBF24">🔑 PK Id : int</text>
      <text y="18" fill="#F59E0B">🏷️ FK HastaIlacId : int</text>
      <text y="36">Ogun : Sabah/Öğle/Akşam/Gece</text>
      <text y="54">Durum : Uygulandı / Reddet / Ertele</text>
      <text y="72">IslemZamani : DateTime</text>
    </g>
  </g>

  <!-- 7. VİTAL BULGULAR (1:N) -->
  <g transform="translate(80, 480)" filter="url(#cShadow)">
    <rect width="180" height="230" rx="10" fill="#1E293B" stroke="#E11D48" stroke-width="2"/>
    <rect width="180" height="38" rx="10" fill="#BE123C"/>
    <text x="90" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="#FFFFFF">💓 VİTAL BULGULAR</text>
    <g transform="translate(15, 56)" font-size="11" fill="#E2E8F0" font-family="monospace">
      <text y="0" font-weight="bold" fill="#FDA4AF">🔑 PK Id</text>
      <text y="22" fill="#38BDF8">🏷️ FK HastaId</text>
      <text y="44">NabizBPM</text>
      <text y="66">TansiyonSistol</text>
      <text y="88">TansiyonDiyastol</text>
      <text y="110">AtesC (°C)</text>
      <text y="132">Saturasyon SpO2</text>
      <text y="154">Tarih : DateTime</text>
    </g>
  </g>

  <!-- İLİŞKİ VE KARDİNALİTE HATLARI -->
  <!-- Doktor -> HekimMuayene (1:N) -->
  <path d="M 220,350 L 220,440 L 360,440 L 360,480" stroke="#8B5CF6" stroke-width="3" fill="none"/>
  <rect x="230" y="380" width="80" height="24" rx="4" fill="#6D28D9"/>
  <text x="270" y="396" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- Hasta -> HekimMuayene (1:N) -->
  <path d="M 700,370 L 700,440 L 520,440 L 520,480" stroke="#38BDF8" stroke-width="3" fill="none"/>
  <rect x="580" y="415" width="80" height="24" rx="4" fill="#0284C7"/>
  <text x="620" y="431" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- M:N İLİŞKİSİ: HASTALAR <-> İLAÇLAR (HastaIlaclari Köprüsü) -->
  <!-- Hasta -> HastaIlac (1:N) -->
  <path d="M 850,370 L 850,440 L 1020,440 L 1020,480" stroke="#38BDF8" stroke-width="3" fill="none"/>
  <rect x="880" y="415" width="80" height="24" rx="4" fill="#0284C7"/>
  <text x="920" y="431" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- Ilac -> HastaIlac (1:N) -->
  <path d="M 1330,350 L 1330,440 L 1200,440 L 1200,480" stroke="#10B981" stroke-width="3" fill="none"/>
  <rect x="1240" y="390" width="80" height="24" rx="4" fill="#047857"/>
  <text x="1280" y="406" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- M:N Vurgu Kutusu -->
  <g transform="translate(940, 435)">
    <rect width="340" height="30" rx="6" fill="#78350F" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="170" y="20" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#FDE68A">
      ★ ÇOKA-ÇOK (M:N) İLİŞKİ KÖPRÜSÜ (HASTA &lt;&gt; İLAÇ)
    </text>
  </g>

  <!-- Hasta -> VitalBulgu (1:N) -->
  <path d="M 635,260 L 170,260 L 170,480" stroke="#E11D48" stroke-width="3" fill="none"/>
  <rect x="340" y="248" width="80" height="24" rx="4" fill="#BE123C"/>
  <text x="380" y="264" text-anchor="middle" font-size="11" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- HastaIlac -> IlacUygulama (1:N) -->
  <line x1="1110" y1="710" x2="1110" y2="770" stroke="#059669" stroke-width="3"/>
  <rect x="1120" y="730" width="60" height="22" rx="4" fill="#059669"/>
  <text x="1150" y="745" text-anchor="middle" font-size="10" font-weight="bold" fill="#FFFFFF">1 : N</text>

  <!-- Alt Açıklama -->
  <g transform="translate(775, 915)" text-anchor="middle" font-size="12" fill="#64748B">
    <text>MediCore EF Core 9.0 İlişkisel Varlık Bütünlüğü | ON DELETE CASCADE | Eşzamanlılık Korumalı Veri Modeli</text>
  </g>
</svg>`;

// ── 3. RBAC HİYERARŞİSİ: ROL VE MODÜL AĞAÇ (TREE) ŞEMASI ──────────────────────
const svgRBACTree = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1550" height="960" viewBox="0 0 1550 960" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif">
  <defs>
    <linearGradient id="treeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070D18"/>
      <stop offset="100%" stop-color="#0E192D"/>
    </linearGradient>
    <filter id="tShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <rect width="1550" height="960" fill="url(#treeBg)"/>

  <!-- Başlık -->
  <g transform="translate(775, 45)" text-anchor="middle">
    <text font-size="26" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">MEDICORE ROL TABANLI ERİŞİM (RBAC) HİYERARŞİ AĞACI</text>
    <text y="28" font-size="14" font-weight="600" fill="#38BDF8">Başhekim, Kurum Hekimi ve Hemşire Rollerinin İzin ve Modül Dağılımı</text>
  </g>

  <!-- KÖK DÜĞÜM (ROOT NODE): MEDICORE GÜVENLİK ALTYAPISI -->
  <g transform="translate(600, 110)" filter="url(#tShadow)">
    <rect width="350" height="75" rx="14" fill="#1E293B" stroke="#38BDF8" stroke-width="2.5"/>
    <text x="175" y="32" text-anchor="middle" font-size="16" font-weight="900" fill="#FFFFFF">🛡️ MEDICORE GÜVENLİK SİSTEMİ</text>
    <text x="175" y="54" text-anchor="middle" font-size="12" font-weight="bold" fill="#7DD3FC">JWT Bearer Token + [Authorize(Roles = "...")]</text>
  </g>

  <!-- KÖKTEN ROLLERE GİDEN DALLAR -->
  <!-- Sol Dal: Başhekim -->
  <path d="M 680,185 L 680,240 L 250,240 L 250,280" stroke="#F59E0B" stroke-width="3" fill="none"/>
  <!-- Orta Dal: Kurum Hekimi -->
  <path d="M 775,185 L 775,280" stroke="#8B5CF6" stroke-width="3" fill="none"/>
  <!-- Sağ Dal: Başhemşire & Hemşire -->
  <path d="M 870,185 L 870,240 L 1300,240 L 1300,280" stroke="#10B981" stroke-width="3" fill="none"/>

  <!-- ── 1. ROL: BAŞHEKİM / ADMİN (SOL DAL) ── -->
  <g transform="translate(75, 280)" filter="url(#tShadow)">
    <rect width="350" height="90" rx="12" fill="#78350F" stroke="#F59E0B" stroke-width="2.5"/>
    <text x="175" y="34" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFFFFF">👑 BAŞHEKİM / YÖNETİCİ</text>
    <text x="175" y="56" text-anchor="middle" font-size="12" fill="#FDE68A">Sistemdeki En Yüksek Yetki Seviyesi</text>
    <text x="175" y="74" text-anchor="middle" font-size="11" fill="#FEF3C7">Rol Kodu: 'Bashekim' / 'Admin'</text>
  </g>

  <!-- Başhekim Modül Dalları (Tree Leaves) -->
  <g transform="translate(75, 410)" filter="url(#tShadow)">
    <!-- Çizgiler -->
    <line x1="175" y1="-40" x2="175" y2="440" stroke="#F59E0B" stroke-width="2" stroke-dasharray="4,4"/>

    <!-- 1.1 -->
    <g transform="translate(0, 0)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📊 Yönetici Dashboard &amp; İstatistikler</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 1.2 -->
    <g transform="translate(0, 65)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">👥 Personel &amp; Kadro Yönetimi (İK)</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 1.3 -->
    <g transform="translate(0, 130)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">🛡️ KVKK Aktivite Geçmişi (Audit Log)</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">ÖZEL YETKİ</text>
    </g>

    <!-- 1.4 -->
    <g transform="translate(0, 195)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📅 Aylık Nöbet Çizelgesi Onayı</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 1.5 -->
    <g transform="translate(0, 260)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📢 Kurum Geneli Acil Duyuru Yayını</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 1.6 -->
    <g transform="translate(0, 325)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">🩺 Klinik &amp; Bakım Sakinleri İzleme</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">İZLEME</text>
    </g>

    <!-- 1.7 (Yetkisiz/Gereksiz) -->
    <g transform="translate(0, 390)">
      <rect width="350" height="48" rx="8" fill="#1A202C" stroke="#4A5568" stroke-width="1"/>
      <text x="20" y="30" font-size="12" fill="#A0AEC0">💉 Doğrudan İlaç Dağıtımı (MAR)</text>
      <text x="330" y="30" text-anchor="end" font-size="11" fill="#718096">Salt İzleme</text>
    </g>
  </g>

  <!-- ── 2. ROL: KURUM HEKİMİ (ORTA DAL) ── -->
  <g transform="translate(600, 280)" filter="url(#tShadow)">
    <rect width="350" height="90" rx="12" fill="#581C87" stroke="#8B5CF6" stroke-width="2.5"/>
    <text x="175" y="34" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFFFFF">🩺 KURUM HEKİMİ (DOKTOR)</text>
    <text x="175" y="56" text-anchor="middle" font-size="12" fill="#E9D5FF">Tıbbi Teşhis, Tanı ve Tedavi Lideri</text>
    <text x="175" y="74" text-anchor="middle" font-size="11" fill="#F3E8FF">Rol Kodu: 'Doktor'</text>
  </g>

  <!-- Hekim Modül Dalları -->
  <g transform="translate(600, 410)" filter="url(#tShadow)">
    <line x1="175" y1="-40" x2="175" y2="440" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="4,4"/>

    <!-- 2.1 -->
    <g transform="translate(0, 0)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📋 Hasta Muayene &amp; Hekim Vizitesi</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 2.2 -->
    <g transform="translate(0, 65)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">💊 ICD-10 Tanı &amp; İlaç Tedavisi (Rx)</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">ÖZEL YETKİ</text>
    </g>

    <!-- 2.3 -->
    <g transform="translate(0, 130)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">🚑 112 Dış Hastane Sevk Başlatma</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 2.4 -->
    <g transform="translate(0, 195)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">💓 Vital Bulguları İnceleme &amp; Alarm</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#38BDF8">İZLEME</text>
    </g>

    <!-- 2.5 -->
    <g transform="translate(0, 260)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#8B5CF6" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📅 Kendi Nöbetini Görüntüleme</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#38BDF8">GÖRÜNTÜLE</text>
    </g>

    <!-- 2.6 (Kısıtlı) -->
    <g transform="translate(0, 325)">
      <rect width="350" height="52" rx="8" fill="#1A1829" stroke="#E11D48" stroke-width="1"/>
      <text x="20" y="32" font-size="13" fill="#FDA4AF">🚫 Personel İK &amp; Kullanıcı Şifreleri</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#F43F5E">YETKİSİZ</text>
    </g>

    <!-- 2.7 (Kısıtlı) -->
    <g transform="translate(0, 390)">
      <rect width="350" height="48" rx="8" fill="#1A1829" stroke="#E11D48" stroke-width="1"/>
      <text x="20" y="30" font-size="12" fill="#FDA4AF">🚫 Sistem Denetim İzi (Audit Log)</text>
      <text x="330" y="30" text-anchor="end" font-size="11" font-weight="bold" fill="#F43F5E">YETKİSİZ</text>
    </g>
  </g>

  <!-- ── 3. ROL: BAŞHEMŞİRE & HEMŞİRE (SAĞ DAL) ── -->
  <g transform="translate(1125, 280)" filter="url(#tShadow)">
    <rect width="350" height="90" rx="12" fill="#064E3B" stroke="#10B981" stroke-width="2.5"/>
    <text x="175" y="34" text-anchor="middle" font-size="16" font-weight="bold" fill="#FFFFFF">💉 BAŞHEMŞİRE / HEMŞİRE</text>
    <text x="175" y="56" text-anchor="middle" font-size="12" fill="#A7F3D0">Klinik Bakım &amp; Operasyonel Yürütücü</text>
    <text x="175" y="74" text-anchor="middle" font-size="11" fill="#D1FAE5">Rol Kodu: 'Bashemsire' / 'Hemsire'</text>
  </g>

  <!-- Hemşire Modül Dalları -->
  <g transform="translate(1125, 410)" filter="url(#tShadow)">
    <line x1="175" y1="-40" x2="175" y2="440" stroke="#10B981" stroke-width="2" stroke-dasharray="4,4"/>

    <!-- 3.1 -->
    <g transform="translate(0, 0)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">💓 Toplu Vital Girişi &amp; Alarm Üretimi</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 3.2 -->
    <g transform="translate(0, 65)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">💊 Saatlik İlaç Dağıtımı (MAR Matrisi)</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 3.3 -->
    <g transform="translate(0, 130)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📝 Dijital Vardiya Devir Teslim Raporu</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 3.4 -->
    <g transform="translate(0, 195)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📌 Günlük Görev Panosu &amp; Notlar</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">TAM YETKİ</text>
    </g>

    <!-- 3.5 -->
    <g transform="translate(0, 260)">
      <rect width="350" height="52" rx="8" fill="#1E293B" stroke="#10B981" stroke-width="1.5"/>
      <text x="20" y="32" font-size="13" font-weight="bold" fill="#FFFFFF">📅 Vardiya Takvimi (Başhemşire: Düzenler)</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#10B981">DÜZENLEME</text>
    </g>

    <!-- 3.6 (Kısıtlı) -->
    <g transform="translate(0, 325)">
      <rect width="350" height="52" rx="8" fill="#1A1829" stroke="#E11D48" stroke-width="1"/>
      <text x="20" y="32" font-size="13" fill="#FDA4AF">🚫 Hekim Muayenesi &amp; Tanı Koyma</text>
      <text x="330" y="32" text-anchor="end" font-size="11" font-weight="bold" fill="#F43F5E">YETKİSİZ</text>
    </g>

    <!-- 3.7 (Kısıtlı) -->
    <g transform="translate(0, 390)">
      <rect width="350" height="48" rx="8" fill="#1A1829" stroke="#E11D48" stroke-width="1"/>
      <text x="20" y="30" font-size="12" fill="#FDA4AF">🚫 Personel İK &amp; Sistem Denetim İzi</text>
      <text x="330" y="30" text-anchor="end" font-size="11" font-weight="bold" fill="#F43F5E">YETKİSİZ</text>
    </g>
  </g>

  <!-- Alt Bilgi Notu -->
  <g transform="translate(775, 920)" text-anchor="middle" font-size="12" fill="#64748B">
    <text>MediCore Rol Tabanlı Yetkilendirme Modeli (RBAC) | ASP.NET Core Claims-Based Security | Frontend Navigasyon İzolasyonu</text>
  </g>
</svg>`;

// Dosyaları Kaydet
fs.writeFileSync(path.join(OUT_DIR, 'ozel_sistem_mimarisi_akis_semasi.svg'), svgSistemAkis, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, 'ozel_veritabani_iliskileri_haritasi.svg'), svgVeritabaniHaritasi, 'utf-8');
fs.writeFileSync(path.join(OUT_DIR, 'ozel_rbac_hiyerarsi_agaci.svg'), svgRBACTree, 'utf-8');

console.log("✅ 3 Adet Özel Teknik Diyagram SVG olarak başarıyla kaydedildi!");
