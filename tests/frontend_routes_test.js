async function testFrontendRoutes() {
  console.log("==================================================");
  console.log("🔍 TESTING EXACT FRONTEND COMPONENT API CALLS");
  console.log("==================================================\n");

  const authRes = await fetch('http://localhost:5034/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ EPosta: 'a', Sifre: '' })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const frontendCalls = [
    // 1. AdminDashboard.jsx
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Hasta' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/HastahaneSevk' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Ilac' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Doktor/kurum-hekim' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Dashboard/ozet' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Nobet/bugun' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Personel' },
    { component: 'AdminDashboard', url: 'http://localhost:5034/api/Dashboard/uyarilar' },

    // 2. HemsireDashboard.jsx
    { component: 'HemsireDashboard', url: `http://localhost:5034/api/IlacUygulama/ozet?tarih=${todayStr}` },
    { component: 'HemsireDashboard', url: `http://localhost:5034/api/Nobet/gunluk?tarih=${todayStr}` },
    { component: 'HemsireDashboard', url: `http://localhost:5034/api/VitalBulgu/son-durumlar` },
    { component: 'HemsireDashboard', url: `http://localhost:5034/api/Duyuru` },

    // 3. DoktorDashboard.jsx
    { component: 'DoktorDashboard', url: 'http://localhost:5034/api/Hasta' },
    { component: 'DoktorDashboard', url: 'http://localhost:5034/api/Muayene/doktor-ozet' },
    { component: 'DoktorDashboard', url: 'http://localhost:5034/api/Muayene/kritik-hastalar' },
    { component: 'DoktorDashboard', url: 'http://localhost:5034/api/HastahaneSevk' },

    // 4. IlacDagitimPaneli.jsx
    { component: 'IlacDagitimPaneli', url: `http://localhost:5034/api/IlacUygulama/gunluk?tarih=${todayStr}&ogun=Sabah` },

    // 5. TopluVitalGiris.jsx
    { component: 'TopluVitalGiris', url: 'http://localhost:5034/api/VitalBulgu/son-durumlar' },

    // 6. HekimVizite.jsx
    { component: 'HekimVizite', url: 'http://localhost:5034/api/Hasta' },
    { component: 'HekimVizite', url: 'http://localhost:5034/api/Ilac' },
    { component: 'HekimVizite', url: 'http://localhost:5034/api/Hasta/1' },
    { component: 'HekimVizite', url: 'http://localhost:5034/api/Muayene/hasta/1' },
    { component: 'HekimVizite', url: 'http://localhost:5034/api/VitalBulgu/hasta/1' },
    { component: 'HekimVizite', url: 'http://localhost:5034/api/HastaIlac/hasta/1' },

    // 7. HastaListesi.jsx & HastaDetay.jsx
    { component: 'HastaListesi', url: 'http://localhost:5034/api/Hasta' },
    { component: 'HastaDetay', url: 'http://localhost:5034/api/Hasta/1' },
    { component: 'HastaDetay', url: 'http://localhost:5034/api/VitalBulgu/hasta/1' },
    { component: 'HastaDetay', url: 'http://localhost:5034/api/HastaIlac/hasta/1' },
    { component: 'HastaDetay', url: 'http://localhost:5034/api/Muayene/hasta/1' },
    { component: 'HastaDetay', url: 'http://localhost:5034/api/HemsireNotu/hasta/1' },

    // 8. IlacListesi.jsx & IlacStokDetay.jsx
    { component: 'IlacListesi', url: 'http://localhost:5034/api/Ilac' },
    { component: 'IlacListesi', url: 'http://localhost:5034/api/IlacStok/uyarilar' },
    { component: 'IlacStokDetay', url: 'http://localhost:5034/api/Ilac/1' },
    { component: 'IlacStokDetay', url: 'http://localhost:5034/api/IlacStok/ilac/1' },

    // 9. HastahaneSevk.jsx
    { component: 'HastahaneSevk', url: 'http://localhost:5034/api/HastahaneSevk' },

    // 10. KadroYonetimi / Personel / Doktor
    { component: 'KadroYonetimi', url: 'http://localhost:5034/api/Personel' },
    { component: 'KadroYonetimi', url: 'http://localhost:5034/api/Doktor' },

    // 11. VardiyaTakvim & VardiyaRaporu & Gorev & Duyuru
    { component: 'VardiyaTakvim', url: 'http://localhost:5034/api/Nobet' },
    { component: 'VardiyaRaporu', url: 'http://localhost:5034/api/VardiyaRaporu' },
    { component: 'GorevPanosu', url: 'http://localhost:5034/api/Gorev' },
    { component: 'DuyuruPanosu', url: 'http://localhost:5034/api/Duyuru' },

    // 12. SistemLoglari.jsx
    { component: 'SistemLoglari', url: 'http://localhost:5034/api/Dashboard/aktivite-loglari?sayfa=1&limit=20' },
    { component: 'SistemLoglari (System Logs)', url: 'http://localhost:5034/api/Dashboard/logs?count=50' }
  ];

  let success = 0;
  let failure = 0;

  for (const item of frontendCalls) {
    try {
      const res = await fetch(item.url, { headers });
      if (res.ok) {
        console.log(`✅ [${res.status}] ${item.component.padEnd(20)} -> ${item.url.replace('http://localhost:5034', '')}`);
        success++;
      } else {
        console.log(`❌ [${res.status}] ${item.component.padEnd(20)} -> ${item.url.replace('http://localhost:5034', '')}`);
        failure++;
      }
    } catch (e) {
      console.log(`❌ [FAIL] ${item.component.padEnd(20)} -> ${e.message}`);
      failure++;
    }
  }

  console.log("\n==================================================");
  console.log(`📊 Component Call Test Results: ${success} Passed, ${failure} Failed`);
  console.log("==================================================\n");
}

testFrontendRoutes();
