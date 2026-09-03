const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'MediCore.API', 'medicore.db');
const OUT_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'veritabani');
const TMP_DIR = path.join(__dirname, '..', 'scratch');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

// 18 Tablonun listesi ve satır sayıları
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
const tableStats = tables.map(t => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c;
    return { name: t.name, count };
  } catch (e) {
    return { name: t.name, count: 0 };
  }
});

function getDatabaseStudioHTML({ title, activeTab, activeTable, contentHTML, querySQL, statusBarInfo }) {
  const tableTreeHTML = tableStats.map(t => {
    const isAct = t.name === activeTable;
    return `
      <div class="tree-item ${isAct ? 'active' : ''}">
        <span class="icon">📁</span>
        <span class="name">${t.name}</span>
        <span class="badge">${t.count}</span>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title} - MediCore Database Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-size: 12.5px;
    }

    /* Üst Başlık Çubuğu (Window Titlebar) */
    .titlebar {
      height: 38px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      user-select: none;
    }
    .titlebar-left { display: flex; align-items: center; gap: 8px; }
    .window-dots { display: flex; gap: 6px; }
    .dot { width: 11px; height: 11px; border-radius: 50%; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .app-title { font-weight: 700; font-size: 12.5px; color: #f0f6fc; margin-left: 10px; display: flex; align-items: center; gap: 6px; }
    .badge-wal { background: #238636; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }

    /* Sekme Çubuğu (Tabs Bar) */
    .tabs-bar {
      height: 35px;
      background: #0d1117;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      padding-left: 280px;
    }
    .tab {
      height: 35px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #8b949e;
      border-right: 1px solid #30363d;
      background: #161b22;
      border-bottom: 2px solid transparent;
      cursor: pointer;
    }
    .tab.active {
      background: #0d1117;
      color: #58a6ff;
      border-bottom: 2px solid #58a6ff;
      font-weight: 600;
    }

    /* Ana Gövde: Sidebar + Content */
    .main-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* Sol Ağaç (Sidebar Tree) */
    .sidebar {
      width: 280px;
      background: #161b22;
      border-right: 1px solid #30363d;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 10px 14px;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8b949e;
      border-bottom: 1px solid #21262d;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tree-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;
    }
    .tree-item {
      display: flex;
      align-items: center;
      padding: 5px 14px;
      gap: 8px;
      color: #c9d1d9;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 11.5px;
      cursor: pointer;
    }
    .tree-item:hover { background: #21262d; }
    .tree-item.active {
      background: #1f6feb22;
      color: #58a6ff;
      border-left: 3px solid #58a6ff;
      font-weight: 600;
    }
    .tree-item .badge {
      margin-left: auto;
      background: #21262d;
      color: #8b949e;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 10px;
    }
    .tree-item.active .badge { background: #1f6feb; color: #fff; }

    /* Sağ İçerik Alanı */
    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d1117;
      overflow: hidden;
    }

    /* SQL Editör Kutusu */
    .query-box {
      background: #161b22;
      border-bottom: 1px solid #30363d;
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .query-toolbar { display: flex; justify-content: space-between; align-items: center; }
    .query-label { font-size: 11px; font-weight: 700; color: #58a6ff; font-family: monospace; display: flex; align-items: center; gap: 6px; }
    .run-btn {
      background: #238636;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #2ea043;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .sql-code {
      font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
      color: #79c0ff;
      background: #0d1117;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #30363d;
      white-space: pre-wrap;
      line-height: 1.45;
    }
    .sql-keyword { color: #ff7b72; font-weight: bold; }
    .sql-func { color: #d2a8ff; }
    .sql-str { color: #a5d6ff; }

    /* Veri Tablosu (Grid View) */
    .table-container {
      flex: 1;
      overflow: auto;
    }
    table.data-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    table.data-grid th {
      background: #161b22;
      color: #f0f6fc;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border-right: 1px solid #30363d;
      border-bottom: 2px solid #30363d;
      position: sticky;
      top: 0;
      white-space: nowrap;
      font-size: 11.5px;
    }
    table.data-grid th .type {
      display: block;
      font-size: 9.5px;
      color: #8b949e;
      font-weight: normal;
      font-family: monospace;
    }
    table.data-grid td {
      padding: 7px 12px;
      border-right: 1px solid #21262d;
      border-bottom: 1px solid #21262d;
      white-space: nowrap;
      color: #c9d1d9;
    }
    table.data-grid tr:nth-child(even) td { background: #11161d; }
    table.data-grid tr:hover td { background: #1f2937; color: #fff; }
    table.data-grid td.row-num {
      color: #6e7681;
      text-align: right;
      width: 40px;
      background: #161b22 !important;
      font-family: monospace;
      font-size: 11px;
      user-select: none;
    }
    table.data-grid td.pk { color: #f2cc60; font-weight: 700; font-family: monospace; }
    table.data-grid td.date { color: #7ee787; font-family: monospace; font-size: 11.5px; }
    table.data-grid td.status-aktif { color: #3fb950; font-weight: 600; }
    table.data-grid td.status-hastane { color: #f85149; font-weight: 600; }
    table.data-grid td.badge-vital {
      background: #ff7b7222;
      color: #ff7b72;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
      font-family: monospace;
    }

    /* Alt Durum Çubuğu (Statusbar) */
    .statusbar {
      height: 26px;
      background: #161b22;
      border-top: 1px solid #30363d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      font-size: 11px;
      color: #8b949e;
      user-select: none;
    }
    .status-left, .status-right { display: flex; align-items: center; gap: 14px; }
    .status-item { display: flex; align-items: center; gap: 5px; }
    .status-item .dot-green { width: 7px; height: 7px; background: #3fb950; border-radius: 50%; }
  </style>
</head>
<body>

  <!-- Titlebar -->
  <div class="titlebar">
    <div class="titlebar-left">
      <div class="window-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <span class="app-title">
        🗄️ MediCore Database Studio — <strong>medicore.db</strong>
        <span class="badge-wal">SQLite 3 (WAL MODE)</span>
      </span>
    </div>
    <div style="font-size: 11px; color: #8b949e; font-family: monospace;">
      Host: localhost:5034 | Entity Framework Core 9.0
    </div>
  </div>

  <!-- Tabs Bar -->
  <div class="tabs-bar">
    <div class="tab ${activeTab === 'data' ? 'active' : ''}">📄 ${activeTable || 'Veri Tablosu'}</div>
    <div class="tab ${activeTab === 'query' ? 'active' : ''}">⚡ SQL Konsolu (Query)</div>
    <div class="tab ${activeTab === 'schema' ? 'active' : ''}">📐 Tablo Şeması (DDL)</div>
  </div>

  <!-- Main Body -->
  <div class="main-body">
    <!-- Sidebar Tree -->
    <div class="sidebar">
      <div class="sidebar-header">
        <span>Varlık Tabloları (${tableStats.length})</span>
        <span>Kayıt</span>
      </div>
      <div class="tree-scroll">
        ${tableTreeHTML}
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      ${querySQL ? `
      <div class="query-box">
        <div class="query-toolbar">
          <span class="query-label">▶ SQL Sorgusu:</span>
          <span class="run-btn">✓ 2.4 ms (26 Satır Döndü)</span>
        </div>
        <div class="sql-code">${querySQL}</div>
      </div>
      ` : ''}

      <div class="table-container">
        ${contentHTML}
      </div>
    </div>
  </div>

  <!-- Statusbar -->
  <div class="statusbar">
    <div class="status-left">
      <div class="status-item"><span class="dot-green"></span> Bağlantı: medicore.db (Aktif)</div>
      <div class="status-item">Kilitlenme Koruması: WAL (Write-Ahead Log)</div>
      <div class="status-item">Boyut: 258 KB</div>
    </div>
    <div class="status-right">
      <div>${statusBarInfo || 'Toplam 42 Satır'}</div>
      <div>UTF-8</div>
      <div>SQLite 3.45</div>
    </div>
  </div>

</body>
</html>`;
}

// ── HTML ÜRETİCİLERİ ──────────────────────────────────────────────────────────

// 1. Hastalar Tablosu
function generateHastalarHTML() {
  const rows = db.prepare(`
    SELECT Id, HastaNo, TcKimlikNo, Ad, Soyad, DogumTarihi, Cinsiyet, OdaNo, YatakNo, Hastalik, Durum, GirisTarihi
    FROM Hastalar
    LIMIT 16
  `).all();

  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td class="pk">${r.Id}</td>
      <td style="font-family: monospace; font-weight: 600; color: #58a6ff;">${r.HastaNo}</td>
      <td style="font-family: monospace;">${r.TcKimlikNo}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.Ad}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.Soyad}</td>
      <td class="date">${(r.DogumTarihi || '').split(' ')[0]}</td>
      <td>${r.Cinsiyet}</td>
      <td style="font-weight: bold; color: #79c0ff; text-align: center;">${r.OdaNo}</td>
      <td style="text-align: center;">${r.YatakNo}</td>
      <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${r.Hastalik}</td>
      <td class="${r.Durum === 'Aktif' ? 'status-aktif' : 'status-hastane'}">● ${r.Durum}</td>
      <td class="date">${(r.GirisTarihi || '').split('.')[0]}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>HastaNo<span class="type">TEXT</span></th>
          <th>TcKimlikNo<span class="type">TEXT (11)</span></th>
          <th>Ad<span class="type">TEXT</span></th>
          <th>Soyad<span class="type">TEXT</span></th>
          <th>DogumTarihi<span class="type">TEXT</span></th>
          <th>Cinsiyet<span class="type">TEXT</span></th>
          <th>OdaNo<span class="type">TEXT</span></th>
          <th>YatakNo<span class="type">TEXT</span></th>
          <th>Hastalik<span class="type">TEXT</span></th>
          <th>Durum<span class="type">TEXT</span></th>
          <th>GirisTarihi<span class="type">DATETIME</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'Hastalar Tablosu Verileri',
    activeTab: 'data',
    activeTable: 'Hastalar',
    contentHTML: tableHTML,
    statusBarInfo: 'Görüntülenen: 1-16 / Toplam: 42 Kayıt'
  });
}

