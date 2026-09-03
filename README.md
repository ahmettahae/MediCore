# MediCore - Klinik ve Hasta Bakım Yönetim Sistemi

MediCore; huzurevleri, yaşlı bakım merkezleri ve yataklı klinik tesislerde hasta takibi, vital bulgu izlemi, hekim muayeneleri, saatlik ilaç dağıtımı (MAR) ve nöbet operasyonlarını tek bir merkezden yönetmek üzere geliştirilmiş tam yığın (full-stack) bir sağlık bilgi sistemidir.

Proje, T.C. Cumhurbaşkanlığı İletişim Başkanlığı staj programı kapsamında geliştirilmiştir.

---

## Mimari ve Teknoloji Yığını

Sistem, katmanlı servis mimarisi ve rol tabanlı yetkilendirme (RBAC) prensiplerine uygun olarak inşa edilmiştir.

* **Backend:** .NET 9 (ASP.NET Core Web API)
* **Frontend:** React 19, Vite, Tailwind CSS
* **Gerçek Zamanlı İletişim:** Microsoft ASP.NET Core SignalR (WebSocket)
* **Veritabanı ve ORM:** SQLite, Entity Framework Core 9.0 (Write-Ahead Logging modu)
* **Güvenlik ve Yetkilendirme:** JSON Web Token (JWT) Bearer Authentication, BCrypt parola hashleme
* **Loglama:** Serilog (Konsol ve Günlük Dosya Rotasyonu)
* **Test Altyapısı:** xUnit, Moq (.NET Unit Testing)

---

## Temel Modüller

1. **Yönetici ve Başhekim Paneli:** Kurum geneli doluluk, acil sevk oranları, kritik vital uyarıları ve personel kadro yönetimi.
2. **Toplu Vital Takibi ve Eşik Değerlendirme:** Tansiyon, nabız, ateş ve SpO2 değerlerinin toplu girişi ve kritik eşik aşımlarında SignalR üzerinden anlık alarm fırlatılması.
3. **İlaç Yönetimi ve MAR Paneli:** Eczane stok takibi, kritik seviye uyarıları ve saatlik dozaj uygulama matrisi.
4. **Hekim Vizite ve Muayene:** ICD-10 tanı protokolü, şikayet, klinik bulgu, tedavi planı ve 112 dış sevk yönetimi.
5. **Nöbet ve Vardiya Çizelgesi:** Hekim ve hemşire kadrosunun aylık nöbet planlaması ve dijital devir teslim tutanakları.
6. **KVKK Denetim İzi (Audit Log):** Sistemdeki tüm hasta, ilaç ve kullanıcı işlemlerinin zaman damgası ve kullanıcı kimliğiyle kayıt altına alınması.

---

## Kurulum ve Çalıştırma

Projeyi yerel ortamda çalıştırmak için .NET 9 SDK ve Node.js (v18+) gereklidir.

### 1. Backend Servisinin Başlatılması

```bash
cd MediCore.API
dotnet run
```

API varsayılan olarak `http://localhost:5034` portunda çalışır. Swagger arayüzüne `http://localhost:5034/swagger` adresinden erişilebilir.

### 2. Frontend Uygulamasının Başlatılması

Yeni bir terminal penceresinde:

```bash
cd MediCore.UI
npm install
npm run dev
```

Kullanıcı arayüzü `http://localhost:5173` adresinde yayına başlar.

---

## Birim Testleri

Backend katmanındaki tıbbi eşik kontrolleri, T.C. Kimlik doğrulama algoritmaları ve denetim mekanizmaları xUnit ile test edilmektedir.

Testleri çalıştırmak için:

```bash
dotnet test MediCore.Tests
```

---

## Varsayılan Test Kullanıcıları

Sisteme test amacıyla giriş yapmak için tanımlanmış roller:

* **Başhekim / Yönetici:** `ahmet.erol` (Şifre: `123`)
* **Kurum Hekimi:** `mehmet.oz` (Şifre: `123`)
* **Başhemşire:** `fatma.hemsire` (Şifre: `123`)
* **Hemşire:** `ayse.yilmaz` (Şifre: `123`)

---

## Geliştirici

* **Geliştirici:** Ahmet Taha Erol
* **Kurum:** T.C. Cumhurbaşkanlığı İletişim Başkanlığı Staj Programı
