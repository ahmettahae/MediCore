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
    public class HastaIlacController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HastaIlacController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/HastaIlac/hasta/5 — Bir hastanın tüm atanmış ilaçları
        [HttpGet("hasta/{hastaId}")]
        public async Task<IActionResult> GetHastaIlaclari(int hastaId)
        {
            var ilaclar = await _context.HastaIlaclari
                .Where(hi => hi.HastaId == hastaId)
                .Include(hi => hi.Ilac)
                .OrderByDescending(hi => hi.BaslangicTarihi)
                .Select(hi => new
                {
                    hi.Id,
                    hi.HastaId,
                    hi.IlacId,
                    IlacAd = hi.Ilac != null ? hi.Ilac.Ad : "Bilinmeyen İlaç",
                    IlacForm = hi.Ilac != null ? hi.Ilac.Form : "Tablet",
                    IlacEtkenMadde = hi.Ilac != null ? hi.Ilac.EtkenMadde : "",
                    hi.Dozaj,
                    hi.KullanimSikligi,
                    hi.KullanimSekli,
                    hi.BaslangicTarihi,
                    hi.BitisTarihi,
                    hi.UygulandiMi,
                    hi.UygulanmaTarihi,
                    // İlaç aktif mi? (bitiş tarihi geçmemiş veya süresiz)
                    AktifMi = hi.BitisTarihi == null || hi.BitisTarihi >= DateTime.Now
                })
                .ToListAsync();

            return Ok(ilaclar);
        }

        // POST: api/HastaIlac — Hastaya ilaç ata
        [HttpPost]
        [Authorize(Roles = "Bashekim,Doktor")]
        public async Task<IActionResult> PostHastaIlac(HastaIlac hastaIlac)
        {
            hastaIlac.BaslangicTarihi = DateTime.Now;
            hastaIlac.UygulandiMi = false;

            _context.HastaIlaclari.Add(hastaIlac);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "İlaç atandı.", id = hastaIlac.Id });
        }

        // PATCH: api/HastaIlac/5/uygula — Hemşire ilaç uygulandı işareti
        [HttpPatch("{id}/uygula")]
        public async Task<IActionResult> UygulamaIsaretle(int id)
        {
            var kayit = await _context.HastaIlaclari.FindAsync(id);
            if (kayit == null) return NotFound();

            kayit.UygulandiMi = !kayit.UygulandiMi; // toggle
            kayit.UygulanmaTarihi = kayit.UygulandiMi ? DateTime.Now : null;

            await _context.SaveChangesAsync();
            return Ok(new
            {
                uygulandiMi = kayit.UygulandiMi,
                uygulanmaTarihi = kayit.UygulanmaTarihi
            });
        }

        // DELETE: api/HastaIlac/5 — İlaç atamasını kaldır (Yönetici ve Doktor)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Doktor")]
        public async Task<IActionResult> DeleteHastaIlac(int id)
        {
            var kayit = await _context.HastaIlaclari.FindAsync(id);
            if (kayit == null) return NotFound();
            _context.HastaIlaclari.Remove(kayit);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