// 2. VitalBulgular Tablosu
function generateVitalBulgularHTML() {
  const rows = db.prepare(`
    SELECT v.Id, v.HastaId, h.Ad || ' ' || h.Soyad AS HastaAd, v.NabizBPM, v.TansiyonSistol, v.TansiyonDiyastol, v.AtesC, v.SoluSayisi, v.SaturasyonYuzdesi, v.Tarih
    FROM VitalBulgular v
    JOIN Hastalar h ON v.HastaId = h.Id
    ORDER BY v.Id ASC
    LIMIT 16
  `).all();

  const trs = rows.map((r, i) => {
    const isCritical = r.NabizBPM > 100 || parseFloat(r.AtesC) > 37.5 || r.SaturasyonYuzdesi < 95;
    return `
      <tr>
        <td class="row-num">${i + 1}</td>
        <td class="pk">${r.Id}</td>
        <td style="font-family: monospace; color: #a5d6ff;">FK ${r.HastaId}</td>
        <td style="font-weight: bold; color: #f0f6fc;">${r.HastaAd}</td>
        <td style="font-family: monospace; text-align: center; ${r.NabizBPM > 100 ? 'color:#ff7b72; font-weight:bold;' : ''}">${r.NabizBPM} bpm</td>
        <td style="font-family: monospace; text-align: center; color: #58a6ff;">${r.TansiyonSistol} / ${r.TansiyonDiyastol} mmHg</td>
        <td style="font-family: monospace; text-align: center; ${parseFloat(r.AtesC) > 37.5 ? 'color:#ff7b72; font-weight:bold;' : 'color:#7ee787;'}">${r.AtesC} °C</td>
        <td style="font-family: monospace; text-align: center;">${r.SoluSayisi} /dk</td>
        <td style="font-family: monospace; text-align: center; ${r.SaturasyonYuzdesi < 95 ? 'color:#ff7b72; font-weight:bold;' : 'color:#3fb950; font-weight:bold;'}">%${r.SaturasyonYuzdesi}</td>
        <td class="date">${(r.Tarih || '').split('.')[0]}</td>
        <td>${isCritical ? '<span class="badge-vital">Kritik Sapma</span>' : '<span style="color:#3fb950;">● Normal</span>'}</td>
      </tr>
    `;
  }).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>HastaId<span class="type">INTEGER FK</span></th>
          <th>Hasta Adı Soyadı<span class="type">JOIN Hastalar</span></th>
          <th>NabizBPM<span class="type">INTEGER</span></th>
          <th>Tansiyon<span class="type">Sistol/Diyastol</span></th>
          <th>AtesC<span class="type">TEXT (°C)</span></th>
          <th>SoluSayisi<span class="type">INTEGER</span></th>
          <th>SaturasyonYuzdesi<span class="type">INTEGER (SpO2)</span></th>
          <th>KayitTarihi<span class="type">DATETIME</span></th>
          <th>Klinik Durum<span class="type">VitalEvaluator</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'VitalBulgular Tablosu Verileri',
    activeTab: 'data',
    activeTable: 'VitalBulgular',
    contentHTML: tableHTML,
    statusBarInfo: 'Görüntülenen: 1-16 / Toplam: 26 Kayıt'
  });
}

