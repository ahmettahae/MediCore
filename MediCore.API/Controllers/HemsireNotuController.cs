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
    public class HemsireNotuController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HemsireNotuController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/HemsireNotu/hasta/5 — Belirli bir hastanın tüm notları
        [HttpGet("hasta/{hastaId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetNotlar(int hastaId)
        {
            var notlar = await _context.HemsireNotlari
                .Where(n => n.HastaId == hastaId)
                .Include(n => n.Kullanici)
                .OrderByDescending(n => n.Tarih)
                .Select(n => new
                {
                    n.Id,
                    n.Not,
                    n.Tarih,
                    KullaniciAd = n.Kullanici != null ? $"{n.Kullanici.Ad} {n.Kullanici.Soyad}" : "Bilinmeyen Kullanıcı",
                    KullaniciRol = n.Kullanici != null ? n.Kullanici.Rol : ""
                })
                .ToListAsync();

            return Ok(notlar);
        }

        // POST: api/HemsireNotu — Yeni not ekle
        [HttpPost]
        public async Task<IActionResult> PostNot([FromBody] HemsireNotuDto dto)
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("KullaniciId");
            int.TryParse(idClaim, out int kullaniciId);

            var kullanici = kullaniciId > 0
                ? await _context.Kullanicilar.FindAsync(kullaniciId)
                : await _context.Kullanicilar.FirstOrDefaultAsync();

            if (kullanici == null) return Unauthorized();

            var hastaExists = await _context.Hastalar.AnyAsync(h => h.Id == dto.HastaId);
            if (!hastaExists) return BadRequest("Hasta bulunamadı.");

            var not = new HemsireNotu
            {
                HastaId = dto.HastaId,
                KullaniciId = kullanici.Id,
                Not = dto.Not,
                Tarih = DateTime.Now
            };

            _context.HemsireNotlari.Add(not);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Not kaydedildi.", id = not.Id });
        }

        // DELETE: api/HemsireNotu/5 — Not sil (sadece Yönetici)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Yonetici")]
        public async Task<IActionResult> DeleteNot(int id)
        {
            var not = await _context.HemsireNotlari.FindAsync(id);
            if (not == null) return NotFound();
            _context.HemsireNotlari.Remove(not);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class HemsireNotuDto
    {
        public int HastaId { get; set; }
        public string Not { get; set; } = string.Empty;
    }
}
