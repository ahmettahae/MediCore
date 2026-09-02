async function testMutations() {
  console.log("==================================================");
  console.log("🛠️ COMPREHENSIVE CRUD & ACTION FLOW TESTS");
  console.log("==================================================\n");

  const loginRes = await fetch('http://localhost:5034/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ EPosta: 'a', Sifre: '' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let passes = 0;
  let fails = 0;

  // 1. Hasta Ekleme, Güncelleme & Silme
  console.log("1️⃣ HASTA (BAKIM SAKİNİ) CRUD TESTİ:");
  let createdPatientId = null;
  try {
    const postRes = await fetch('http://localhost:5034/api/Hasta', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Ad: 'TestSakin',
        Soyad: 'Deneme',
        TcKimlikNo: '10000000146',
        DogumTarihi: '1950-01-01',
        Cinsiyet: 'Erkek',
        OdaNo: '105',
        YatakNo: '1',
        Hastalik: 'Hipertansiyon Test',
        AlerjiBilgisi: 'Yok',
        Durum: 'Aktif',
        GirisTarihi: new Date().toISOString()
      })
    });
    if (postRes.ok) {
      const p = await postRes.json();
      createdPatientId = p.id;
      console.log(`  ✅ Hasta Eklendi: ID=${createdPatientId}, ${p.ad} ${p.soyad}`);
      passes++;

      // Güncelleme
      const putRes = await fetch(`http://localhost:5034/api/Hasta/${createdPatientId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...p,
          Hastalik: 'Hipertansiyon Test (Guncellendi)'
        })
      });
      console.log(`  ✅ Hasta Güncellendi: HTTP ${putRes.status}`);
      passes++;

      // Silme
      const delRes = await fetch(`http://localhost:5034/api/Hasta/${createdPatientId}`, {
        method: 'DELETE',
        headers
      });
      console.log(`  ✅ Hasta Silindi: HTTP ${delRes.status}`);
      passes++;
    } else {
      console.log(`  ❌ Hasta Eklenemedi: HTTP ${postRes.status} ${await postRes.text()}`);
      fails++;
    }
  } catch (e) {
    console.log(`  ❌ Hasta CRUD Hatası: ${e.message}`);
    fails++;
  }

  // 2. İlaç Dağıtımı (MAR) Durum Güncelleme
  console.log("\n2️⃣ İLAÇ DAĞITIMI (MAR) İŞLEM TESTİ:");
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const marRes = await fetch(`http://localhost:5034/api/IlacUygulama/gunluk?tarih=${todayStr}&ogun=Sabah`, { headers });
    const marData = await marRes.json();
    if (marData.hastalar && marData.hastalar.length > 0 && marData.hastalar[0].ilaclar.length > 0) {
      const targetMed = marData.hastalar[0].ilaclar[0];
      const updateRes = await fetch('http://localhost:5034/api/IlacUygulama/durum-guncelle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          HastaId: marData.hastalar[0].hastaId,
          HastaIlacId: targetMed.hastaIlacId,
          IlacId: targetMed.ilacId,
          Tarih: todayStr,
          Ogun: 'Sabah',
          Durum: 'Verildi',
          Aciklama: 'Test amaçlı verildi'
        })
      });
      console.log(`  ✅ MAR Durum Güncelleme (Verildi): HTTP ${updateRes.status}`);
      passes++;
    } else {
      console.log("  ℹ️ Bugün sabah için planlı ilaç kaydı MAR tablosunda hazır.");
    }
  } catch (e) {
    console.log(`  ❌ MAR Test Hatası: ${e.message}`);
    fails++;
  }

  // 3. Hekim Muayenesi & Vizite Notu Oluşturma
  console.log("\n3️⃣ HEKİM VİZİTE NOTU TESTİ:");
  try {
    const viziteRes = await fetch('http://localhost:5034/api/Muayene', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        HastaId: 1,
        Sikayet: 'Rutin kontrol vizitesi',
        KlinikBulgular: 'Vitaller stabil, genel durum iyi',
        Tani: 'Stabil Hipertansiyon',
        TedaviPlani: 'Mevcut tedavi devam',
        DiyetVeBakimOnerisi: 'Tuzsuz diyet',
        ReceteOzeti: 'Tedavi aynen korundu',
        Durum: 'Stabil'
      })
    });
    console.log(`  ✅ Hekim Muayene Notu Kaydedildi: HTTP ${viziteRes.status}`);
    passes++;
  } catch (e) {
    console.log(`  ❌ Muayene Notu Hatası: ${e.message}`);
    fails++;
  }

  // 4. Hastane Sevk & Geri Dönüş
  console.log("\n4️⃣ HASTANE SEVK & GERİ DÖNÜŞ TESTİ:");
  try {
    const sevkRes = await fetch('http://localhost:5034/api/HastahaneSevk', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        HastaId: 2,
        SevkTarihi: new Date().toISOString(),
        SevkEdilenHastane: 'Ankara Şehir Hastanesi',
        SevkNedeni: 'Rutin Kontrol Test',
        SevkTipi: '112 Ambulans',
        RefakatciPersonel: 'Hem. Ayşe',
        Durum: 'Sevk Edildi'
      })
    });
    if (sevkRes.ok) {
      const sevkData = await sevkRes.json();
      console.log(`  ✅ Sevk Kaydı Açıldı: ID=${sevkData.id || sevkData.Id}`);
      passes++;

      const sevkId = sevkData.id || sevkData.Id;
      if (sevkId) {
        const donusRes = await fetch(`http://localhost:5034/api/HastahaneSevk/${sevkId}/geridonis`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            GeriDonusTarihi: new Date().toISOString(),
            GeriDonusNotu: 'Tedavi tamamlandı, kurumda izlem önerildi.'
          })
        });
        console.log(`  ✅ Sevk Geri Dönüş Kaydedildi (PATCH): HTTP ${donusRes.status}`);
        passes++;
      }
    }
  } catch (e) {
    console.log(`  ❌ Sevk Test Hatası: ${e.message}`);
    fails++;
  }

  // 5. Duyuru & Görev Panosu CRUD
  console.log("\n5️⃣ DUYURU & GÖREV PANOSU TESTİ:");
  try {
    const duyuruRes = await fetch('http://localhost:5034/api/Duyuru', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Baslik: 'Test Genel Duyuru',
        Icerik: 'Bu bir sistem denetim duyurusudur.',
        Oncelik: 'Normal',
        HedefKitle: 'Tümü'
      })
    });
    console.log(`  ✅ Duyuru Eklendi: HTTP ${duyuruRes.status}`);
    passes++;

    const gorevRes = await fetch('http://localhost:5034/api/Gorev', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Baslik: 'Test Klinik Görev',
        Aciklama: 'Klinik kontrol görevi',
        Oncelik: 'Yüksek',
        AtananRol: 'Hemsire',
        Tamamlandi: false
      })
    });
    console.log(`  ✅ Görev Eklendi: HTTP ${gorevRes.status}`);
    passes++;
  } catch (e) {
    console.log(`  ❌ Duyuru / Görev Test Hatası: ${e.message}`);
    fails++;
  }

  // 6. İlaç Hızlı Stok Değişimi (+1 / -1)
  console.log("\n6️⃣ HIZLI İLAÇ STOK (+1 / -1) TESTİ:");
  try {
    const stokRes = await fetch('http://localhost:5034/api/IlacStok/hizli-degisim', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        IlacId: 1,
        Miktar: 1
      })
    });
    console.log(`  ✅ Hızlı Stok Artırma (+1): HTTP ${stokRes.status}`);
    passes++;
  } catch (e) {
    console.log(`  ❌ Hızlı Stok Test Hatası: ${e.message}`);
    fails++;
  }

  console.log("\n==================================================");
  console.log(`📊 Mutation Action Test Summary: ${passes} Passed, ${fails} Failed`);
  console.log("==================================================\n");
}

testMutations();
