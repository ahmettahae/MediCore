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
    public class DuyuruController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DuyuruController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Duyuru>>> GetDuyurular()
        {
            var duyurular = await _context.Duyurular
                .OrderByDescending(d => d.OnemliMi)
                .ThenByDescending(d => d.Tarih)
                .ToListAsync();



            return duyurular;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Duyuru>> GetDuyuru(int id)
        {
            var duyuru = await _context.Duyurular.FindAsync(id);
            if (duyuru == null) return NotFound();
            return duyuru;
        }

        [HttpPost]
        [Authorize(Roles = "Bashekim,Yonetici")]
        public async Task<ActionResult<Duyuru>> PostDuyuru(Duyuru duyuru)
        {
            duyuru.Tarih = DateTime.Now;
            _context.Duyurular.Add(duyuru);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDuyuru), new { id = duyuru.Id }, duyuru);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Yonetici")]
        public async Task<IActionResult> DeleteDuyuru(int id)
        {
            var duyuru = await _context.Duyurular.FindAsync(id);
            if (duyuru == null) return NotFound();

            _context.Duyurular.Remove(duyuru);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
