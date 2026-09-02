async function runAudit() {
  console.log("=========================================");
  console.log("🏥 MEDICORE FULL END-TO-END AUDIT SUITE");
  console.log("=========================================\n");

  // 1. Check Login with all roles
  const roles = [
    { key: 'a', roleName: 'Başhekim' },
    { key: 'bh', roleName: 'Başhemşire' },
    { key: 'd', roleName: 'Kurum Hekimi' },
    { key: 'h', roleName: 'Hemşire' },
    { key: 'y', roleName: 'İdari Yönetici' }
  ];

  let adminToken = null;

  console.log("🔑 1. AUTHENTICATION & ROLE SHORTCUT TESTS:");
  for (const r of roles) {
    try {
      const res = await fetch('http://localhost:5034/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EPosta: r.key, Sifre: '' })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        console.log(`  ✅ [OK] Role: ${r.roleName} (${r.key}) -> Logged in as: ${data.ad} ${data.soyad} [${data.rol}]`);
        if (r.key === 'a') adminToken = data.token;
      } else {
        console.log(`  ❌ [FAIL] Role: ${r.roleName} -> Status: ${res.status}, Msg: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      console.log(`  ❌ [ERROR] Login ${r.key}: ${e.message}`);
    }
  }

  // 2. Test Invalid Login
  console.log("\n🔒 2. SECURITY & INVALID CREDENTIAL TEST:");
  try {
    const res = await fetch('http://localhost:5034/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ EPosta: 'non_existent_user', Sifre: 'wrongpass' })
    });
    if (res.status === 401 || res.status === 400) {
      console.log(`  ✅ [OK] Invalid user rejected with HTTP ${res.status}`);
    } else {
      console.log(`  ⚠️ [WARN] Unexpected status for invalid user: ${res.status}`);
    }
  } catch (e) {
    console.log(`  ❌ [ERROR]: ${e.message}`);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // 3. Core API Endpoints
  const endpoints = [
    { name: 'Dashboard Genel Ozet', path: '/api/Dashboard/ozet', method: 'GET' },
    { name: 'Dashboard Uyarilar', path: '/api/Dashboard/uyarilar', method: 'GET' },
    { name: 'Hasta Listesi (Aktif/Kurumda)', path: '/api/Hasta', method: 'GET' },
    { name: 'Ilac Listesi', path: '/api/Ilac', method: 'GET' },
    { name: 'Ilac Stok Uyarilari', path: '/api/IlacStok/uyarilar', method: 'GET' },
    { name: 'Ilac Uygulama Ozet (MAR)', path: `/api/IlacUygulama/ozet?tarih=${todayStr}`, method: 'GET' },
    { name: 'Ilac Uygulama Gunluk (MAR)', path: `/api/IlacUygulama/gunluk?tarih=${todayStr}&ogun=Sabah`, method: 'GET' },
    { name: 'Vital Bulgular (Son Durumlar)', path: '/api/VitalBulgu/son-durumlar', method: 'GET' },
    { name: 'Nobet Gunluk', path: `/api/Nobet/gunluk?tarih=${todayStr}`, method: 'GET' },
    { name: 'Nobet Bugun', path: '/api/Nobet/bugun', method: 'GET' },
    { name: 'Duyuru Panosu', path: '/api/Duyuru', method: 'GET' },
    { name: 'Gorev Panosu', path: '/api/Gorev', method: 'GET' },
    { name: 'Hastane Sevk Listesi', path: '/api/HastahaneSevk', method: 'GET' },
    { name: 'Vardiya Teslim Raporlari', path: '/api/VardiyaRaporu', method: 'GET' },
    { name: 'Personel Listesi', path: '/api/Personel', method: 'GET' },
    { name: 'Doktor Listesi', path: '/api/Doktor', method: 'GET' },
    { name: 'Aktivite / Sistem Loglari', path: '/api/Dashboard/aktivite-loglari?sayfa=1&limit=20', method: 'GET' }
  ];

  console.log("\n📡 3. REST API ENDPOINT INTEGRATION AUDIT:");
  let passCount = 0;
  let failCount = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:5034${ep.path}`, {
        method: ep.method,
        headers: authHeaders
      });
      const text = await res.text();
      let info = '';
      if (res.ok) {
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) info = `[Array items: ${json.length}]`;
          else if (typeof json === 'object') info = `[Object keys: ${Object.keys(json).length}]`;
        } catch (e) {
          info = `[Text length: ${text.length}]`;
        }
        console.log(`  ✅ HTTP ${res.status} | ${ep.name} ${info}`);
        passCount++;
      } else {
        console.log(`  ❌ HTTP ${res.status} | ${ep.name} - Path: ${ep.path} - Resp: ${text.substring(0, 100)}`);
        failCount++;
      }
    } catch (e) {
      console.log(`  ❌ FAIL | ${ep.name}: ${e.message}`);
      failCount++;
    }
  }

  // 4. Functional Business Flow Tests
  console.log("\n🧪 4. FUNCTIONAL BUSINESS FLOW TESTS:");
  
  try {
    const hastalarRes = await fetch('http://localhost:5034/api/Hasta', { headers: authHeaders });
    const hastalar = await hastalarRes.json();
    if (hastalar.length > 0) {
      const p = hastalar[0];
      console.log(`  ℹ️ Testing sub-resources for Resident: ${p.ad} ${p.soyad} (ID: ${p.id})`);
      
      const vRes = await fetch(`http://localhost:5034/api/VitalBulgu/hasta/${p.id}`, { headers: authHeaders });
      console.log(`    - Vital Bulgulari: HTTP ${vRes.status} (Records: ${(await vRes.json()).length})`);

      const mRes = await fetch(`http://localhost:5034/api/Muayene/hasta/${p.id}`, { headers: authHeaders });
      console.log(`    - Muayene Gecmisi: HTTP ${mRes.status} (Records: ${(await mRes.json()).length})`);

      const iRes = await fetch(`http://localhost:5034/api/HastaIlac/hasta/${p.id}`, { headers: authHeaders });
      console.log(`    - Ilac Tedavileri: HTTP ${iRes.status} (Records: ${(await iRes.json()).length})`);
    }
  } catch (e) {
    console.log(`  ❌ Patient sub-resource test error: ${e.message}`);
  }

  // 5. Test Frontend Web Server Delivery
  console.log("\n🌐 5. FRONTEND DEV SERVER TEST:");
  try {
    const frontRes = await fetch('http://localhost:5173/');
    console.log(`  ✅ Frontend index.html served: HTTP ${frontRes.status}`);
  } catch (e) {
    console.log(`  ❌ Frontend dev server unreachable: ${e.message}`);
  }

  console.log("\n=========================================");
  console.log(`📊 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log("=========================================\n");
}

runAudit();