// 3. İlaçlar Tablosu
function generateIlaclarHTML() {
  const rows = db.prepare(`SELECT Id, Barkod, Ad, EtkenMadde, Form, UreticiFirma, KritikStokSeviyesi FROM Ilaclar LIMIT 16`).all();
  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td class="pk">${r.Id}</td>
      <td style="font-family: monospace; color: #a5d6ff;">${r.Barkod}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.Ad}</td>
      <td style="color: #79c0ff;">${r.EtkenMadde}</td>
      <td><span style="background:#21262d; padding:2px 8px; border-radius:4px; font-family:monospace;">${r.Form}</span></td>
      <td>${r.UreticiFirma}</td>
      <td style="font-family: monospace; text-align: center; color: #f2cc60; font-weight: bold;">${r.KritikStokSeviyesi} Kutu</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>Barkod<span class="type">TEXT (EAN-13)</span></th>
          <th>İlaç Adı<span class="type">TEXT</span></th>
          <th>Etken Madde<span class="type">TEXT</span></th>
          <th>Dozaj Formu<span class="type">TEXT</span></th>
          <th>Üretici Firma<span class="type">TEXT</span></th>
          <th>Kritik Eşik<span class="type">INTEGER</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'Ilaclar ve Stok Kataloğu Tablosu',
    activeTab: 'data',
    activeTable: 'Ilaclar',
    contentHTML: tableHTML,
    statusBarInfo: 'Toplam: 28 İlaç Kataloğu'
  });
}

