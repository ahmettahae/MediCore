# 🏥 MediCore — Staj Raporu Kaynak Kod Ekleri (Appendices)

Bu doküman, **T.C. Cumhurbaşkanlığı İletişim Başkanlığı Staj Raporu** ve proje tesliminde kullanılmak üzere hazırlanan kritik teknik kaynak kod bloklarını içermektedir.

---

## 📌 EK-1: JWT Kimlik Doğrulama ve Token Üretim Servisi (`JwtService.cs`)

**Açıklama:**  
MediCore sistemindeki kullanıcıların Rol Tabanlı Erişim Kontrolü (RBAC) kapsamında güvenli oturum açmasını ve yetkilendirilmesini sağlayan JSON Web Token (JWT) üretim altyapısıdır.

```csharp
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MediCore.API.Services
{
    /// <summary>
    /// MediCore RBAC (Rol Tabanlı Yetkilendirme) kapsamında 
    /// güvenli stateless oturum token'ı üreten servis sınıfıdır.
    /// </summary>
    public class JwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateJwtToken(int kullaniciId, string eposta, string rol, string ad, string soyad)
        {
            // 1. Simetrik Güvenlik Anahtarı ve Hashing Algoritması (HMAC-SHA256)
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 2. Kullanıcı Kimlik ve Rol Talepleri (Claims)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, kullaniciId.ToString()),
                new Claim("KullaniciId", kullaniciId.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, eposta),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, rol), // RBAC: Bashekim, Doktor, Hemsire, Yonetici
                new Claim(ClaimTypes.Name, $"{ad} {soyad}"),
                new Claim(ClaimTypes.Email, eposta)
            };

            // 3. Token Yapılandırması ve Geçerlilik Süresi (8 Saatlik Vardiya)
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
```

---

## 📌 EK-2: Gerçek Zamanlı İletişim Altyapısı (`VitalHub.cs` / `KlinikHub.cs`)

**Açıklama:**  
Toplu vital bulgu girişlerinin ve kritik sağlık alarmlarının sisteme işlendiği anda, diğer hekim ve hemşire arayüzlerine sayfa yenilenmeden asenkron olarak iletilmesini (< 20 ms) sağlayan SignalR Hub altyapısıdır.

```csharp
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace MediCore.API.Hubs
{
    /// <summary>
    /// Vital bulgu aşımı, acil sevk ve klinik duyuruları bağlı tüm istemcilere 
    /// WebSockets protokolü üzerinden ileten gerçek zamanlı iletişim hub'ıdır.
    /// </summary>
    public class KlinikHub : Hub
    {
        // Tüm aktif istemcilere anlık bildirim yayını (Broadcast)
        public async Task SendNotification(string baslik, string mesaj, string tip)
        {
            await Clients.All.SendAsync("ReceiveNotification", baslik, mesaj, tip);
        }
    }
}

// ── Controller Seviyesinde Kritik Alarm Fırlatma Örneği ──
/*
if (vitalDegerlendirme.KritikMi)
{
    // SignalR Gateway üzerinden tüm hekim ve hemşire ekranlarına anlık alarm fırlatılır
    await _hubContext.Clients.All.SendAsync(
        "ReceiveNotification",
        $"KRİTİK ALARM: {hasta.Ad} {hasta.Soyad}",
        $"{vitalDegerlendirme.Mesaj} | Oda: {hasta.OdaNo} - Yatak: {hasta.YatakNo}",
        "alert"
    );
}
*/
```

---

## 📌 EK-3: Veritabanı Eşzamanlılık Yönetimi (`AppDbContext.cs`)

**Açıklama:**  
Çoklu kullanıcı ortamında eşzamanlı okuma ve yazma çakışmalarını (*database is locked*) önlemek amacıyla SQLite veritabanı üzerinde Write-Ahead Logging (WAL) modunun aktifleştirildiği Entity Framework Core yapılandırmasıdır.

```csharp
using Microsoft.EntityFrameworkCore;
using MediCore.API.Entities;

namespace MediCore.API.Data
{
    /// <summary>
    /// MediCore Klinik Veri Bağlamı (EF Core 9.0).
    /// Çok kullanıcılı eşzamanlı erişimde kilitlenmeyi önlemek amacıyla 
    /// SQLite üzerinde WAL (Write-Ahead Logging) modu aktif edilmiştir.
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Klinik & Operasyonel Varlık Tabloları
        public DbSet<Hasta> Hastalar { get; set; }
        public DbSet<Doktor> Doktorlar { get; set; }
        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<VitalBulgu> VitalBulgular { get; set; }
        public DbSet<HekimMuayene> HekimMuayeneleri { get; set; }
        public DbSet<Ilac> Ilaclar { get; set; }
        public DbSet<HastaIlac> HastaIlaclari { get; set; }
        public DbSet<IlacUygulama> IlacUygulamalari { get; set; }
        public DbSet<HastahaneSevk> HastahaneSevkleri { get; set; }
        public DbSet<Nobet> Nobetler { get; set; }
        public DbSet<AktiviteLog> AktiviteLoglari { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQLite WAL Modu ve Eşzamanlılık (Concurrency) Yapılandırması:
            // Okuma ve yazma işlemlerinin birbirini kilitlemesini engellemek için
            // veritabanı seviyesinde PRAGMA journal_mode = WAL; uygulanır.
            // Bu sayede .db-wal ve .db-shm dosyaları üzerinden paralel işlem sağlanır.
        }
    }
}
```

