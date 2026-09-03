const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMP_DIR = path.join(__dirname, '..', 'scratch');
const OUT_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'veritabani');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9244;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function launchChrome() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-db-' + Date.now());
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1600,1050',
    '--disable-gpu',
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
}

async function main() {
  console.log("📸 MediCore Veritabanı Görselleri Çekiliyor...\n");

  const files = fs.readdirSync(TMP_DIR).filter(f => f.endsWith('.html'));
  const { proc } = launchChrome();
  await sleep(1500);

  try {
    const vRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await vRes.json();
    const target = pages.find(p => p.type === 'page') || pages[0];
    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1050,
      deviceScaleFactor: 1.25,
      mobile: false
    });

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
      const pngName = file.replace('.html', '.png');
      const outPath = path.join(OUT_DIR, pngName);

      await client.send('Page.navigate', { url: fileUrl });
      await sleep(600);

      const res = await client.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(outPath, buffer);
      console.log(`🗄️ [VERİTABANI GÖRSELİ OLUŞTURULDU]: ${pngName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }

    client.ws.close();
    console.log("\n🎉 TÜM VERİTABANI GÖRSELLERİ BAŞARIYLA ALINDI!");
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    proc.kill();
  }
}

main();
