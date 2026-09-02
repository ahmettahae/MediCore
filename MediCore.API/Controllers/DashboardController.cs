using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using Microsoft.AspNetCore.Authorization;
using System.IO;

namespace MediCore.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Dashboard/ozet — Bakım Merkezi Genel İstatistik Kartları
        [HttpGet("ozet")]
        public async Task<IActionResult> GetOzet()
        {
            var bugun = DateTime.Today;
            var otuzGunSonra = DateTime.Now.AddDays(30);

            var toplamHasta = await _context.Hastalar.CountAsync();
            var aktifHasta  = await _context.Hastalar.CountAsync(h => h.Durum == "Aktif" || h.Durum == "Kurumda");
            var hastahanedeHasta = await _context.Hastalar.CountAsync(h => h.Durum == "Hastanede" || h.Durum == "Hastahanede");

            var toplamIlac = await _context.Ilaclar.CountAsync();

            // Kritik stok: toplamStok <= kritikStokSeviyesi
            var kritikStokSayisi = await _context.Ilaclar
                .Select(i => new
                {
                    i.KritikStokSeviyesi,
                    ToplamStok = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0
                })
                .CountAsync(i => i.ToplamStok <= i.KritikStokSeviyesi);

            // SKT yaklaşan stok partisi sayısı (30 gün içinde dolacak, adet > 0)
            var sktUyarisiSayisi = await _context.IlacStoklari
                .CountAsync(s => s.SonKullanmaTarihi <= otuzGunSonra && s.Adet > 0);

            // Kurum Hekimi Bilgisi (Başhekim öncelikli)
            var kurumHekimi = await _context.Doktorlar.FirstOrDefaultAsync(d => d.UzmanlikAlani == "Başhekim" || d.UzmanlikAlani == "Başhekimlik");
            if (kurumHekimi == null)
            {
                kurumHekimi = await _context.Doktorlar.FirstOrDefaultAsync(); // fallback
            }

            var yarin = bugun.AddDays(1);

            // Bugünkü hemşire notları ve kontrolleri
            var bugunNot = await _context.HemsireNotlari
                .CountAsync(n => n.Tarih >= bugun && n.Tarih < yarin);

            var bugunVital = await _context.VitalBulgular
                .CountAsync(v => v.Tarih >= bugun && v.Tarih < yarin);

            var toplamPersonel = await _context.Personeller.CountAsync();
            if (toplamPersonel == 0)
            {
                toplamPersonel = await _context.Kullanicilar.CountAsync();
            }

            return Ok(new
            {
                toplamHasta,
                aktifHasta,
                hastahanedeHasta,
                toplamIlac,
                toplamPersonel,
                kritikStokSayisi,
                sktUyarisiSayisi,
                kurumHekimiAd = kurumHekimi != null ? $"Dr. {kurumHekimi.Ad} {kurumHekimi.Soyad}" : "Atanmadı",
                kurumHekimiBirim = kurumHekimi != null ? kurumHekimi.UzmanlikAlani : "",
                bugunNot,
                bugunVital
            });
        }

        // GET: api/Dashboard/uyarilar — Uyarı paneli (kritik stok + SKT + aktif hastane sevkleri)
        [HttpGet("uyarilar")]
        public async Task<IActionResult> GetUyarilar()
        {
            var otuzGunSonra = DateTime.Now.AddDays(30);

            // Kritik stok ilaçları
            var kritikStoklar = await _context.Ilaclar
                .Select(i => new
                {
                    i.Id,
                    i.Ad,
                    i.Form,
                    i.KritikStokSeviyesi,
                    ToplamStok = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0
                })
                .Where(i => i.ToplamStok <= i.KritikStokSeviyesi)
                .OrderBy(i => i.ToplamStok)
                .Take(8)
                .ToListAsync();

            // SKT yaklaşan partiler
            var sktUyarilari = await _context.IlacStoklari
                .Include(s => s.Ilac)
                .Where(s => s.SonKullanmaTarihi <= otuzGunSonra && s.Adet > 0)
                .OrderBy(s => s.SonKullanmaTarihi)
                .Take(8)
                .Select(s => new
                {
                    IlacId = s.IlacId,
                    IlacAd = s.Ilac != null ? s.Ilac.Ad : "Bilinmeyen İlaç",
                    s.PartiNo,
                    s.Adet,
                    s.SonKullanmaTarihi,
                    KalanGun = (s.SonKullanmaTarihi - DateTime.Now).Days
                })
                .ToListAsync();

            // Aktif Hastane Sevkleri (Şu an hastanede olanlar)
            var aktifSevkler = await _context.HastahaneSevkleri
                .Include(s => s.Hasta)
                .Where(s => s.Durum == "Sevk Edildi")
                .OrderByDescending(s => s.SevkTarihi)
                .Take(6)
                .Select(s => new
                {
                    s.Id,
                    s.HastaId,
                    HastaAdi = s.Hasta != null ? $"{s.Hasta.Ad} {s.Hasta.Soyad}" : "—",
                    s.SevkEdilenHastane,
                    s.SevkNedeni,
                    s.SevkTipi,
                    s.SevkTarihi
                })
                .ToListAsync();

            // Aktif kritik vital alarmları bul (Hastanın en son ölçümü kritik olanlar)
            var aktifKritikAlarmlar = new List<object>();
            var hastalar = await _context.Hastalar
                .Where(h => h.Durum == "Aktif" || h.Durum == "Kurumda")
                .ToListAsync();

            foreach (var hasta in hastalar)
            {
                var sonVital = await _context.VitalBulgular
                    .Where(v => v.HastaId == hasta.Id)
                    .OrderByDescending(v => v.Tarih)
                    .FirstOrDefaultAsync();

                if (sonVital != null)
                {
                    var eval = MediCore.API.Helpers.VitalEvaluator.Evaluate(sonVital.AtesC, sonVital.NabizBPM, sonVital.TansiyonSistol, sonVital.SaturasyonYuzdesi);
                    if (eval.IsKritik)
                    {
                        aktifKritikAlarmlar.Add(new
                        {
                            id = sonVital.Id,
                            hastaId = hasta.Id,
                            hastaAdi = $"{hasta.Ad} {hasta.Soyad}",
                            odaYatak = $"{hasta.OdaNo} / {hasta.YatakNo}",
                            tarih = sonVital.Tarih,
                            detay = string.Join(", ", eval.Nedenler)
                        });
                    }
                }
            }

            return Ok(new { kritikStoklar, sktUyarilari, aktifSevkler, aktifKritikAlarmlar });
        }

        // GET: api/Dashboard/aktivite-loglari — Klinik ve idari denetim kayıtları
        [HttpGet("aktivite-loglari")]
        [Authorize(Roles = "Bashekim,Bashemsire,Yonetici")]
        public async Task<IActionResult> GetAktiviteLoglari(
            [FromQuery] int sayfa = 1, 
            [FromQuery] int limit = 20, 
            [FromQuery] string? arama = null, 
            [FromQuery] string? islemTuru = null)
        {
            try
            {
                var query = _context.AktiviteLoglari.AsQueryable();

                if (!string.IsNullOrWhiteSpace(arama))
                {
                    var aramaTemiz = arama.ToLower();
                    query = query.Where(l => 
                        l.Kullanici.ToLower().Contains(aramaTemiz) || 
                        l.Detay.ToLower().Contains(aramaTemiz) || 
                        l.Rol.ToLower().Contains(aramaTemiz)
                    );
                }

                if (!string.IsNullOrWhiteSpace(islemTuru))
                {
                    query = query.Where(l => l.IslemTuru == islemTuru);
                }

                var toplamKayit = await query.CountAsync();
                var loglar = await query
                    .OrderByDescending(l => l.Tarih)
                    .Skip((sayfa - 1) * limit)
                    .Take(limit)
                    .ToListAsync();

                var islemTurleri = await _context.AktiviteLoglari
                    .Select(l => l.IslemTuru)
                    .Distinct()
                    .ToListAsync();

                return Ok(new
                {
                    loglar,
                    toplamKayit,
                    sayfa,
                    limit,
                    toplamSayfa = (int)Math.Ceiling((double)toplamKayit / limit),
                    islemTurleri
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Aktivite logları okunamadı: {ex.Message}");
            }
        }

        // GET: api/Dashboard/logs — Sistem Loglarını getiren endpoint
        [HttpGet("logs")]
        [Authorize(Roles = "Bashekim,Bashemsire,Yonetici")]
        public IActionResult GetSystemLogs([FromQuery] int count = 100)
        {
            try
            {
                var logFolder = Path.Combine(Directory.GetCurrentDirectory(), "Logs");
                if (!Directory.Exists(logFolder))
                {
                    return Ok(new List<string>());
                }

                var latestFile = Directory.GetFiles(logFolder, "medicore_log-*.txt")
                    .OrderByDescending(f => f)
                    .FirstOrDefault();

                if (latestFile == null || !System.IO.File.Exists(latestFile))
                {
                    return Ok(new List<string>());
                }

                using (var fs = new FileStream(latestFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                using (var sr = new StreamReader(fs))
                {
                    var lines = new List<string>();
                    string? line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        lines.Add(line);
                    }

                    var result = lines.AsEnumerable().Reverse().Take(count).ToList();
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loglar okunamadı: {ex.Message}");
            }
        }
    }
}