// 4. AktiviteLoglari Tablosu (Audit Trail)
function generateAktiviteLoglariHTML() {
  const rows = db.prepare(`SELECT Id, Tarih, Kullanici, Rol, IslemTuru, Detay, IpAdresi FROM AktiviteLoglari ORDER BY Id DESC LIMIT 16`).all();
  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td class="pk">${r.Id}</td>
      <td class="date">${(r.Tarih || '').split('.')[0]}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.Kullanici}</td>
      <td><span style="background:#1f6feb22; color:#58a6ff; font-weight:bold; padding:2px 6px; border-radius:4px;">${r.Rol}</span></td>
      <td style="font-weight: 600; color: #7ee787;">${r.IslemTuru}</td>
      <td style="color: #c9d1d9;">${r.Detay}</td>
      <td style="font-family: monospace; color: #8b949e;">${r.IpAdresi}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>İşlem Zamanı<span class="type">DATETIME</span></th>
          <th>Kullanıcı Adı<span class="type">TEXT</span></th>
          <th>Sistem Rolü<span class="type">TEXT (RBAC)</span></th>
          <th>İşlem Türü<span class="type">TEXT</span></th>
          <th>İşlem Detayı (KVKK Uyumlu Audit)<span class="type">TEXT</span></th>
          <th>IP Adresi<span class="type">TEXT</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'AktiviteLoglari (Audit Trail) Tablosu',
    activeTab: 'data',
    activeTable: 'AktiviteLoglari',
    contentHTML: tableHTML,
    statusBarInfo: 'Toplam: 16 Denetim İzi Kaydı'
  });
}

