using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using MediCore.API.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Hubs;

namespace MediCore.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class VitalBulguController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<KlinikHub> _hubContext;

        public VitalBulguController(AppDbContext context, IHubContext<KlinikHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/VitalBulgu/hasta/5 — Belirli hastanın vital bulguları (son 20)
        [HttpGet("hasta/{hastaId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetVitaller(int hastaId)
        {
            var vitaller = await _context.VitalBulgular
                .Where(v => v.HastaId == hastaId)
                .Include(v => v.Kullanici)
                .OrderByDescending(v => v.Tarih)
                .Take(20)
                .Select(v => new
                {
                    v.Id,
                    v.NabizBPM,
                    v.TansiyonSistol,
                    v.TansiyonDiyastol,
                    v.AtesC,
                    v.SoluSayisi,
                    v.SaturasyonYuzdesi,
                    v.Tarih,
                    KullaniciAd = v.Kullanici != null ? $"{v.Kullanici.Ad} {v.Kullanici.Soyad}" : "Bilinmeyen Kullanıcı"
                })
                .ToListAsync();

            return Ok(vitaller);
        }

        // POST: api/VitalBulgu — Yeni vital bulgu ekle
        [HttpPost]
        public async Task<IActionResult> PostVital([FromBody] VitalBulguDto dto)
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("KullaniciId");
            int.TryParse(idClaim, out int kullaniciId);

            var kullanici = kullaniciId > 0
                ? await _context.Kullanicilar.FindAsync(kullaniciId)
                : await _context.Kullanicilar.FirstOrDefaultAsync();

            if (kullanici == null) return Unauthorized();

            var hastaExists = await _context.Hastalar.AnyAsync(h => h.Id == dto.HastaId);
            if (!hastaExists) return BadRequest("Hasta bulunamadı.");

            var vital = new VitalBulgu
            {
                HastaId = dto.HastaId,
                KullaniciId = kullanici.Id,
                NabizBPM = dto.NabizBPM,
                TansiyonSistol = dto.TansiyonSistol,
                TansiyonDiyastol = dto.TansiyonDiyastol,
                AtesC = dto.AtesC,
                SoluSayisi = dto.SoluSayisi,
                SaturasyonYuzdesi = dto.SaturasyonYuzdesi,
                Tarih = DateTime.Now
            };

            _context.VitalBulgular.Add(vital);
            await _context.SaveChangesAsync();

            // Kritik değer kontrolü ve SignalR uyarısı
            await CheckAndSendVitalAlert(vital, vital.HastaId);

            return Ok(new { mesaj = "Vital bulgu kaydedildi.", id = vital.Id });
        }

        private async Task CheckAndSendVitalAlert(VitalBulgu vital, int hastaId)
        {
            var hasta = await _context.Hastalar.FindAsync(hastaId);
            if (hasta == null) return;

            string hastaAdSoyad = $"{hasta.Ad} {hasta.Soyad}";
            string odaYatak = $"{hasta.OdaNo} / {hasta.YatakNo}";

            // Nabız (Pulse) Kontrolü
            if (vital.NabizBPM.HasValue && (vital.NabizBPM.Value < 50 || vital.NabizBPM.Value > 120))
            {
                string durum = vital.NabizBPM.Value < 50 ? "Bradikardi (Düşük)" : "Taşikardi (Yüksek)";
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                    "Kritik Nabız Alarmı", 
                    $"{hastaAdSoyad} (Oda: {odaYatak}) isimli hastanın nabız değeri kritik seviyede: {vital.NabizBPM.Value} BPM ({durum})", 
                    "alert");
            }

            // Ateş (Fever) Kontrolü
            if (vital.AtesC.HasValue && (vital.AtesC.Value < 35.0m || vital.AtesC.Value > 38.5m))
            {
                string durum = vital.AtesC.Value < 35.0m ? "Hipotermi (Düşük)" : "Ateş (Yüksek)";
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                    "Kritik Ateş Alarmı", 
                    $"{hastaAdSoyad} (Oda: {odaYatak}) isimli hastanın vücut sıcaklığı kritik seviyede: {vital.AtesC.Value}°C ({durum})", 
                    "alert");
            }

            // Tansiyon (Blood Pressure - Sistolik) Kontrolü
            if (vital.TansiyonSistol.HasValue && (vital.TansiyonSistol.Value < 90 || vital.TansiyonSistol.Value > 150))
            {
                string durum = vital.TansiyonSistol.Value < 90 ? "Hipotansiyon (Düşük)" : "Hipertansiyon (Yüksek)";
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                    "Kritik Tansiyon Alarmı", 
                    $"{hastaAdSoyad} (Oda: {odaYatak}) isimli hastanın büyük tansiyon değeri kritik seviyede: {vital.TansiyonSistol.Value} mmHg ({durum})", 
                    "alert");
            }

            // Saturasyon (Oxygen SpO2) Kontrolü
            if (vital.SaturasyonYuzdesi.HasValue && vital.SaturasyonYuzdesi.Value < 90)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                    "Kritik Saturasyon (SpO2) Alarmı", 
                    $"{hastaAdSoyad} (Oda: {odaYatak}) isimli hastanın oksijen saturasyon değeri kritik seviyede: %{vital.SaturasyonYuzdesi.Value} (Hipoksi)", 
                    "alert");
            }
        }

        // GET: api/VitalBulgu/son-durumlar — Tüm hastaların en son vital ölçümlerini getir
        [HttpGet("son-durumlar")]
        public async Task<ActionResult<IEnumerable<object>>> GetSonDurumlar()
        {
            var hastalar = await _context.Hastalar
                .Where(h => h.Durum == "Aktif")
                .OrderBy(h => h.OdaNo)
                .ThenBy(h => h.YatakNo)
                .ToListAsync();

            var hastaIdler = hastalar.Select(h => h.Id).ToList();

            var sonVitaller = await _context.VitalBulgular
                .Where(v => hastaIdler.Contains(v.HastaId))
                .Include(v => v.Kullanici)
                .OrderByDescending(v => v.Tarih)
                .ToListAsync();

            var sonuc = hastalar.Select(h =>
            {
                var sonVital = sonVitaller.FirstOrDefault(v => v.HastaId == h.Id);
                return new
                {
                    HastaId = h.Id,
                    h.HastaNo,
                    h.Ad,
                    h.Soyad,
                    h.OdaNo,
                    h.YatakNo,
                    h.Hastalik,
                    SonVital = sonVital != null ? new
                    {
                        sonVital.Id,
                        sonVital.NabizBPM,
                        sonVital.TansiyonSistol,
                        sonVital.TansiyonDiyastol,
                        sonVital.AtesC,
                        sonVital.SoluSayisi,
                        sonVital.SaturasyonYuzdesi,
                        sonVital.Tarih,
                        KullaniciAd = sonVital.Kullanici != null ? $"{sonVital.Kullanici.Ad} {sonVital.Kullanici.Soyad}" : "Personel"
                    } : null
                };
            });

            return Ok(sonuc);
        }

        // POST: api/VitalBulgu/toplu — Birden fazla hasta için tek seferde vital kaydı
        [HttpPost("toplu")]
        public async Task<IActionResult> PostVitalToplu([FromBody] List<VitalBulguDto> dtoList)
        {
            if (dtoList == null || !dtoList.Any())
                return BadRequest("Kayıt listesi boş olamaz.");

            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("KullaniciId");
            int.TryParse(idClaim, out int kullaniciId);

            var kullanici = kullaniciId > 0
                ? await _context.Kullanicilar.FindAsync(kullaniciId)
                : await _context.Kullanicilar.FirstOrDefaultAsync();

            int kayitKullaniciId = kullanici?.Id ?? 1;
            int eklenenSayisi = 0;
            var addedVitals = new List<VitalBulgu>();

            foreach (var dto in dtoList)
            {
                // En az bir vital değeri girilmişse kaydet
                if (dto.NabizBPM.HasValue || dto.TansiyonSistol.HasValue || dto.AtesC.HasValue || dto.SaturasyonYuzdesi.HasValue || dto.SoluSayisi.HasValue)
                {
                    var v = new VitalBulgu
                    {
                        HastaId = dto.HastaId,
                        KullaniciId = kayitKullaniciId,
                        NabizBPM = dto.NabizBPM,
                        TansiyonSistol = dto.TansiyonSistol,
                        TansiyonDiyastol = dto.TansiyonDiyastol,
                        AtesC = dto.AtesC,
                        SoluSayisi = dto.SoluSayisi,
                        SaturasyonYuzdesi = dto.SaturasyonYuzdesi,
                        Tarih = DateTime.Now
                    };
                    _context.VitalBulgular.Add(v);
                    addedVitals.Add(v);
                    eklenenSayisi++;
                }
            }

            if (eklenenSayisi > 0)
            {
                await _context.SaveChangesAsync();

                // Kritik vitalleri kontrol et ve bildirim gönder
                foreach (var vital in addedVitals)
                {
                    await CheckAndSendVitalAlert(vital, vital.HastaId);
                }
            }

            return Ok(new { mesaj = $"{eklenenSayisi} adet vital ölçümü başarıyla kaydedildi.", eklenenSayisi });
        }
    }

    public class VitalBulguDto
    {
        public int HastaId { get; set; }
        public int? NabizBPM { get; set; }
        public int? TansiyonSistol { get; set; }
        public int? TansiyonDiyastol { get; set; }
        public decimal? AtesC { get; set; }
        public int? SoluSayisi { get; set; }
        public int? SaturasyonYuzdesi { get; set; }
    }
}
