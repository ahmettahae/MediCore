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
    public class GorevController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GorevController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Gorev>>> GetGorevler()
        {
            var gorevler = await _context.Gorevler.ToListAsync();
            

            return gorevler;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Gorev>> GetGorev(int id)
        {
            var gorev = await _context.Gorevler.FindAsync(id);
            if (gorev == null) return NotFound();
            return gorev;
        }

        [HttpPost]
        public async Task<ActionResult<Gorev>> PostGorev(Gorev gorev)
        {
            gorev.OlusturmaTarihi = DateTime.Now;
            _context.Gorevler.Add(gorev);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGorev), new { id = gorev.Id }, gorev);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutGorev(int id, Gorev gorev)
        {
            if (id != gorev.Id) return BadRequest();
            
            var existingGorev = await _context.Gorevler.FindAsync(id);
            if (existingGorev == null) return NotFound();

            existingGorev.Durum = gorev.Durum;
            existingGorev.Baslik = gorev.Baslik;
            existingGorev.Detay = gorev.Detay;
            existingGorev.PersonelAdSoyad = gorev.PersonelAdSoyad;
            existingGorev.Oncelik = gorev.Oncelik;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Yonetici")]
        public async Task<IActionResult> DeleteGorev(int id)
        {
            var gorev = await _context.Gorevler.FindAsync(id);
            if (gorev == null) return NotFound();

            _context.Gorevler.Remove(gorev);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