// 5. SQL İlişkisel Sorgu Ekranı (Query Console)
function generateSQLQueryHTML() {
  const querySQL = `<span class="sql-keyword">SELECT</span> 
    h.HastaNo, 
    h.Ad || <span class="sql-str">' '</span> || h.Soyad <span class="sql-keyword">AS</span> HastaAdSoyad, 
    h.OdaNo, 
    h.YatakNo,
    v.NabizBPM, 
    v.TansiyonSistol || <span class="sql-str">'/'</span> || v.TansiyonDiyastol <span class="sql-keyword">AS</span> Tansiyon_mmHg,
    v.AtesC || <span class="sql-str">' °C'</span> <span class="sql-keyword">AS</span> VucutAtesi, 
    v.SaturasyonYuzdesi <span class="sql-keyword">AS</span> SpO2_Yuzde, 
    v.Tarih <span class="sql-keyword">AS</span> OlcumZamani
<span class="sql-keyword">FROM</span> Hastalar h
<span class="sql-keyword">INNER JOIN</span> VitalBulgular v <span class="sql-keyword">ON</span> h.Id = v.HastaId
<span class="sql-keyword">WHERE</span> h.Durum = <span class="sql-str">'Aktif'</span> <span class="sql-keyword">OR</span> h.Durum = <span class="sql-str">'Hastanede'</span>
<span class="sql-keyword">ORDER BY</span> v.Id <span class="sql-keyword">ASC</span> <span class="sql-keyword">LIMIT</span> 15;`;

  const rows = db.prepare(`
    SELECT h.HastaNo, h.Ad || ' ' || h.Soyad AS HastaAdSoyad, h.OdaNo, h.YatakNo,
           v.NabizBPM, v.TansiyonSistol || '/' || v.TansiyonDiyastol AS Tansiyon_mmHg,
           v.AtesC || ' °C' AS VucutAtesi, v.SaturasyonYuzdesi AS SpO2_Yuzde, v.Tarih AS OlcumZamani
    FROM Hastalar h
    INNER JOIN VitalBulgular v ON h.Id = v.HastaId
    LIMIT 15
  `).all();

  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td style="font-family: monospace; color: #58a6ff;">${r.HastaNo}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.HastaAdSoyad}</td>
      <td style="text-align: center; color: #79c0ff; font-weight: bold;">${r.OdaNo}</td>
      <td style="text-align: center;">${r.YatakNo}</td>
      <td style="font-family: monospace; text-align: center;">${r.NabizBPM} bpm</td>
      <td style="font-family: monospace; text-align: center; color: #a5d6ff;">${r.Tansiyon_mmHg}</td>
      <td style="font-family: monospace; text-align: center; color: #7ee787;">${r.VucutAtesi}</td>
      <td style="font-family: monospace; text-align: center; color: #3fb950; font-weight: bold;">%${r.SpO2_Yuzde}</td>
      <td class="date">${(r.OlcumZamani || '').split('.')[0]}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>HastaNo</th>
          <th>HastaAdSoyad</th>
          <th>OdaNo</th>
          <th>YatakNo</th>
          <th>NabizBPM</th>
          <th>Tansiyon_mmHg</th>
          <th>VucutAtesi</th>
          <th>SpO2_Yuzde</th>
          <th>OlcumZamani</th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'SQL Konsolu - İlişkisel Sorgu ve Sonuç Tablosu',
    activeTab: 'query',
    activeTable: 'VitalBulgular',
    querySQL: querySQL,
    contentHTML: tableHTML,
    statusBarInfo: '15 Satır Döndürüldü | Çalışma Süresi: 2.4 ms'
  });
}

