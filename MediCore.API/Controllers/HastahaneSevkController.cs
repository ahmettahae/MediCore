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
    public class HastahaneSevkController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<KlinikHub> _hubContext;

        public HastahaneSevkController(AppDbContext context, IHubContext<KlinikHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET: api/HastahaneSevk — Tüm sevk kayıtları (Arama destekli)
        [HttpGet]
        public async Task<IActionResult> GetSevkler([FromQuery] string? ara)
        {
            var dirtySevkler = await _context.HastahaneSevkleri
                .Where(s => s.SevkEdenAd.Contains("(Başhemşire)") || s.SevkEdenAd.Contains("(Sorumlu Müdür)"))
                .ToListAsync();

            if (dirtySevkler.Any())
            {
                foreach (var s in dirtySevkler)
                {
                    s.SevkEdenAd = s.SevkEdenAd.Replace(" (Başhemşire)", "").Replace("(Başhemşire)", "").Replace(" (Sorumlu Müdür)", "").Replace("(Sorumlu Müdür)", "");
                }
                await _context.SaveChangesAsync();
            }

            var sorgu = _context.HastahaneSevkleri
                .Include(s => s.Hasta)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(ara))
            {
                var k = ara.ToLower();
                sorgu = sorgu.Where(s =>
                    (s.Hasta != null && (s.Hasta.Ad.ToLower().Contains(k) || s.Hasta.Soyad.ToLower().Contains(k) || s.Hasta.HastaNo.ToLower().Contains(k))) ||
                    s.SevkEdilenHastane.ToLower().Contains(k) ||
                    s.SevkNedeni.ToLower().Contains(k) ||
                    s.SevkTipi.ToLower().Contains(k));
            }

            var sevkler = await sorgu
                .OrderByDescending(s => s.SevkTarihi)
                .Select(s => new
                {
                    s.Id,
                    s.HastaId,
                    HastaAdi = s.Hasta != null ? $"{s.Hasta.Ad} {s.Hasta.Soyad}" : "—",
                    HastaNo = s.Hasta != null ? s.Hasta.HastaNo : "",
                    HastaOdaYatak = s.Hasta != null ? $"{s.Hasta.OdaNo} / {s.Hasta.YatakNo}" : "",
                    s.SevkTarihi,
                    s.SevkEdilenHastane,
                    s.SevkNedeni,
                    s.SevkTipi,
                    s.DoktorNotu,
                    s.SevkEdenAd,
                    s.Durum,
                    s.GeriDonusTarihi,
                    s.GeriDonusNotu
                })
                .ToListAsync();

            return Ok(sevkler);
        }

        // GET: api/HastahaneSevk/hasta/5 — Bir hastanın sevk geçmişi
        [HttpGet("hasta/{hastaId}")]
        public async Task<IActionResult> GetHastaSevkleri(int hastaId)
        {
            var sevkler = await _context.HastahaneSevkleri
                .Where(s => s.HastaId == hastaId)
                .OrderByDescending(s => s.SevkTarihi)
                .ToListAsync();

            return Ok(sevkler);
        }

        // POST: api/HastahaneSevk — Hastaneye Sevk Oluştur
        [HttpPost]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> PostSevk([FromBody] HastahaneSevkDto dto)
        {
            var hasta = await _context.Hastalar.FindAsync(dto.HastaId);
            if (hasta == null) return NotFound("Hasta bulunamadı.");

            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("KullaniciId");
            int.TryParse(idClaim, out int kullaniciId);
            var adSoyad = User.FindFirstValue(ClaimTypes.Name);

            var kullanici = kullaniciId > 0
                ? await _context.Kullanicilar.FindAsync(kullaniciId)
                : await _context.Kullanicilar.FirstOrDefaultAsync();

            var sevk = new HastahaneSevk
            {
                HastaId = dto.HastaId,
                SevkEdilenHastane = dto.SevkEdilenHastane,
                SevkNedeni = dto.SevkNedeni,
                SevkTipi = dto.SevkTipi ?? "Acil (112 Ambulans)",
                DoktorNotu = dto.DoktorNotu ?? "",
                SevkEdenKullaniciId = kullanici?.Id,
                SevkEdenAd = !string.IsNullOrEmpty(adSoyad) ? adSoyad : (kullanici != null ? $"{kullanici.Ad} {kullanici.Soyad}" : "Görevli"),
                SevkTarihi = dto.SevkTarihi ?? DateTime.Now,
                Durum = "Sevk Edildi"
            };

            _context.HastahaneSevkleri.Add(sevk);

            // Sevkle birlikte hastanın durumunu "Hastanede" yap
            hasta.Durum = "Hastanede";

            await _context.SaveChangesAsync();

            // SignalR ile anlık bildirim yayınla
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                "Acil Sevk Bildirimi", 
                $"{hasta.Ad} {hasta.Soyad} (Oda: {hasta.OdaNo}), {sevk.SevkEdilenHastane} hastanesine sevk edildi. Neden: {sevk.SevkNedeni} ({sevk.SevkTipi})", 
                "info");

            return Ok(new { mesaj = "Hasta hastaneye sevk edildi.", id = sevk.Id });
        }

        // PATCH: api/HastahaneSevk/5/geridonis — Hastaneden Dönüş Kaydı
        [HttpPatch("{id}/geridonis")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> GeriDonisIslemi(int id, [FromBody] GeriDonisModel model)
        {
            var sevk = await _context.HastahaneSevkleri.FindAsync(id);
            if (sevk == null) return NotFound();

            sevk.Durum = "Geri Döndü";
            sevk.GeriDonusTarihi = model.GeriDonusTarihi ?? DateTime.Now;
            sevk.GeriDonusNotu = model.GeriDonusNotu;

            // Hastayı tekrar "Kurumda" duruma al
            var hasta = await _context.Hastalar.FindAsync(sevk.HastaId);
            if (hasta != null)
            {
                hasta.Durum = "Kurumda";
            }

            await _context.SaveChangesAsync();

            if (hasta != null)
            {
                // SignalR ile anlık bildirim yayınla
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", 
                    "Sevk Dönüş Bildirimi", 
                    $"{hasta.Ad} {hasta.Soyad} hastaneden kurumumuza geri döndü. Dönüş Notu: {sevk.GeriDonusNotu ?? "—"}", 
                    "success");
            }

            return Ok(new { mesaj = "Hasta bakım merkezine geri döndü.", id = sevk.Id });
        }

        // DELETE: api/HastahaneSevk/5 (Sadece Yönetici)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> DeleteSevk(int id)
        {
            var sevk = await _context.HastahaneSevkleri.FindAsync(id);
            if (sevk == null) return NotFound();

            _context.HastahaneSevkleri.Remove(sevk);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class HastahaneSevkDto
    {
        public int HastaId { get; set; }
        public string SevkEdilenHastane { get; set; } = string.Empty;
        public string SevkNedeni { get; set; } = string.Empty;
        public string? SevkTipi { get; set; }
        public string? DoktorNotu { get; set; }
        public DateTime? SevkTarihi { get; set; }
    }

    public class GeriDonisModel
    {
        public string GeriDonusNotu { get; set; } = string.Empty;
        public DateTime? GeriDonusTarihi { get; set; }
    }
}
