# 📚 MediCore Projesi — Staj Raporu Görsel Kataloğu ve Şekil Rehberi

> **Proje Adı:** MediCore — Klinik ve Hasta Bakım Bilgi Sistemi  
> **Staj Kurumu:** T.C. Cumhurbaşkanlığı İletişim Başkanlığı  
> **Geliştirici:** Ahmet Taha EROL  
> **Tarih:** 2026  
> **Çözünürlük:** Ultra HD (1600x1050 / Vektörel SVG & Yüksek DPI PNG)

Bu rehber; **T.C. Cumhurbaşkanlığı Staj Raporunuzda** veya **Üniversite Bitirme Tezinizde** doğrudan kullanabilmeniz için hazırlanmış tüm teknik mimari şemalarını, ER diyagramlarını ve canlı kullanıcı arayüzü ekran görüntülerini içermektedir.

Aşağıdaki şekil numaralarını, başlıklarını ve akademik açıklama paragraflarını **doğrudan Word / LaTeX / Google Docs raporunuza kopyalayıp yapıştırabilirsiniz.**

---

## 📑 İÇİNDEKİLER VE ŞEKİL LİSTESİ

### 1. Kısım: Sistem Mimarisi, ERD ve Süreç Diyagramları
* **Şekil 1.1:** [MediCore Katmanlı Sistem ve Yazılım Mimarisi](#şekil-11-medicore-katmanlı-sistem-ve-yazılım-mimarisi)
* **Şekil 1.2:** [Veritabanı Varlık-İlişki (ER) Diyagramı](#şekil-12-veritabanı-varlık-ilişki-er-diyagramı)
* **Şekil 1.3:** [SignalR WebSocket & Web Audio API Kritik Sesli Alarm Akışı](#şekil-13-signalr-websocket--web-audio-api-kritik-sesli-alarm-akışı)
* **Şekil 1.4:** [Saatlik İlaç Dağıtımı (MAR) Durum Makinesi ve Süreç Döngüsü](#şekil-14-saatlik-ilaç-dağıtımı-mar-durum-makinesi-ve-süreç-döngüsü)
* **Şekil 1.5:** [Rol Tabanlı Erişim ve Yetkilendirme Matrisi (RBAC)](#şekil-15-rol-tabanlı-erişim-ve-yetkilendirme-matrisi-rbac)
* **Şekil 1.6:** [Uçtan Uca İstek-Yanıt ve SignalR Geri Dönüş Akış Şeması](#şekil-16-uçtan-uca-i̇stek-yanıt-ve-signalr-geri-dönüş-akış-şeması)
* **Şekil 1.7:** [Ana Veritabanı İlişkileri ve Kardinalite Haritası (1:N ve M:N)](#şekil-17-ana-veritabanı-i̇lişkileri-ve-kardinalite-haritası-1n-ve-mn)
* **Şekil 1.8:** [Rol Tabanlı Erişim (RBAC) Hiyerarşi Ağacı](#şekil-18-rol-tabanlı-erişim-rbac-hiyerarşi-ağacı)

### 2. Kısım: Canlı Sistem Kullanıcı Arayüzü (UI Ekran Görüntüleri)
* **Şekil 2.1:** [Sistem Giriş Ekranı ve Rol Tabanlı Kimlik Doğrulama](#şekil-21-sistem-giriş-ekranı-ve-rol-tabanlı-kimlik-doğrulama)
* **Şekil 2.2:** [Başhekim ve Yönetici Ana Kontrol Paneli (Dashboard)](#şekil-22-başhekim-ve-yönetici-ana-kontrol-paneli-dashboard)
* **Şekil 2.3:** [Toplu Vital Bulgular Matrisi ve Renk Kodlu Eşik Takibi](#şekil-23-toplu-vital-bulgular-matrisi-ve-renk-kodlu-eşik-takibi)
* **Şekil 2.4:** [Anlık Kritik Tıbbi Alarm ve Sesli Uyarı Ekranı](#şekil-24-anlık-kritik-tıbbi-alarm-ve-sesli-uyarı-ekranı)
* **Şekil 2.5:** [Saatlik İlaç Dağıtım Paneli (MAR - Medication Administration Record)](#şekil-25-saatlik-ilaç-dağıtım-paneli-mar)
* **Şekil 2.6:** [Hekim Muayene, Vizite ve ICD-10 Tanı Modülü](#şekil-26-hekim-muayene-vizite-ve-icd-10-tanı-modülü)
* **Şekil 2.7:** [Klinik Bakım Sakinleri (Hasta) Yönetim ve Detay Paneli](#şekil-27-klinik-bakım-sakinleri-hasta-yönetim-ve-detay-paneli)
* **Şekil 2.8:** [112 Acil Koordinasyonu ve Hastane Dış Sevk Modülü](#şekil-28-112-acil-koordinasyonu-ve-hastane-dış-sevk-modülü)
* **Şekil 2.9:** [Aylık İnteraktif Personel Nöbet ve Vardiya Çizelgesi](#şekil-29-aylık-i̇nteraktif-personel-nöbet-ve-vardiya-çizelgesi)
* **Şekil 2.10:** [İlaç Kataloğu, Stok Takibi ve Kritik Eşik Uyarıları](#şekil-210-i̇laç-kataloğu-stok-takibi-ve-kritik-eşik-uyarıları)
* **Şekil 2.11:** [Dijital Vardiya Devir Teslim Tutanağı ve Nöbetçi Raporu](#şekil-211-dijital-vardiya-devir-teslim-tutanağı-ve-nöbetçi-raporu)
* **Şekil 2.12:** [Kurum Geneli Duyuru ve Dinamik Görev Panosu](#şekil-212-kurum-geneli-duyuru-ve-dinamik-görev-panosu)
* **Şekil 2.13:** [Sistem Denetim İzi (Audit Trail) ve KVKK Uyumlu Aktivite Logları](#şekil-213-sistem-denetim-i̇zi-audit-trail-ve-kvkk-uyumlu-aktivite-logları)
* **Şekil 2.14:** [Klinik Gece Nöbeti Modu (Dark Theme) Arayüzü](#şekil-214-klinik-gece-nöbeti-modu-dark-theme-arayüzü)
* **Şekil 2.15:** [ASP.NET Core Web API Swagger (OpenAPI) Servis Dokümantasyonu](#şekil-215-aspnet-core-web-api-swagger-openapi-servis-dokümantasyonu)

### 3. Kısım: Veritabanı Yönetimi ve Tablo Veri Görselleri (Database Studio)
* **Şekil 3.1:** [SQLite Database Studio Genel Bakış ve Tablo Ağacı](#şekil-31-sqlite-database-studio-genel-bakış-ve-tablo-ağacı)
* **Şekil 3.2:** [Hastalar Tablosu Fiziki Veri Kayıtları (Data Grid)](#şekil-32-hastalar-tablosu-fiziki-veri-kayıtları-data-grid)
* **Şekil 3.3:** [VitalBulgular Tablosu ve Tıbbi Eşik Kayıtları](#şekil-33-vitalbulgular-tablosu-ve-tıbbi-eşik-kayıtları)
* **Şekil 3.4:** [İlaçlar Kataloğu ve Eczane Stok Envanteri Tablosu](#şekil-34-i̇laçlar-kataloğu-ve-eczane-stok-envanteri-tablosu)
* **Şekil 3.5:** [HekimMuayeneleri (Vizite & Tanı) Tablosu](#şekil-35-hekimmuayeneleri-vizite--tanı-tablosu)
* **Şekil 3.6:** [AktiviteLoglari Tablosu (KVKK Uyumlu Audit Trail)](#şekil-36-aktiviteloglari-tablosu-kvkk-uyumlu-audit-trail)
* **Şekil 3.7:** [İlişkisel SQL Sorgusu ve Sonuç Tablosu (SQL Console)](#şekil-37-i̇lişkisel-sql-sorgusu-ve-sonuç-tablosu-sql-console)
* **Şekil 3.8:** [Veritabanı Tablo Tasarımı ve DDL Şema Tanımları](#şekil-38-veritabanı-tablo-tasarımı-ve-ddl-şema-tanımları)

---

## 📐 BÖLÜM 1: TEKNİK MİMARİ VE SÜREÇ DİYAGRAMLARI

### Şekil 1.1: MediCore Katmanlı Sistem ve Yazılım Mimarisi
* **Dosya:** `rapor_gorselleri/diyagramlar/01_sistem_mimarisi.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.1'de MediCore projesinin uçtan uca katmanlı mimarisi (N-Tier Architecture) modellenmiştir. İstemci tarafında React 19 ve TailwindCSS altyapısıyla geliştirilen SPA (Single Page Application), arka uçta .NET 9 ASP.NET Core RESTful Web API ile haberleşmektedir. Sistem, anlık kritik vital alarmlarını iletmek üzere ASP.NET Core SignalR WebSocket ağ geçidini kullanır. Veri saklama katmanında Entity Framework Core 9.0 ORM ve SQLite veritabanı yer almakta; eş zamanlı okuma/yazma kilitlenmelerini önlemek adına WAL (Write-Ahead Logging) modu aktif edilmiştir. Güvenlik katmanında JWT Bearer token ve rol bazlı erişim denetimi (RBAC) uygulanmıştır."*

---

### Şekil 1.2: Veritabanı Varlık-İlişki (ER) Diyagramı
* **Dosya:** `rapor_gorselleri/diyagramlar/02_veritabani_er_diyagrami.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.2'de veritabanı şemasında yer alan 10 temel varlık ve aralarındaki ilişkiler gösterilmektedir. `Hastalar` tablosu sistemin merkezinde bulunmakta olup; `VitalBulgular`, `HekimMuayeneleri`, `HastaIlaclari` ve `HastahaneSevk` tablolarıyla bire-çok (1:N) ilişkiye sahiptir. `Ilaclar` ve `HastaIlaclari` üzerinden saatlik dağıtım durumunu kaydeden `IlacUygulamalari` (MAR) tablosuna bağlanılmıştır. KVKK ve denetim gereksinimleri için `AktiviteLoglari` tablosu tüm veri mutasyonlarını kullanıcı adı, IP ve işlem türüyle kayıt altına almaktadır."*

---

### Şekil 1.3: SignalR WebSocket & Web Audio API Kritik Sesli Alarm Akışı
* **Dosya:** `rapor_gorselleri/diyagramlar/03_signalr_kritik_alarm_akisi.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.3'te hemşirenin vital değer girmesiyle başlayan anlık alarm döngüsü dizilim diyagramı (sequence diagram) olarak sunulmuştur. Hemşire kritik bir değer girdiğinde (örn. Nabız > 120 veya Ateş > 38.5°C), Backend API'deki `VitalEvaluator` servisi eşik aşımını doğrular ve veritabanına kaydettikten sonra SignalR Hub üzerinden bağlı tüm istemcilere 20 milisaniyenin altında WebSocket yayını fırlatır. İstemciler harici bir ses dosyasına ihtiyaç duymaksızın tarayıcının yerel Web Audio API (`AudioContext`) osilatörünü tetikleyerek kesintisiz 3 kademeli tıbbi alarm sesi üretir ve görsel uyarıyı ekrana basar."*

---

### Şekil 1.4: Saatlik İlaç Dağıtımı (MAR) Durum Makinesi ve Süreç Döngüsü
* **Dosya:** `rapor_gorselleri/diyagramlar/04_ilac_dagitim_mar_dongusu.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.4'te saatlik ilaç uygulama (MAR) modülünün durum makinesi görülmektedir. Hekimin reçete ettiği tedavi protokolü, her gün için Sabah, Öğle, Akşam ve Gece periyotlarına ayrılmış çizelgelere otomatik dönüştürülür. Hemşire hasta başında ilacı uyguladığında sistem tek tıkla 'Uygulandı' durumuna geçer ve ilişkili ilaç stokunu 1 adet düşürür. Hastanın reddetmesi durumunda ret gerekçesi zorunlu tutularak stok düşümü engellenir ve hekime sistem bildirimi gönderilir."*

---

### Şekil 1.5: Rol Tabanlı Erişim ve Yetkilendirme Matrisi (RBAC)
* **Dosya:** `rapor_gorselleri/diyagramlar/05_rbac_yetki_matrisi.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.5'te Başhekim/Admin, Kurum Hekimi, Başhemşire/Hemşire ve İdari İzleyici rollerinin sistem fonksiyonlarına erişim sınırları matris halinde özetlenmiştir. Frontend arayüzünde menülerin gizlenmesine ek olarak, sunucu tarafında ASP.NET Core `[Authorize(Roles = "...")]` nitelikleriyle API uç noktaları korunmakta, yetkisiz istekler HTTP 403 Forbidden durum koduyla reddedilmektedir."*

---

### Şekil 1.6: Uçtan Uca İstek-Yanıt ve SignalR Geri Dönüş Akış Şeması
* **Dosya:** `rapor_gorselleri/diyagramlar/ozel_sistem_mimarisi_akis_semasi.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.6'da kullanıcının React 19 arayüzünden başlattığı bir klinik işlemin (örn. Toplu Vital bulgusu veya MAR ilaç kaydı) uçtan uca döngüsü modellenmiştir. 1. Adımda istemci, JWT Bearer kimlik bilgisiyle REST API'ye HTTP POST isteği gönderir. 2. Adımda .NET 9 Web API güvenlik doğrulamalarını ve 'VitalEvaluator' tıbbi eşik analizini tamamlayarak Entity Framework Core üzerinden SQLite veritabanına asenkron yazma komutunu iletir. 3. Adımda SQLite WAL (Write-Ahead Logging) modunda 2.4 ms sürede transaction tamamlanır. 4. ve 5. Adımlarda ise kritik alarm tespit edilmişse ASP.NET Core SignalR 'KlinikHub' ağ geçidi tetiklenerek bağlı tüm sağlık personeli ekranlarına anlık WebSocket bildirimi basılır ve tarayıcının yerel Web Audio API osilatörü ile 3 kademeli sesli alarm çalınır."*

---

### Şekil 1.7: Ana Veritabanı İlişkileri ve Kardinalite Haritası (1:N ve M:N)
* **Dosya:** `rapor_gorselleri/diyagramlar/ozel_veritabani_iliskileri_haritasi.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.7'de MediCore sisteminin temel varlıkları arasındaki kardinalite haritası gösterilmektedir. 'Doktorlar' tablosu ile 'HekimMuayeneleri' tablosu arasında Bire-Çok (1:N), 'Hastalar' ile 'HekimMuayeneleri' arasında Bire-Çok (1:N) ilişki kurulmuştur. Sistemin en kritik ilişkilerinden biri olan hasta ve reçete edilen ilaçlar arasındaki Çoka-Çok (M:N) bağıntı ise 'HastaIlaclari' köprü tablosu (junction table) üzerinden modellenmiştir. Bir hastaya birden fazla ilaç reçetelenirken, aynı ilaç birden fazla hastaya atanabilmektedir. Bu köprü tablo üzerinden saatlik dağıtım durumunu tutan 'IlacUygulamalari' (MAR) tablosuna ve 'VitalBulgular' ölçümlerine 1:N ilişkilerle bağlanılmıştır."*

---

### Şekil 1.8: Rol Tabanlı Erişim (RBAC) Hiyerarşi Ağacı
* **Dosya:** `rapor_gorselleri/diyagramlar/ozel_rbac_hiyerarsi_agaci.png` (vektörel: `.svg`)
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 1.8'de sistemin Rol Tabanlı Yetkilendirme (RBAC) yapısı hiyerarşik bir karar ve izin ağacı (tree hierarchy) olarak sunulmuştur. Güvenlik kökünden (Root) türeyen 3 temel rol; 'Başhekim / Yönetici', 'Kurum Hekimi' ve 'Başhemşire / Hemşire' olmak üzere izole edilmiştir. Başhekim rolü İK kadro yönetimi, aylık nöbet onayları, kurumsal duyurular ve KVKK aktivite denetim izlerine (Audit Trail) tam yetkiyle erişirken; Kurum Hekimi hasta muayenesi, ICD-10 tanı koyma ve ilaç tedavisi reçeteleme dallarında tam yetkilidir. Başhemşire ve sağlık personeli ise toplu vital girişi, saatlik MAR matrisi ve nöbet teslim raporu modüllerini yürütmekte; yetki aşımı gerektiren tanı/ilaç reçeteleme alanlarına erişememektedir."*

---

## 🖥️ BÖLÜM 2: CANLI SİSTEM KULLANICI ARAYÜZÜ EKRANLARI

### Şekil 2.1: Sistem Giriş Ekranı ve Rol Tabanlı Kimlik Doğrulama
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/01_giris_ekrani.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.1'de MediCore sisteminin modern sağlık estetiğiyle tasarlanan giriş ekranı görülmektedir. Sistemde e-posta ve şifre girişinin yanı sıra, demo ve test süreçlerinde farklı rolleri hızlıca test edebilmek amacıyla Başhekim, Hekim, Hemşire ve Yönetici rolleri için tek tıkla oturum açma butonları konumlandırılmıştır."*

---

### Şekil 2.2: Başhekim ve Yönetici Ana Kontrol Paneli (Dashboard)
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/02_yonetici_dashboard.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.2'de Başhekim rolüyle giriş yapıldığında açılan kurumsal yönetim paneli yer almaktadır. Panel üzerinde toplam bakım sakini, doluluk oranı, kritik durumdaki hastalar, gün içinde uygulanan ilaç yüzdeleri ve aktif nöbetçi personel anlık sayaçlarla özetlenmektedir."*

---

### Şekil 2.3: Toplu Vital Bulgular Matrisi ve Renk Kodlu Eşik Takibi
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/03_toplu_vital_matrisi.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.3'te hemşirelerin servis vizitelerinde tüm hastaların vital bulgularını (Tansiyon, Nabız, Ateş, SpO2, Solunum) tek bir ekrandan hızla girmelerini sağlayan Toplu Vital Matrisi sunulmuştur. Normal değerler gri/mavi tonlarda kalırken, kritik eşiği aşan değerler anında kırmızı ikaz rengiyle vurgulanmaktadır."*

---

### Şekil 2.4: Anlık Kritik Tıbbi Alarm ve Sesli Uyarı Ekranı
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/04_kritik_vital_alarm_uyarisi.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.4'te bir bakım sakininde hayati tehlike arz eden vital değer sapması tespit edildiğinde (örn. Ateş: 39.5°C veya Nabız: 140 bpm) tetiklenen görsel uyarı ve Web Audio API sesli alarm entegrasyonu gösterilmektedir. Sağ üst köşede beliren kırmızı uyarı bildirimi, ilgili personeli doğrudan hastanın detay sayfasına yönlendirmektedir."*

---

### Şekil 2.5: Saatlik İlaç Dağıtım Paneli (MAR)
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/05_saatlik_ilac_dagitim_paneli_mar.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.5'te Sabah, Öğle, Akşam ve Gece sekmelerine ayrılmış Saatlik İlaç Dağıtım Paneli (Medication Administration Record) yer almaktadır. Hemşireler ilaçları tek tıkla 'Uygulandı' veya gerekçe belirterek 'Reddedildi' şeklinde işleyebilmekte, sistem mükerrer ilaç verilmesini matematiksel olarak engellemektedir."*

---

### Şekil 2.6: Hekim Muayene, Vizite ve ICD-10 Tanı Modülü
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/06_hekim_vizite_muayene.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.6'da kurum hekiminin hasta başında fiziki muayene bulgularını işlediği, ICD-10 tanı kodlarını seçtiği ve yeni ilaç reçetelediği Hekim Vizite ekranı sunulmaktadır. Geçmiş vizite kayıtları kronolojik kartlar halinde hekime sunulmaktadır."*

---

### Şekil 2.7: Klinik Bakım Sakinleri (Hasta) Yönetim ve Detay Paneli
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/07_hasta_listesi.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.7'de klinikte yatan bakım sakinlerinin oda ve yatak bazlı durum kartları, demografik bilgileri, yatış süreleri ve mevcut sağlık durumları (Stabil, İzlemde, Kritik, Hastanede) listelenmektedir."*

---

### Şekil 2.8: 112 Acil Koordinasyonu ve Hastane Dış Sevk Modülü
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/08_hastane_sevk_112.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.8'de ileri tetkik veya yoğun bakım gereksinimi duyan hastaların dış hastanelere 112 ambulansı ile sevk sürecinin yönetildiği modül görülmektedir. Sevk gerekçesi, refakat eden sağlık personeli, hedef hastane ve dönüş epikriz notları bu ekrandan koordine edilmektedir."*

---

### Şekil 2.9: Aylık İnteraktif Personel Nöbet ve Vardiya Çizelgesi
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/09_vardiya_nobet_takvimi.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.9'da hekim ve hemşire kadrosunun aylık nöbet çizelgesini gösteren interaktif takvim arayüzü sunulmuştur. Gündüz ve gece vardiyaları renkli rozetlerle ayrılmış olup çakışan nöbetler sistem tarafından denetlenmektedir."*

---

### Şekil 2.10: İlaç Kataloğu, Stok Takibi ve Kritik Eşik Uyarıları
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/10_ilac_stok_envanteri.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.10'da kurum eczanesinde bulunan ilaçların barkod numaraları, etken maddeleri, mevcut kutu stokları ve kritik tükenme eşikleri takip edilmektedir. Kritik seviyenin altına düşen ilaçlar için sistem otomatik ikaz rozeti oluşturmaktadır."*

---

### Şekil 2.11: Dijital Vardiya Devir Teslim Tutanağı ve Nöbetçi Raporu
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/11_vardiya_devir_teslim_raporu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.11'de nöbet değişimlerinde ekipler arasındaki iletişim kopukluğunu sıfırlamak üzere geliştirilen Dijital Devir Teslim Tutanağı görülmektedir. Nöbet boyunca meydana gelen acil olaylar, sevkler ve özel bakım notları sonraki ekibe kayıtlı olarak devredilir."*

---

### Şekil 2.12: Kurum Geneli Duyuru ve Dinamik Görev Panosu
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/12_duyuru_panosu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.12'de idare tarafından yayımlanan acil klinik duyurular ve personele atanan günlük operasyonel görevlerin yönetildiği etkileşimli pano arayüzü yer almaktadır."*

---

### Şekil 2.13: Sistem Denetim İzi (Audit Trail) ve KVKK Uyumlu Aktivite Logları
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/13_sistem_denetim_izleri_audit.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.13'te KVKK ve sağlık mevzuatına tam uyum sağlamak üzere geliştirilen Sistem Denetim İzi (Audit Log) ekranı sunulmuştur. Sistem üzerinde gerçekleşen her hasta kabulü, reçete girişi, sevk ve vital güncellemesi kullanıcının IP adresi, rolü ve işlem zamanıyla şeffaf biçimde denetlenmektedir."*

---

### Şekil 2.14: Klinik Gece Nöbeti Modu (Dark Theme) Arayüzü
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/14_karanlik_mod_dashboard.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.14'te gece vardiyasında görev yapan personelin göz yorgunluğunu önlemek amacıyla özel olarak geliştirilen yüksek kontrastlı Klinik Gece Modu arayüzü gösterilmektedir."*

---

### Şekil 2.15: ASP.NET Core Web API Swagger (OpenAPI) Servis Dokümantasyonu
* **Dosya:** `rapor_gorselleri/ekran_goruntuleri/15_swagger_api_dokumantasyonu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 2.15'te .NET 9 Web API uç noktalarını (Endpoints), DTO şemalarını ve HTTP metodlarını (GET, POST, PUT, DELETE) interaktif olarak belgeleyen Swagger UI arayüzü sunulmaktadır."*

---

## 🗄️ BÖLÜM 3: VERİTABANI YÖNETİMİ VE TABLO VERİ GÖRSELLERİ (DATABASE STUDIO)

Bu bölüm; **medicore.db** veritabanının fiziki tablolarını, içerisindeki gerçek klinik kayıtları, WAL (Write-Ahead Logging) eşzamanlılık modunu, DDL şema tanımlarını ve ilişkisel SQL sorgu sonuçlarını içermektedir.

### Şekil 3.1: SQLite Database Studio Genel Bakış ve Tablo Ağacı
* **Dosya:** `rapor_gorselleri/veritabani/01_sqlite_studio_genel_bakis.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.1'de MediCore projesinin 'medicore.db' SQLite veritabanı yönetim stüdyosu genel bakış ekranı görülmektedir. Sol taraftaki varlık ağacında Entity Framework Core 9.0 tarafından yönetilen 18 ilişkisel tablo ve her tablonun anlık satır sayıları (Hastalar: 42, VitalBulgular: 26, Ilaclar: 28, Nobetler: 1209 vb.) listelenmektedir. Durum çubuğunda veritabanının eşzamanlı okuma/yazma kilitlenmelerini önleyen WAL (Write-Ahead Logging) modu ve UTF-8 karakter kodlaması doğrulanmaktadır."*

---

### Şekil 3.2: Hastalar Tablosu Fiziki Veri Kayıtları (Data Grid)
* **Dosya:** `rapor_gorselleri/veritabani/02_hastalar_tablosu_verileri.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.2'de veritabanındaki 'Hastalar' tablosunun gerçek veri kayıtları sunulmaktadır. Tabloda birincil anahtar (Id PK), sistem protokol numarası (HastaNo), 11 haneli T.C. Kimlik Numarası, Ad, Soyad, Doğum Tarihi, Cinsiyet, Oda/Yatak Numaraları, klinik kronik rahatsızlık tanıları, kabul tarihi ve hastanın mevcut yaşam döngüsü durumu (Aktif / Hastanede) yer almaktadır."*

---

### Şekil 3.3: VitalBulgular Tablosu ve Tıbbi Eşik Kayıtları
* **Dosya:** `rapor_gorselleri/veritabani/03_vital_bulgular_tablosu_verileri.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.3'te 'VitalBulgular' tablosunda depolanan anlık klinik ölçümler listelenmektedir. 'HastaId' yabancı anahtarı (FK) üzerinden hastayla ilişkilendirilen kayıtlarda; Sistolik ve Diyastolik Kan Basıncı (mmHg), Nabız (bpm), Vücut Sıcaklığı (°C), Solunum Sayısı ve Oksijen Saturasyonu (% SpO2) değerleri ölçüm zaman damgasıyla saklanmaktadır. VitalEvaluator tarafından kritik bulunan değerler sistem tarafından işaretlenmektedir."*

---

### Şekil 3.4: İlaçlar Kataloğu ve Eczane Stok Envanteri Tablosu
* **Dosya:** `rapor_gorselleri/veritabani/04_ilaclar_stok_katalogu_tablosu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.4'te klinikte kullanılan ilaçların 'Ilaclar' tablosundaki tanımları gösterilmektedir. Uluslararası EAN-13 Barkod standartları, ticari ilaç adı, etken madde bileşimi, dozaj formu (Tablet, Ampul, Flakon vb.), üretici firma ve tükenme riskine karşı belirlenen KritikStokSeviyesi parametreleri veri tabanında tutulmaktadır."*

---

### Şekil 3.5: HekimMuayeneleri (Vizite & Tanı) Tablosu
* **Dosya:** `rapor_gorselleri/veritabani/05_hekim_muayeneleri_tablosu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.5'te kurum hekiminin vizite esnasında girdiği 'HekimMuayeneleri' kayıtları yer almaktadır. Tablo; muayene eden hekim bilgisi, hastanın şikayet ve anamnezi, ICD-10 klinik tanı kodu, tedavi/reçete protokolü ve hastanın stabilite durumunu ilişkilendirerek saklamaktadır."*

---

### Şekil 3.6: AktiviteLoglari Tablosu (KVKK Uyumlu Audit Trail)
* **Dosya:** `rapor_gorselleri/veritabani/06_aktivite_loglari_audit_tablosu.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.6'da sağlık mevzuatı ve KVKK gerekliliklerine tam uyum sağlayan 'AktiviteLoglari' tablosu sunulmaktadır. Sistemde oturum açan personelin adı, yetki rolü, gerçekleştirdiği işlem türü (Giriş, Hasta Güncelleme, Vital Kaydı, Sevk Talebi), ayrıntılı işlem özeti ve kaynak IP adresi kronolojik olarak değiştirilemez biçimde loglanmaktadır."*

---

### Şekil 3.7: İlişkisel SQL Sorgusu ve Sonuç Tablosu (SQL Console)
* **Dosya:** `rapor_gorselleri/veritabani/07_iliskisel_sql_sorgusu_ve_sonuc.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.7'de SQLite SQL konsolunda çalıştırılan ilişkisel 'INNER JOIN' sorgusu ve anlık yürütme çıktısı görülmektedir. 'Hastalar' ve 'VitalBulgular' tablolarını birincil-yabancı anahtar (PK-FK) üzerinden birleştiren sorgu, servisteki hastaların oda/yatak bilgileriyle son vital ölçümlerini 2.4 milisaniye gibi yüksek bir performansla listelemektedir."*

---

### Şekil 3.8: Veritabanı Tablo Tasarımı ve DDL Şema Tanımları
* **Dosya:** `rapor_gorselleri/veritabani/08_tablo_semasi_ve_ddl_tasarimi.png`
* **Raporda Kullanılacak Açıklama Metni:**  
  > *"Şekil 3.8'de Entity Framework Core Code-First yaklaşımıyla derlenen 'Hastalar' ve 'VitalBulgular' tablolarının DDL (Data Definition Language) SQL tanımları incelenmektedir. Şemada AUTOINCREMENT birincil anahtarlar, NOT NULL veri kısıtlamaları ve veri bütünlüğünü koruyan 'ON DELETE CASCADE' yabancı anahtar ilişkisi belgelenmektedir."*

---

## 🧪 BÖLÜM 4: TEST VE KALİTE DOĞRULAMA ÇIKTILARI

MediCore projesinin birim testleri (Unit Tests) ve uçtan uca API doğrulama testleri başarıyla tamamlanmıştır.

### xUnit Birim Test Sonuçları:
```text
VSTest sürümü 17.14.1 (x64)
Test yürütmesi başlatılıyor...
Toplam 1 test dosyası belirtilen desenle eşleşti.

Başarılı! - Başarısız: 0, Başarılı: 32, Atlanan: 0, Toplam: 32, Süre: 500 ms - MediCore.Tests.dll (net9.0)
```
* **Kapsam:** `VitalEvaluatorTests` (Tıbbi Eşik Doğrulamaları), `ValidationHelperTests` (Girdi Güvenliği), `AktiviteLogTests` (Denetim İzi Testleri).