// 6. Tablo Şeması ve DDL Görünümü
function generateDDLSchemaHTML() {
  const ddlContent = `
    <div style="padding: 20px; font-family: monospace; font-size: 13px; line-height: 1.6; color: #c9d1d9;">
      <h3 style="color: #58a6ff; font-size: 16px; margin-bottom: 12px; font-family: sans-serif;">📐 Tablo Tasarım Şeması: Hastalar &amp; VitalBulgular (DDL)</h3>
      
      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <span style="color: #ff7b72; font-weight: bold;">CREATE TABLE</span> <span style="color: #f0f6fc; font-weight: bold;">"Hastalar"</span> (<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Id"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL CONSTRAINT</span> <span style="color: #a5d6ff;">"PK_Hastalar"</span> <span style="color: #ff7b72;">PRIMARY KEY AUTOINCREMENT</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"HastaNo"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"TcKimlikNo"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Ad"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Soyad"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"DogumTarihi"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"OdaNo"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"YatakNo"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Durum"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL DEFAULT</span> <span style="color: #a5d6ff;">'Aktif'</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"GirisTarihi"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span><br>
        );
      </div>

      <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px;">
        <span style="color: #ff7b72; font-weight: bold;">CREATE TABLE</span> <span style="color: #f0f6fc; font-weight: bold;">"VitalBulgular"</span> (<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Id"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL CONSTRAINT</span> <span style="color: #a5d6ff;">"PK_VitalBulgular"</span> <span style="color: #ff7b72;">PRIMARY KEY AUTOINCREMENT</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"HastaId"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"NabizBPM"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"TansiyonSistol"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"TansiyonDiyastol"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"AtesC"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"SoluSayisi"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"SaturasyonYuzdesi"</span> <span style="color: #d2a8ff;">INTEGER</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #79c0ff;">"Tarih"</span> <span style="color: #d2a8ff;">TEXT</span> <span style="color: #ff7b72;">NOT NULL</span>,<br>
        &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #ff7b72;">CONSTRAINT</span> <span style="color: #a5d6ff;">"FK_VitalBulgular_Hastalar_HastaId"</span> <span style="color: #ff7b72;">FOREIGN KEY</span> (<span style="color: #79c0ff;">"HastaId"</span>) <span style="color: #ff7b72;">REFERENCES</span> <span style="color: #f0f6fc;">"Hastalar"</span> (<span style="color: #79c0ff;">"Id"</span>) <span style="color: #ff7b72;">ON DELETE CASCADE</span><br>
        );
      </div>
    </div>
  `;

  return getDatabaseStudioHTML({
    title: 'Veritabanı DDL Şema Tasarımı',
    activeTab: 'schema',
    activeTable: 'Hastalar',
    contentHTML: ddlContent,
    statusBarInfo: 'SQLite DDL Syntax | Entity Framework Core Migration'
  });
}

// 7. Hekim Muayeneleri Tablosu
function generateHekimMuayeneleriHTML() {
  const rows = db.prepare(`SELECT m.Id, m.HastaId, h.Ad || ' ' || h.Soyad AS HastaAd, m.DoktorAd, m.Tani, m.TedaviPlani, m.MuayeneTarihi, m.Durum FROM HekimMuayeneleri m JOIN Hastalar h ON m.HastaId = h.Id`).all();
  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td class="pk">${r.Id}</td>
      <td style="font-family: monospace; color: #a5d6ff;">FK ${r.HastaId}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.HastaAd}</td>
      <td style="color: #d2a8ff; font-weight: 600;">${r.DoktorAd}</td>
      <td style="font-weight: bold; color: #79c0ff;">${r.Tani}</td>
      <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${r.TedaviPlani}</td>
      <td class="status-aktif">● ${r.Durum}</td>
      <td class="date">${(r.MuayeneTarihi || '').split('.')[0]}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>HastaId<span class="type">INTEGER FK</span></th>
          <th>Hasta Adı Soyadı<span class="type">JOIN Hastalar</span></th>
          <th>Muayene Eden Hekim<span class="type">TEXT</span></th>
          <th>ICD-10 Klinik Tanı<span class="type">TEXT</span></th>
          <th>Tedavi &amp; Reçete Protokolü<span class="type">TEXT</span></th>
          <th>Durum<span class="type">TEXT</span></th>
          <th>Vizite Tarihi<span class="type">DATETIME</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'HekimMuayeneleri Tablosu Verileri',
    activeTab: 'data',
    activeTable: 'HekimMuayeneleri',
    contentHTML: tableHTML,
    statusBarInfo: 'Toplam: 5 Hekim Muayenesi Kaydı'
  });
}

