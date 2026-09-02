# 🎓 MediCore — Staj Proje Sunumu ve Savunma Rehberi

Bu doküman; **T.C. Cumhurbaşkanlığı Staj Programı** kapsamında geliştirdiğiniz **MediCore** projesini staj sorumlusuna ve değerlendirme jürisine sunarken kullanabileceğiniz **konuşma akışı, teknik savunma argümanları, canlı demo sırası ve gelebilecek muhtemel soruların cevaplarını** içerir.

---

## ⏱️ BÖLÜM 1: 30 Saniyelik Asansör Konuşması (Giriş)

> *"Sayın Hocam / Değerli Yöneticim;*  
> *Staj dönemim boyunca geliştirdiğim **MediCore**, huzurevleri, palyatif bakım ve geriatri merkezlerinin operasyonel klinik süreçlerini sıfır hata ve tam şeffaflıkla dijitalleştiren yeni nesil bir **Klinik ve Hasta Bakım Bilgi Sistemi**dir.*  
> *Sistem; .NET 9 Web API ve React 19 mimarisi üzerinde, **SignalR WebSocket** ile anlık kritik hasta alarmları, saatlik ilaç dağıtım matrisi, hekim viziteleri ve dijital vardiya devir teslimini tek bir çatı altında toplar."*

---

## 🖥️ BÖLÜM 2: Canlı Demo Gösterim Sırası (5-7 Dakikalık Akış)

Sunum sırasında tarayıcıyı açıp sırasıyla şu adımları gösterin:

### 1. Adım: Giriş Ekranı ve RBAC (Rol Tabanlı Erişim)
* **Ne Söyleyeceksiniz:**  
  *"Sistemde Rol Tabanlı Yetkilendirme (RBAC) uygulanmıştır. Başhekim, Kurum Hekimi, Başhemşire ve İdari Yönetici olmak üzere 4 farklı rol için izole edilmiş dashboard'lar açılmaktadır."*
* **Ne Yapacaksınız:**  
  Giriş ekranındaki hızlı butonlardan **Başhekim** olarak giriş yapıp kurum geneli doluluk, aktif alarmlar ve özet grafikleri gösterin.

### 2. Adım: Toplu Vital Girişi ve Canlı Sesli Alarm Testi
* **Ne Söyleyeceksiniz:**  
  *"Hemşirelerin servis genelindeki tüm hastaların vital bulgularını saniyeler içinde girebildiği Toplu Vital Matrisi geliştirdim. Kritik eşik aşıldığında SignalR ve tarayıcının yerel Web Audio API'si ile tüm sisteme anlık görsel ve 3 tonlu sesli tıbbi alarm fırlatılır."*
* **Ne Yapacaksınız:**  
  `/toplu-vital` sayfasına gidin. Üstteki **"Alarm Sesini Sına"** butonuna basarak sesi dinletin. Ardından bir hastaya **Nabız: 140** veya **Ateş: 39.5** girip kaydedin; sağ üstte Toast uyarısının çıktığını ve sesin çaldığını gösterin.

### 3. Adım: Saatlik İlaç Dağıtım Matrisi (MAR)
* **Ne Söyleyeceksiniz:**  
  *"İlaç uygulama hatalarını sıfırlamak için Sabah, Öğle, Akşam ve Gece periyotlarına ayrılmış özel bir İlaç Dağıtım (MAR) matrisi tasarladım. Ağır kütüphaneler yerine saf HTML ve Tailwind ile ultra hafif ve hızlı bir yapı kuruldu."*
* **Ne Yapacaksınız:**  
  `/ilac-dagitim` sayfasına gidin; Sabah/Öğle/Akşam sekmelerini değiştirin, bir ilaca *"Uygulandı"* veya neden belirterek *"Hasta Reddetti"* durumunu verin.

### 4. Adım: Hekim Vizite ve Muayene Modülü
* **Ne Söyleyeceksiniz:**  
  *"Kurum hekiminin hasta başında fiziki muayene bulgularını, ICD-10 tanısını ve tedavi protokolünü işleyebildiği entegre vizite modülü mevcuttur."*
* **Ne Yapacaksınız:**  
  `/vizite` sayfasına girip hastanın geçmiş vizite kartlarını ve ilaç reçeteleme alanını gösterin.

### 5. Adım: Dış Hastane Sevk & 112 Koordinasyonu
* **Ne Söyleyeceksiniz:**  
  *"Acil veya ileri tetkik gerektiren hastalar için 112 ambulans durumu, hedef hastane ve refakatçi takibi yapılmakta; hasta kuruma geri döndüğünde epikriz notuyla süreç tamamlanmaktadır."*
* **Ne Yapacaksınız:**  
  `/sevkler` sayfasından sevk sürecini gösterin.

### 6. Adım: Vardiya Takvimi, Nöbetler ve Teslim Raporu
* **Ne Söyleyeceksiniz:**  
  *"Aylık interaktif takvimde hekim ve hemşire nöbetleri planlanır. Vardiya değişiminde sonraki ekibe kritik hasta durumlarını aktaran Dijital Teslim Raporu oluşturulur."*

### 7. Adım: Tam Denetim İzi (Audit Trail)
* **Ne Söyleyeceksiniz:**  
  *"KVKK ve sağlık mevzuatına uygun olarak sistemdeki her hasta silme, reçete veya sevk işlemi kullanıcı adı, rolü ve IP adresi ile loglanmaktadır."*
* **Ne Yapacaksınız:**  
  `/sistem-loglari` sayfasını açıp anlık log kayıtlarını gösterin.

---

## 🎯 BÖLÜM 3: Soru - Cevap (Hangi Soruya Nasıl Cevap Verilmeli?)

