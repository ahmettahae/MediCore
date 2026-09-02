using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using MediCore.API.Entities;
using Microsoft.AspNetCore.Authorization;

namespace MediCore.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NobetController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NobetController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Nobet/temizle
        [HttpGet("temizle")]
        [AllowAnonymous]
        public async Task<IActionResult> Temizle()
        {
            var wrongShifts = await _context.Nobetler
                .Where(n => n.TeslimNotu == "Sistem tarafından otomatik atandı.")
                .ToListAsync();
            _context.Nobetler.RemoveRange(wrongShifts);
            await _context.SaveChangesAsync();
            return Ok("Temizlendi");
        }

        // GET: api/Nobet/gunluk — Belirli bir günün tüm nöbetleri
        [HttpGet("gunluk")]
        public async Task<IActionResult> GetGunlukNobetler([FromQuery] DateTime? tarih)
        {
            var secilenTarih = tarih?.Date ?? DateTime.Today;
            await AutoGenerateMonthShifts(secilenTarih.Year, secilenTarih.Month);
            var nobetler = await _context.Nobetler
                .Where(n => n.NobetTarihi.Date == secilenTarih && n.Aktif)
                .ToListAsync();

            var siraliNobetler = nobetler.OrderBy(n => n.BaslangicSaati).ToList();
            return Ok(siraliNobetler);
        }

        // GET: api/Nobet/bugun — Bugünkü tüm nöbetler
        [HttpGet("bugun")]
        public async Task<IActionResult> GetBugunNobetler()
        {
            var bugun = DateTime.Today;
            await AutoGenerateMonthShifts(bugun.Year, bugun.Month);
            var nobetler = await _context.Nobetler
                .Where(n => n.NobetTarihi.Date == bugun && n.Aktif)
                .ToListAsync();

            var siraliNobetler = nobetler.OrderBy(n => n.BaslangicSaati).ToList();
            return Ok(siraliNobetler);
        }

        // GET: api/Nobet/aktif — Şu an aktif olan nöbet (saate göre)
        [HttpGet("aktif")]
        public async Task<IActionResult> GetAktifNobet()
        {
            var simdi = DateTime.Now;
            var bugun = DateTime.Today;
            var saatSimdi = simdi.TimeOfDay;
            
            await AutoGenerateMonthShifts(bugun.Year, bugun.Month);

            var nobetler = await _context.Nobetler
                .Where(n => n.NobetTarihi.Date == bugun && n.Aktif)
                .ToListAsync();

            var aktifNobet = nobetler.FirstOrDefault(n => n.BaslangicSaati <= saatSimdi && n.BitisSaati > saatSimdi);

            return Ok(aktifNobet);
        }

        // GET: api/Nobet — Tüm nöbet kayıtları
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var bugun = DateTime.Today;
            await AutoGenerateMonthShifts(bugun.Year, bugun.Month);
            
            var dirtyNobetler = await _context.Nobetler
                .Where(n => n.HemsireAd.Contains("(Başhemşire)") || n.HemsireSoyad.Contains("(Başhemşire)"))
                .ToListAsync();

            if (dirtyNobetler.Any())
            {
                foreach (var n in dirtyNobetler)
                {
                    n.HemsireAd = n.HemsireAd.Replace(" (Başhemşire)", "").Replace("(Başhemşire)", "");
                    n.HemsireSoyad = n.HemsireSoyad.Replace(" (Başhemşire)", "").Replace("(Başhemşire)", "");
                }
                await _context.SaveChangesAsync();
            }

            var nobetlerDb = await _context.Nobetler
                .OrderByDescending(n => n.NobetTarihi)
                .ToListAsync();

            var nobetler = nobetlerDb
                .OrderByDescending(n => n.NobetTarihi)
                .ThenBy(n => n.BaslangicSaati)
                .ToList();



            return Ok(nobetler);
        }

        private string GetAd(string adSoyad)
        {
            var parts = adSoyad.Split(' ');
            return parts.Length > 1 ? string.Join(" ", parts.Take(parts.Length - 1)) : adSoyad;
        }

        private string GetSoyad(string adSoyad)
        {
            var parts = adSoyad.Split(' ');
            return parts.Length > 1 ? parts.Last() : string.Empty;
        }

        private async Task AutoGenerateMonthShifts(int year, int month)
        {
            var hemsireler = await _context.Personeller
                .Where(p => p.Unvan.Contains("Hemşire") || p.Unvan.Contains("Hemsire"))
                .ToListAsync();

            var baslangic = new DateTime(year, month, 1);
            var bitis = baslangic.AddMonths(1).AddDays(-1);

            var aydakiNobetler = await _context.Nobetler
                .Where(n => n.NobetTarihi.Date >= baslangic && n.NobetTarihi.Date <= bitis)
                .ToListAsync();

            bool changes = false;

            for (var date = baslangic; date <= bitis; date = date.AddDays(1))
            {
                foreach (var h in hemsireler)
                {
                    var adSoyad = h.AdSoyad ?? "";
                    var ad = GetAd(adSoyad);
                    var soyad = GetSoyad(adSoyad);

                    var hasShift = aydakiNobetler.Any(n => n.NobetTarihi.Date == date && n.HemsireAd == ad && n.HemsireSoyad == soyad);
                    
                    if (!hasShift && !string.IsNullOrWhiteSpace(h.Vardiya) && (h.Durum == "Mesaide" || h.Durum == "Aktif"))
                    {
                        string vardiyaTuru = "Gündüz";
                        TimeSpan bas = new TimeSpan(8, 0, 0);
                        TimeSpan bit = new TimeSpan(16, 0, 0);

                        if (h.Vardiya.Contains("Akşam", StringComparison.OrdinalIgnoreCase))
                        {
                            vardiyaTuru = "Akşam";
                            bas = new TimeSpan(16, 0, 0);
                            bit = new TimeSpan(23, 59, 59); 
                        }
                        else if (h.Vardiya.Contains("Gece", StringComparison.OrdinalIgnoreCase))
                        {
                            vardiyaTuru = "Gece";
                            bas = new TimeSpan(0, 0, 0);
                            bit = new TimeSpan(8, 0, 0);
                        }

                        _context.Nobetler.Add(new Nobet
                        {
                            HemsireAd = ad,
                            HemsireSoyad = soyad,
                            HemsireTelefon = h.Telefon,
                            VardiyaTuru = vardiyaTuru,
                            BaslangicSaati = bas,
                            BitisSaati = bit,
                            NobetTarihi = date,
                            Aktif = true,
                            TeslimNotu = "Sistem tarafından otomatik atandı."
                        });
                        changes = true;
                    }
                }
            }

            if (changes)
            {
                await _context.SaveChangesAsync();
            }
        }

        // POST: api/Nobet — Yeni nöbet ekle
        [HttpPost]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> PostNobet([FromBody] NobetDto dto)
        {
            var nobet = new Nobet
            {
                HemsireAd      = dto.HemsireAd,
                HemsireSoyad   = dto.HemsireSoyad,
                HemsireTelefon = dto.HemsireTelefon,
                VardiyaTuru    = dto.VardiyaTuru,
                BaslangicSaati = dto.BaslangicSaati,
                BitisSaati     = dto.BitisSaati,
                NobetTarihi    = dto.NobetTarihi ?? DateTime.Today,
                TeslimNotu     = dto.TeslimNotu,
                Aktif          = true
            };

            _context.Nobetler.Add(nobet);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Nöbet kaydedildi.", id = nobet.Id });
        }

        // PUT: api/Nobet/5 — Nöbet güncelle
        [HttpPut("{id}")]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> PutNobet(int id, [FromBody] NobetDto dto)
        {
            var nobet = await _context.Nobetler.FindAsync(id);
            if (nobet == null) return NotFound();

            nobet.HemsireAd = dto.HemsireAd;
            nobet.HemsireSoyad = dto.HemsireSoyad;
            nobet.HemsireTelefon = dto.HemsireTelefon;
            nobet.VardiyaTuru = dto.VardiyaTuru;
            nobet.BaslangicSaati = dto.BaslangicSaati;
            nobet.BitisSaati = dto.BitisSaati;
            if (dto.NobetTarihi.HasValue) nobet.NobetTarihi = dto.NobetTarihi.Value;
            nobet.TeslimNotu = dto.TeslimNotu;

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Nöbet güncellendi." });
        }

        // DELETE: api/Nobet/5 — Nöbet sil
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> DeleteNobet(int id)
        {
            var nobet = await _context.Nobetler.FindAsync(id);
            if (nobet == null) return NotFound();

            _context.Nobetler.Remove(nobet);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Nöbet silindi." });
        }
    }

    public class NobetDto
    {
        public string HemsireAd { get; set; } = string.Empty;
        public string HemsireSoyad { get; set; } = string.Empty;
        public string? HemsireTelefon { get; set; }
        public string VardiyaTuru { get; set; } = string.Empty;
        public TimeSpan BaslangicSaati { get; set; }
        public TimeSpan BitisSaati { get; set; }
        public DateTime? NobetTarihi { get; set; }
        public string? TeslimNotu { get; set; }
    }
}
