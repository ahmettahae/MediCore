using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using MediCore.API.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MediCore.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class MuayeneController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MuayeneController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Muayene/kritik-hastalar
        [HttpGet("kritik-hastalar")]
        public async Task<IActionResult> GetKritikHastalar()
        {
            var aktifHastalar = await _context.Hastalar
                .Where(h => h.Durum == "Aktif" || h.Durum == "Hastanede")
                .OrderBy(h => h.OdaNo)
                .ToListAsync();

            var hastaIdler = aktifHastalar.Select(h => h.Id).ToList();

            var sonVitaller = await _context.VitalBulgular
                .Where(v => hastaIdler.Contains(v.HastaId))
                .OrderByDescending(v => v.Tarih)
                .ToListAsync();

            var sonSevkler = await _context.HastahaneSevkleri
                .Where(s => hastaIdler.Contains(s.HastaId))
                .OrderByDescending(s => s.SevkTarihi)
                .ToListAsync();

            var kritikListesi = new List<object>();

            foreach (var h in aktifHastalar)
            {
                var sonVital = sonVitaller.FirstOrDefault(v => v.HastaId == h.Id);
                var sonSevk = sonSevkler.FirstOrDefault(s => s.HastaId == h.Id);

                bool isKritik = false;
                var nedenler = new List<string>();

                if (h.Durum == "Hastanede")
                {
                    isKritik = true;
                    nedenler.Add($"Dış Hastanede Sevkli ({sonSevk?.SevkEdilenHastane ?? "Hastane"})");
                }
                else if (sonSevk != null && sonSevk.Durum == "Geri Döndü" && (DateTime.Now - (sonSevk.GeriDonusTarihi ?? sonSevk.SevkTarihi)).TotalDays <= 3)
                {
                    isKritik = true;
                    nedenler.Add("Hastaneden Yeni Döndü (Takip Gerekli)");
                }

                if (sonVital != null)
                {
                    if (sonVital.TansiyonSistol >= 140 || sonVital.TansiyonSistol <= 90)
                    {
                        isKritik = true;
                        nedenler.Add($"Tansiyon Sınır Dışı: {sonVital.TansiyonSistol}/{sonVital.TansiyonDiyastol} mmHg");
                    }
                    if (sonVital.AtesC >= 38.0m)
                    {
                        isKritik = true;
                        nedenler.Add($"Yüksek Ateş: {sonVital.AtesC} °C");
                    }
                    if (sonVital.SaturasyonYuzdesi.HasValue && sonVital.SaturasyonYuzdesi <= 92)
                    {
                        isKritik = true;
                        nedenler.Add($"Düşük SpO₂: %{sonVital.SaturasyonYuzdesi}");
                    }
                    if (sonVital.NabizBPM >= 105 || (sonVital.NabizBPM.HasValue && sonVital.NabizBPM <= 50))
                    {
                        isKritik = true;
                        nedenler.Add($"Aritmi / Nabız Uyarısı: {sonVital.NabizBPM} bpm");
                    }
                }

                if (isKritik)
                {
                    kritikListesi.Add(new
                    {
                        HastaId = h.Id,
                        h.HastaNo,
                        h.Ad,
                        h.Soyad,
                        h.OdaNo,
                        h.YatakNo,
                        h.Hastalik,
                        h.AlerjiBilgisi,
                        h.Durum,
                        KritikNedenler = nedenler,
                        SonVital = sonVital != null ? new
                        {
                            sonVital.NabizBPM,
                            sonVital.TansiyonSistol,
                            sonVital.TansiyonDiyastol,
                            sonVital.AtesC,
                            sonVital.SaturasyonYuzdesi,
                            sonVital.Tarih
                        } : null
                    });
                }
            }

            return Ok(kritikListesi);
        }

        // GET: api/Muayene/hasta/{hastaId}
        [HttpGet("hasta/{hastaId}")]
        public async Task<IActionResult> GetHastaMuayeneleri(int hastaId)
        {
            var muayeneler = await _context.HekimMuayeneleri
                .Where(m => m.HastaId == hastaId)
                .OrderByDescending(m => m.MuayeneTarihi)
                .ToListAsync();

            return Ok(muayeneler);
        }

        // POST: api/Muayene
        [HttpPost]
        [Authorize(Roles = "Bashekim,Doktor")]
        public async Task<IActionResult> PostMuayene([FromBody] HekimMuayeneDto dto)
        {
            var doktorAd = User.FindFirstValue(ClaimTypes.Name) ?? "Kurum Hekimi";
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("KullaniciId");
            int.TryParse(idClaim, out int doktorId);

            var muayene = new HekimMuayene
            {
                HastaId = dto.HastaId,
                DoktorId = doktorId > 0 ? doktorId : null,
                DoktorAd = doktorAd,
                MuayeneTarihi = DateTime.Now,
                Sikayet = dto.Sikayet,
                KlinikBulgular = dto.KlinikBulgular,
                Tani = dto.Tani,
                TedaviPlani = dto.TedaviPlani,
                DiyetVeBakimOnerisi = dto.DiyetVeBakimOnerisi,
                ReceteOzeti = dto.ReceteOzeti,
                KontrolTarihi = dto.KontrolTarihi,
                Durum = dto.Durum ?? "Stabil"
            };

            _context.HekimMuayeneleri.Add(muayene);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Hekim muayene kaydı başarıyla oluşturuldu.", id = muayene.Id });
        }

        // GET: api/Muayene/doktor-ozet
        [HttpGet("doktor-ozet")]
        public async Task<IActionResult> GetDoktorOzet()
        {
            var toplamHasta = await _context.Hastalar.CountAsync(h => h.Durum == "Aktif");
            var hastanedekiHastalar = await _context.Hastalar.CountAsync(h => h.Durum == "Hastanede");
            
            var bugunMuayeneler = await _context.HekimMuayeneleri
                .Where(m => m.MuayeneTarihi.Date == DateTime.Today)
                .CountAsync();

            var son24SaatVitaller = await _context.VitalBulgular
                .Where(v => v.Tarih >= DateTime.Now.AddHours(-24))
                .ToListAsync();

            var anormalVitalSayisi = son24SaatVitaller.Count(v => 
                (v.TansiyonSistol >= 140 || v.TansiyonSistol <= 90) ||
                (v.AtesC >= 38.0m) ||
                (v.SaturasyonYuzdesi <= 92) ||
                (v.NabizBPM >= 100 || v.NabizBPM <= 55)
            );

            return Ok(new
            {
                ToplamAktifSakin = toplamHasta,
                HastanedeSevkli = hastanedekiHastalar,
                BugunYapilanVizite = bugunMuayeneler,
                AnormalVitalAlarmi = anormalVitalSayisi
            });
        }
    }

    public class HekimMuayeneDto
    {
        public int HastaId { get; set; }
        public string Sikayet { get; set; } = string.Empty;
        public string KlinikBulgular { get; set; } = string.Empty;
        public string Tani { get; set; } = string.Empty;
        public string TedaviPlani { get; set; } = string.Empty;
        public string? DiyetVeBakimOnerisi { get; set; }
        public string? ReceteOzeti { get; set; }
        public DateTime? KontrolTarihi { get; set; }
        public string? Durum { get; set; }
    }
}