### Soru 1: "Frontend API haberleşmesi ve State yönetiminde ne kullandın?"
* **Cevabınız:**  
  *"API istekleri için harici paket yükü getirmemek adına modern tarayıcıların yerleşik **Native Fetch API**'sini tercih ettim. Global kullanıcı oturumu, anlık bildirimler ve toast mesajları için Redux gibi ağır yapılar yerine React'in yerel **Context API**'sini (`AuthContext`, `NotificationContext`, `ToastContext`) ve özel hook'ları kullandım."*

---

### Soru 2: "Backend mimarisini nasıl kurguladın?"
* **Cevabınız:**  
  *"Backend tarafında .NET 9 ASP.NET Core üzerinde **Controller-Tabanlı RESTful Web API** mimarisini uyguladım. Proje içerisinde Controllers, DTOs, Entities, Helpers, Hubs ve Data (`AppDbContext`) modülleri katmanlı ve birbirinden bağımsız (Separation of Concerns) şekilde organize edilmiştir."*

---

### Soru 3: "SignalR bağlantısı koparsa sistem nasıl davranıyor?"
* **Cevabınız:**  
  *"İstemci tarafında `@microsoft/signalr` paketinde `.withAutomaticReconnect()` fonksiyonunu yapılandırdım. Ağ veya sunucu geçici olarak kesilirse istemci arka planda otomatik olarak tekrar bağlanmayı dener; kullanıcıya herhangi bir sayfa çökmesi yaşatmaz."*

---

### Soru 4: "Sesli alarm için harici ses dosyası mı kullandın?"
* **Cevabınız:**  
  *"Hayır, harici `.mp3/.wav` indirmeleri ağ gecikmelerine, internet kesintilerine veya CORS engellerine takılabildiği için doğrudan tarayıcının yerleşik **Web Audio API (`AudioContext`)** sentezleyicisini kullandım. 3 kademeli tıbbi testere dişi dalgalar (sawtooth oscillator) ile %100 yerel ve kesintisiz tıbbi monitör alarmı üretilmektedir."*

---

### Soru 5: "SQLite dosya tabanlı, eş zamanlı okuma/yazmada (concurrency) 'Database Locked' sorunu yaşadın mı?"
* **Cevabınız:**  
  *"SQLite'ın bu kısıtlamasını aşmak için veritabanını **WAL (Write-Ahead Logging)** moduna geçirdim (`.db-wal` ve `.db-shm`). Bu sayede okuma ve yazma işlemleri birbirini kilitlemeden paralel yürütülmektedir. Ayrıca Entity Framework Core katmanındaki tüm operasyonlar uçtan uca non-blocking `async/await` mimarisiyle yazılmıştır."*

---

### Soru 6: "Kayıt silme işlemlerinde veri kaybını nasıl engelliyorsun?"
* **Cevabınız:**  
  *"Klinik süreçlerde hastalar sistemden silinmez; `Durum` (*Aktif / Taburcu / Hastanede*) ve `CikisTarihi` alanları üzerinden yaşam döngüsü takip edilir. Veritabanı seviyesindeki silme işlemlerinde ise `AuditLogger` devreye girerek silinen kaydın tüm detayını aktivite günlüğüne yazar."*

---

### Soru 7: "Projeyi test ettin mi?"
* **Cevabınız:**  
  *"Evet; backend tarafında **xUnit** ile 32 adet otomatik birim testi yazdım. Bu testler kritik vital eşik hesaplamalarını (`VitalEvaluatorTests`), T.C. Kimlik doğrulama algoritmalarını (`ValidationHelperTests`) ve aktivite log mekanizmasını (`AktiviteLogTests`) doğrulamaktadır. Testlerin başarı oranı **%100 (32/32 Passed)**'dir."*

---

## 📂 BÖLÜM 4: Sunumda Açıp Gösterebileceğiniz Kod Dosyaları

Jüri kodları görmek isterse şu dosyaları açabilirsiniz:

| Modül / Özellik | Açılacak Dosya Yolu | Vurgulanacak Nokta |
| :--- | :--- | :--- |
| **Sesli Alarm Motoru** | `MediCore.UI/src/utils/sound.js` | `AudioContext`, frekans osilatörü |
| **SignalR Dinleyicisi** | `MediCore.UI/src/App.jsx` (L150-195) | `.withAutomaticReconnect()`, `ReceiveNotification` |
| **Toplu Vital & Eşikler** | `MediCore.API/Controllers/VitalBulguController.cs` (L90-136) | `CheckAndSendVitalAlert`, `Clients.All.SendAsync` |
| **MAR İlaç Dağıtımı** | `MediCore.UI/src/components/IlacDagitimPaneli.jsx` | 4 zaman dilimi, optimistic update |
| **Birim Testleri** | `MediCore.Tests/VitalEvaluatorTests.cs` | xUnit `[Theory]` ve `[InlineData]` testleri |
| **Veritabanı & Seed** | `MediCore.API/Data/DbInitializer.cs` | Otomatik sahte veri üretimi, şifre hashleme |
| **Denetim İzi (Audit)** | `MediCore.API/Helpers/AuditLogger.cs` | Bağımsız asenkron işlem loglama |

---

## 🌟 BÖLÜM 5: Kapanış Cümlesi

> *"MediCore, kağıt üzerindeki hasta takibini ortadan kaldırarak hem sağlık personelinin iş yükünü hafifletmekte hem de anlık alarmlarla hasta güvenliğini en üst düzeye çıkarmaktadır. İlginiz ve dinlediğiniz için teşekkür ederim, sorularınızı yanıtlamaktan memnuniyet duyarım."*
