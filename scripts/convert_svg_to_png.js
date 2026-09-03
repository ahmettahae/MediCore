const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SVG_DIR = path.join(__dirname, '..', 'rapor_gorselleri', 'diyagramlar');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9233;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function launchChrome() {
  const tmpDir = path.join(os.tmpdir(), 'chrome-svg-' + Date.now());
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tmpDir}`,
    '--window-size=1600,1100',
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
  console.log("🎨 SVG Diyagramları Yüksek Çözünürlüklü PNG'ye Dönüştürülüyor...\n");

  const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg'));
  const { proc } = launchChrome();
  await sleep(1500);

  try {
    const vRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pages = await vRes.json();
    const target = pages.find(p => p.type === 'page') || pages[0];
    const client = new CDPClient(target.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');

    for (const file of files) {
      const filePath = path.join(SVG_DIR, file);
      const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
      const pngName = file.replace('.svg', '.png');
      const outPngPath = path.join(SVG_DIR, pngName);

      // Çözünürlük ayarı
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: 1550,
        height: 1000,
        deviceScaleFactor: 1.5,
        mobile: false
      });

      await client.send('Page.navigate', { url: fileUrl });
      await sleep(800);

      const res = await client.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      fs.writeFileSync(outPngPath, buffer);
      console.log(`🖼️ [PNG OLUŞTURULDU]: ${pngName} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }

    client.ws.close();
    console.log("\n✨ Tüm SVG diyagramları PNG formatına başarıyla aktarıldı!");
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    proc.kill();
  }
}

main();