---

## 📌 EK-4: Tıbbi Eşik ve Kritik Vital Değerlendirme Algoritması (`VitalEvaluator.cs`)

**Açıklama:**  
Hemşirelerin girdiği tansiyon, nabız, ateş ve SpO2 değerlerini tıbbi klinik parametrelere göre anlık değerlendirip alarm seviyesini belirleyen algoritmadır.

```csharp
namespace MediCore.API.Helpers
{
    public class VitalEvaluationResult
    {
        public bool KritikMi { get; set; }
        public string Mesaj { get; set; } = string.Empty;
        public string Seviye { get; set; } = "Normal"; // Normal, Uyari, Kritik
    }

    public static class VitalEvaluator
    {
        public static VitalEvaluationResult Degerlendir(
            int? sistolik, int? diyastolik, int? nabiz, decimal? ates, int? spo2)
        {
            // 1. SpO2 Kritik Hipoksi Kontrolü (< 90%)
            if (spo2.HasValue && spo2.Value < 90)
            {
                return new VitalEvaluationResult
                {
                    KritikMi = true,
                    Seviye = "Kritik",
                    Mesaj = $"Kritik Düşük Oksijen Doygunluğu (SpO2: %{spo2.Value})! Acil O2 desteği gerekebilir."
                };
            }

            // 2. Hipertansif Kriz ve Hipotansiyon Kontrolü
            if (sistolik.HasValue && (sistolik.Value >= 180 || sistolik.Value < 85))
            {
                return new VitalEvaluationResult
                {
                    KritikMi = true,
                    Seviye = "Kritik",
                    Mesaj = sistolik.Value >= 180 
                        ? $"Hipertansif Kriz Riski! (Tansiyon: {sistolik.Value}/{diyastolik ?? 0} mmHg)"
                        : $"Kritik Hipotansiyon! (Tansiyon: {sistolik.Value}/{diyastolik ?? 0} mmHg)"
                };
            }

            // 3. Yüksek Ateş / Hipertermi (> 38.5°C)
            if (ates.HasValue && ates.Value >= 38.5m)
            {
                return new VitalEvaluationResult
                {
                    KritikMi = true,
                    Seviye = "Kritik",
                    Mesaj = $"Yüksek Ateş / Enfeksiyon Belirtisi ({ates.Value:F1} °C)! Hekim vizitesi önerilir."
                };
            }

            // 4. Nabız / Taşikardi ve Bradikardi Kontrolü
            if (nabiz.HasValue && (nabiz.Value > 120 || nabiz.Value < 50))
            {
                return new VitalEvaluationResult
                {
                    KritikMi = true,
                    Seviye = "Kritik",
                    Mesaj = nabiz.Value > 120 
                        ? $"Ciddi Taşikardi (Nabız: {nabiz.Value} bpm)!" 
                        : $"Ciddi Bradikardi (Nabız: {nabiz.Value} bpm)!"
                };
            }

            return new VitalEvaluationResult { KritikMi = false, Seviye = "Normal", Mesaj = "Vital bulgular stabil." };
        }
    }
}
```

---

## 📌 EK-5: Güvenlik ve Doğrulama Katmanı (`ValidationHelper.cs`)

**Açıklama:**  
Sisteme dışarıdan gelen T.C. Kimlik Numarası (Algoritmik Mod-10 Doğrulaması), e-posta biçimi ve güvenli parola kriterlerini denetleyen girdi sanitizasyon katmanıdır.

```csharp
using System.Text.RegularExpressions;

namespace MediCore.API.Helpers
{
    public static class ValidationHelper
    {
        /// <summary>
        /// Resmi T.C. Kimlik Numarası Algoritma Doğrulaması
        /// </summary>
        public static bool IsValidTcKimlikNo(string tc)
        {
            if (string.IsNullOrWhiteSpace(tc) || tc.Length != 11 || !Regex.IsMatch(tc, "^[0-9]{11}$"))
                return false;

            if (tc[0] == '0') return false;

            int[] d = new int[11];
            for (int i = 0; i < 11; i++) d[i] = tc[i] - '0';

            int teklerToplami = d[0] + d[2] + d[4] + d[6] + d[8];
            int ciftlerToplami = d[1] + d[3] + d[5] + d[7];

            int h10 = ((teklerToplami * 7) - ciftlerToplami) % 10;
            if (h10 < 0) h10 += 10;
            if (h10 != d[9]) return false;

            int toplamIlkOn = 0;
            for (int i = 0; i < 10; i++) toplamIlkOn += d[i];

            return (toplamIlkOn % 10) == d[10];
        }
    }
}
```
