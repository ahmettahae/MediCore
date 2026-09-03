const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUT_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'ekran_goruntuleri');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9228;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getAuthData() {
  const res = await fetch('http://localhost:5034/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ EPosta: 'a', Sifre: '' })
  });
  return await res.json();
}

function launchChrome() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-medicore-' + Date.now());
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1600,1050',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);
  return { proc, tmpDir };
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    return await this.send('Runtime.evaluate', { expression, returnByValue: true });
  }

  async navigate(url, waitMs = 2000) {
    await this.send('Page.navigate', { url });
    await sleep(waitMs);
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 100 });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 [KAYDEDİLDİ]: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  console.log("🚀 MediCore Rapor Görselleri Çekim Aracı Başlatılıyor...\n");

  const authData = await getAuthData();
  console.log(`🔑 Giriş Başarılı: ${authData.ad} ${authData.soyad} (${authData.rol})`);

  const { proc } = launchChrome();
  await sleep(1800);

  try {
    const vRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await vRes.json();
    const target = pages.find(p => p.type === 'page') || pages[0];
    if (!target) throw new Error("Chrome sekmesi bulunamadı!");

    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1050,
      deviceScaleFactor: 1.25,
      mobile: false
    });

    console.log("🖥️ 1. Giriş Ekranı çekiliyor...");
    await client.navigate('http://localhost:5173/login', 1500);
    await client.screenshot('01_giris_ekrani.png');

    console.log("🔐 Oturum açılıyor (localStorage ayarlanıyor)...");
    await client.evaluate(`
      localStorage.setItem('userToken', ${JSON.stringify(authData.token)});
      localStorage.setItem('kullaniciAd', ${JSON.stringify(authData.ad)});
      localStorage.setItem('kullaniciSoyad', ${JSON.stringify(authData.soyad)});
      localStorage.setItem('kullaniciRol', ${JSON.stringify(authData.rol)});
      localStorage.removeItem('medicore_gece_modu');
    `);

    console.log("📊 2. Başhekim & Yönetici Dashboard çekiliyor...");
    await client.navigate('http://localhost:5173/', 3000);
    await client.screenshot('02_yonetici_dashboard.png');

    console.log("💓 3. Toplu Vital Bulgular Matrisi çekiliyor...");
    await client.navigate('http://localhost:5173/toplu-vital', 2500);
    await client.screenshot('03_toplu_vital_matrisi.png');

    console.log("🚨 4. Kritik Vital Alarm Test Görünümü oluşturuluyor...");
    await client.evaluate(`
      const testBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Alarm Sesini Sına'));
      if (testBtn) testBtn.click();
    `);
    await sleep(800);
    await client.screenshot('04_kritik_vital_alarm_uyarisi.png');

    console.log("💊 5. Saatlik İlaç Dağıtım Paneli (MAR) çekiliyor...");
    await client.navigate('http://localhost:5173/ilac-dagitim', 2500);
    await client.screenshot('05_saatlik_ilac_dagitim_paneli_mar.png');

    console.log("🩺 6. Hekim Vizite ve Muayene Modülü çekiliyor...");
    await client.navigate('http://localhost:5173/vizite', 2500);
    await client.screenshot('06_hekim_vizite_muayene.png');

    console.log("👥 7. Bakım Sakinleri & Hasta Listesi çekiliyor...");
    await client.navigate('http://localhost:5173/hastalar', 2000);
    await client.screenshot('07_hasta_listesi.png');

    console.log("🚑 8. Dış Hastane Sevk & 112 Koordinasyonu çekiliyor...");
    await client.navigate('http://localhost:5173/sevkler', 2500);
    await client.screenshot('08_hastane_sevk_112.png');

    console.log("📅 9. Vardiya ve Aylık Nöbet Takvimi çekiliyor...");
    await client.navigate('http://localhost:5173/vardiya-takvim', 2500);
    await client.screenshot('09_vardiya_nobet_takvimi.png');

    console.log("💊 10. İlaç Envanteri ve Stok Yönetimi çekiliyor...");
    await client.navigate('http://localhost:5173/ilaclar', 2000);
    await client.screenshot('10_ilac_stok_envanteri.png');

    console.log("📋 11. Dijital Vardiya Devir Teslim Raporu çekiliyor...");
    await client.navigate('http://localhost:5173/vardiya-raporu', 2000);
    await client.screenshot('11_vardiya_devir_teslim_raporu.png');

    console.log("📢 12. Kurumsal Duyuru ve Görev Panosu çekiliyor...");
    await client.navigate('http://localhost:5173/duyurular', 2000);
    await client.screenshot('12_duyuru_panosu.png');

    console.log("🛡️ 13. Sistem Denetim İzi (Audit Log) çekiliyor...");
    await client.navigate('http://localhost:5173/sistem-loglari', 2500);
    await client.screenshot('13_sistem_denetim_izleri_audit.png');

    console.log("🌙 14. Gece Modu (Dark Theme) Görünümü çekiliyor...");
    await client.evaluate(`
      localStorage.setItem('medicore_gece_modu', 'true');
      document.documentElement.classList.add('dark');
    `);
    await client.navigate('http://localhost:5173/', 2000);
    await client.screenshot('14_karanlik_mod_dashboard.png');

    console.log("📜 15. Backend .NET 9 Web API Swagger (OpenAPI) Dokümantasyonu çekiliyor...");
    await client.navigate('http://localhost:5034/swagger/index.html', 2500);
    await client.screenshot('15_swagger_api_dokumantasyonu.png');

    client.close();
    console.log("\n🎉 TÜM EKRAN GÖRÜNTÜLERİ BAŞARIYLA ALINDI!");
  } catch (err) {
    console.error("❌ Hata:", err);
  } finally {
    proc.kill();
  }
}

main();