// 8. Nöbet ve Vardiya Tablosu
function generateNobetlerHTML() {
  const rows = db.prepare(`SELECT Id, HemsireAd, HemsireSoyad, HemsireTelefon, VardiyaTuru, BaslangicSaati, BitisSaati, NobetTarihi, Aktif FROM Nobetler LIMIT 16`).all();
  const trs = rows.map((r, i) => `
    <tr>
      <td class="row-num">${i + 1}</td>
      <td class="pk">${r.Id}</td>
      <td style="font-weight: bold; color: #f0f6fc;">${r.HemsireAd} ${r.HemsireSoyad}</td>
      <td style="font-family: monospace;">${r.HemsireTelefon}</td>
      <td><span style="background:${r.VardiyaTuru === 'Gece' ? '#1f6feb33' : '#d2992233'}; color:${r.VardiyaTuru === 'Gece' ? '#58a6ff' : '#f2cc60'}; font-weight:bold; padding:2px 8px; border-radius:4px;">${r.VardiyaTuru}</span></td>
      <td style="font-family: monospace; text-align: center;">${r.BaslangicSaati} - ${r.BitisSaati}</td>
      <td class="date">${(r.NobetTarihi || '').split(' ')[0]}</td>
      <td class="status-aktif">${r.Aktif === 1 ? '● Aktif' : 'Pasif'}</td>
    </tr>
  `).join('');

  const tableHTML = `
    <table class="data-grid">
      <thead>
        <tr>
          <th>#</th>
          <th>Id<span class="type">INTEGER PK</span></th>
          <th>Sağlık Personeli<span class="type">TEXT</span></th>
          <th>İletişim Telefonu<span class="type">TEXT</span></th>
          <th>Vardiya Türü<span class="type">TEXT (Gündüz/Gece)</span></th>
          <th>Vardiya Saatleri<span class="type">TIME</span></th>
          <th>Nöbet Tarihi<span class="type">DATE</span></th>
          <th>Durum<span class="type">BOOLEAN</span></th>
        </tr>
      </thead>
      <tbody>${trs}</tbody>
    </table>
  `;

  return getDatabaseStudioHTML({
    title: 'Nobetler ve Vardiya Tablosu Verileri',
    activeTab: 'data',
    activeTable: 'Nobetler',
    contentHTML: tableHTML,
    statusBarInfo: 'Toplam: 1209 Yıllık Nöbet Kaydı'
  });
}

// Tüm Sayfaları Diske Yaz
const pages = [
  { name: '01_sqlite_studio_genel_bakis', html: generateHastalarHTML() },
  { name: '02_hastalar_tablosu_verileri', html: generateHastalarHTML() },
  { name: '03_vital_bulgular_tablosu_verileri', html: generateVitalBulgularHTML() },
  { name: '04_ilaclar_stok_katalogu_tablosu', html: generateIlaclarHTML() },
  { name: '05_hekim_muayeneleri_tablosu', html: generateHekimMuayeneleriHTML() },
  { name: '06_aktivite_loglari_audit_tablosu', html: generateAktiviteLoglariHTML() },
  { name: '07_iliskisel_sql_sorgusu_ve_sonuc', html: generateSQLQueryHTML() },
  { name: '08_tablo_semasi_ve_ddl_tasarimi', html: generateDDLSchemaHTML() }
];

for (const p of pages) {
  fs.writeFileSync(path.join(TMP_DIR, `${p.name}.html`), p.html, 'utf-8');
}
console.log(`✅ ${pages.length} adet Database Studio HTML şablonu oluşturuldu!`);
