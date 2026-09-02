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
    public class IlacController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IlacController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Ilac — Tüm ilaçları toplam stok bilgisiyle getir
        [HttpGet]
        public async Task<IActionResult> GetIlaclar([FromQuery] string? ara)
        {
            var sorgu = _context.Ilaclar.AsQueryable();

            if (!string.IsNullOrWhiteSpace(ara))
            {
                var k = ara.ToLower();
                sorgu = sorgu.Where(i =>
                    i.Ad.ToLower().Contains(k) ||
                    i.EtkenMadde.ToLower().Contains(k) ||
                    i.Barkod.Contains(k) ||
                    i.UreticiFirma.ToLower().Contains(k));
            }

            var ilaclar = await sorgu
                .Select(i => new
                {
                    i.Id,
                    i.Barkod,
                    i.Ad,
                    i.EtkenMadde,
                    i.Form,
                    i.UreticiFirma,
                    i.KritikStokSeviyesi,
                    ToplamStok = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0,
                    KritikMi = (_context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0) <= i.KritikStokSeviyesi,
                    EnYakinSkt = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id && s.Adet > 0)
                        .OrderBy(s => s.SonKullanmaTarihi)
                        .Select(s => (DateTime?)s.SonKullanmaTarihi)
                        .FirstOrDefault()
                })
                .OrderBy(i => i.Ad)
                .ToListAsync();

            return Ok(ilaclar);
        }

        // GET: api/Ilac/kritik — Kritik stok uyarıları (dashboard için)
        [HttpGet("kritik")]
        public async Task<IActionResult> GetKritikler()
        {
            var kritikler = await _context.Ilaclar
                .Select(i => new
                {
                    i.Id,
                    i.Ad,
                    i.KritikStokSeviyesi,
                    ToplamStok = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0
                })
                .Where(i => i.ToplamStok <= i.KritikStokSeviyesi)
                .OrderBy(i => i.ToplamStok)
                .ToListAsync();

            return Ok(kritikler);
        }

        // GET: api/Ilac/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Ilac>> GetIlac(int id)
        {
            var ilac = await _context.Ilaclar.FindAsync(id);
            if (ilac == null) return NotFound();
            return ilac;
        }

        // POST: api/Ilac
        [HttpPost]
        [Authorize(Roles = "Bashekim")]
        public async Task<ActionResult<Ilac>> PostIlac(Ilac ilac)
        {
            _context.Ilaclar.Add(ilac);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetIlac), new { id = ilac.Id }, ilac);
        }

        // PUT: api/Ilac/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> PutIlac(int id, Ilac ilac)
        {
            if (id != ilac.Id) return BadRequest("ID uyuşmazlığı.");
            _context.Entry(ilac).State = EntityState.Modified;

            try { await _context.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Ilaclar.Any(e => e.Id == id)) return NotFound();
                throw;
            }
            return NoContent();
        }

        // DELETE: api/Ilac/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> DeleteIlac(int id)
        {
            var ilac = await _context.Ilaclar.FindAsync(id);
            if (ilac == null) return NotFound();
            _context.Ilaclar.Remove(ilac);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
