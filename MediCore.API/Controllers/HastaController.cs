using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using MediCore.API.Entities;
using Microsoft.AspNetCore.Authorization;
using MediCore.API.Helpers;

namespace MediCore.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class HastaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HastaController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Hasta — Tüm hastaları veya arama sonuçlarını getir
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Hasta>>> GetHastalar([FromQuery] string? ara)
        {
            var sorgu = _context.Hastalar.AsQueryable();

            if (!string.IsNullOrWhiteSpace(ara))
            {
                var kucuk = ara.ToLower();
                sorgu = sorgu.Where(h =>
                    h.Ad.ToLower().Contains(kucuk) ||
                    h.Soyad.ToLower().Contains(kucuk) ||
                    h.HastaNo.ToLower().Contains(kucuk) ||
                    h.TcKimlikNo.Contains(kucuk) ||
                    h.OdaNo.ToLower().Contains(kucuk));
            }

            return await sorgu.OrderBy(h => h.OdaNo).ThenBy(h => h.YatakNo).ToListAsync();
        }

        // GET: api/Hasta/5 — Tek bir hastayı ID ile getir
        [HttpGet("{id}")]
        public async Task<ActionResult<Hasta>> GetHasta(int id)
        {
            var hasta = await _context.Hastalar.FindAsync(id);
            if (hasta == null) return NotFound();
            return hasta;
        }

        private ActionResult? ValidateHasta(Hasta hasta)
        {
            if (string.IsNullOrWhiteSpace(hasta.Ad) || hasta.Ad.Trim().Length < 2)
            {
                return BadRequest("Geçersiz Ad (en az 2 karakter olmalıdır).");
            }
            if (string.IsNullOrWhiteSpace(hasta.Soyad) || hasta.Soyad.Trim().Length < 2)
            {
                return BadRequest("Geçersiz Soyad (en az 2 karakter olmalıdır).");
            }
            if (!Helpers.ValidationHelper.IsValidTcKimlikNo(hasta.TcKimlikNo))
            {
                return BadRequest("Geçersiz T.C. Kimlik Numarası (TC Kimlik No 11 haneli ve geçerli algoritmalı olmalıdır).");
            }
            if (!string.IsNullOrEmpty(hasta.Telefon) && !Helpers.ValidationHelper.IsValidPhone(hasta.Telefon))
            {
                return BadRequest("Geçersiz Telefon Numarası (Cep telefonu 5xx xxx xx xx formatında olmalıdır).");
            }
            if (!string.IsNullOrEmpty(hasta.HastaYakiniTelefon) && !Helpers.ValidationHelper.IsValidPhone(hasta.HastaYakiniTelefon))
            {
                return BadRequest("Geçersiz Hasta Yakını Telefon Numarası (Cep telefonu 5xx xxx xx xx formatında olmalıdır).");
            }
            if (hasta.DogumTarihi != default)
            {
                if (hasta.DogumTarihi > DateTime.Now)
                {
                    return BadRequest("Doğum tarihi gelecek bir tarih olamaz.");
                }
                if (hasta.DogumTarihi.Year < 1900)
                {
                    return BadRequest("Doğum tarihi 1900 yılından önce olamaz.");
                }
            }
            if (!string.IsNullOrEmpty(hasta.OdaNo) && (!int.TryParse(hasta.OdaNo, out int odaNum) || odaNum < 100 || odaNum > 121))
            {
                return BadRequest("Geçersiz Oda Numarası (Oda numarası 100 ile 121 arasında olmalıdır).");
            }
            if (!string.IsNullOrEmpty(hasta.YatakNo) && (!int.TryParse(hasta.YatakNo, out int yatakNum) || yatakNum < 1 || yatakNum > 2))
            {
                return BadRequest("Geçersiz Yatak Numarası (Yatak numarası 1 veya 2 olmalıdır).");
            }
            return null;
        }

        // POST: api/Hasta — Yeni hasta ekle
        [HttpPost]
        [Authorize(Roles = "Bashekim")]
        public async Task<ActionResult<Hasta>> PostHasta(Hasta hasta)
        {
            var valResult = ValidateHasta(hasta);
            if (valResult != null) return valResult;

            var maxId = await _context.Hastalar.MaxAsync(h => (int?)h.Id) ?? 0;
            hasta.HastaNo = $"H-{DateTime.Now.Year}-{(maxId + 1):D3}";
            hasta.GirisTarihi = DateTime.Now;
            hasta.Durum = "Kurumda";

            _context.Hastalar.Add(hasta);
            await _context.SaveChangesAsync();

            // Aktivite logu yaz
            var userAd = User.Identity?.Name ?? "Bilinmeyen Kullanıcı";
            var userRol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Sistem";
            await AuditLogger.LogAsync(_context, userAd, userRol, "Hasta Kaydı", $"Yeni hasta kaydı oluşturuldu: {hasta.Ad} {hasta.Soyad} (Hasta No: {hasta.HastaNo}, T.C. {hasta.TcKimlikNo})", HttpContext.Connection.RemoteIpAddress?.ToString());

            return CreatedAtAction(nameof(GetHasta), new { id = hasta.Id }, hasta);
        }

        // PUT: api/Hasta/5 — Hasta bilgilerini güncelle
        [HttpPut("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> PutHasta(int id, Hasta hasta)
        {
            if (id != hasta.Id) return BadRequest("ID uyuşmazlığı.");

            var valResult = ValidateHasta(hasta);
            if (valResult != null) return valResult;

            _context.Entry(hasta).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                // Aktivite logu yaz
                var userAd = User.Identity?.Name ?? "Bilinmeyen Kullanıcı";
                var userRol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Sistem";
                await AuditLogger.LogAsync(_context, userAd, userRol, "Hasta Güncelleme", $"Hasta bilgileri güncellendi: {hasta.Ad} {hasta.Soyad} (Hasta No: {hasta.HastaNo})", HttpContext.Connection.RemoteIpAddress?.ToString());
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HastaExists(id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Hasta/5 — Hasta sil
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> DeleteHasta(int id)
        {
            var hasta = await _context.Hastalar.FindAsync(id);
            if (hasta == null) return NotFound();

            _context.Hastalar.Remove(hasta);
            await _context.SaveChangesAsync();

            // Aktivite logu yaz
            var userAd = User.Identity?.Name ?? "Bilinmeyen Kullanıcı";
            var userRol = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Sistem";
            await AuditLogger.LogAsync(_context, userAd, userRol, "Hasta Silme", $"Hasta kaydı silindi: {hasta.Ad} {hasta.Soyad} (Hasta No: {hasta.HastaNo})", HttpContext.Connection.RemoteIpAddress?.ToString());

            return NoContent();
        }

        private bool HastaExists(int id) => _context.Hastalar.Any(e => e.Id == id);
    }
}