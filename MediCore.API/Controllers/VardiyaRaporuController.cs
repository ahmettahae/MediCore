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
    public class VardiyaRaporuController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VardiyaRaporuController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<VardiyaRaporu>>> GetVardiyaRaporlari()
        {
            var raporlar = await _context.VardiyaRaporlari
                .OrderByDescending(r => r.Tarih)
                .ToListAsync();



            return raporlar;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VardiyaRaporu>> GetVardiyaRaporu(int id)
        {
            var rapor = await _context.VardiyaRaporlari.FindAsync(id);
            if (rapor == null) return NotFound();
            return rapor;
        }

        [HttpPost]
        public async Task<ActionResult<VardiyaRaporu>> PostVardiyaRaporu(VardiyaRaporu rapor)
        {
            rapor.Tarih = DateTime.Now;
            _context.VardiyaRaporlari.Add(rapor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVardiyaRaporu), new { id = rapor.Id }, rapor);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> DeleteVardiyaRaporu(int id)
        {
            var rapor = await _context.VardiyaRaporlari.FindAsync(id);
            if (rapor == null)
            {
                return NotFound();
            }

            _context.VardiyaRaporlari.Remove(rapor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
