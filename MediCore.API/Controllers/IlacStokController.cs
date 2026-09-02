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
    public class IlacStokController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IlacStokController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/IlacStok/ilac/5 — Bir ilacın tüm stok partileri
        [HttpGet("ilac/{ilacId}")]
        public async Task<IActionResult> GetStoklar(int ilacId)
        {
            var stoklar = await _context.IlacStoklari
                .Where(s => s.IlacId == ilacId)
                .OrderBy(s => s.SonKullanmaTarihi) // SKT'ye göre sırala (önce dolacak önce)
                .Select(s => new
                {
                    s.Id,
                    s.PartiNo,
                    s.Adet,
                    s.SonKullanmaTarihi,
                    s.GirisTarihi,
                    // Kaç gün kaldı?
                    KalanGun = (s.SonKullanmaTarihi - DateTime.Now).Days,
                    SktUyarisi = (s.SonKullanmaTarihi - DateTime.Now).Days <= 30
                })
                .ToListAsync();

            return Ok(stoklar);
        }

        // GET: api/IlacStok/uyarilar — Kritik stok + yaklaşan SKT uyarıları
        [HttpGet("uyarilar")]
        public async Task<IActionResult> GetUyarilar()
        {
            var bugun = DateTime.Now;
            var otuzGunSonra = bugun.AddDays(30);

            // Yaklaşan SKT uyarıları
            var sktUyarilari = await _context.IlacStoklari
                .Include(s => s.Ilac)
                .Where(s => s.SonKullanmaTarihi <= otuzGunSonra && s.Adet > 0)
                .OrderBy(s => s.SonKullanmaTarihi)
                .Select(s => new
                {
                    Tip = "SKT",
                    IlacAd = s.Ilac != null ? s.Ilac.Ad : "Bilinmeyen İlaç",
                    s.PartiNo,
                    s.Adet,
                    s.SonKullanmaTarihi,
                    KalanGun = (s.SonKullanmaTarihi - bugun).Days
                })
                .ToListAsync();

            // Kritik stok uyarıları
            var kritikStoklar = await _context.Ilaclar
                .Select(i => new
                {
                    Tip = "KRITIK",
                    IlacAd = i.Ad,
                    PartiNo = (string?)null,
                    ToplamAdet = _context.IlacStoklari
                        .Where(s => s.IlacId == i.Id)
                        .Sum(s => (int?)s.Adet) ?? 0,
                    i.KritikStokSeviyesi,
                    i.Id
                })
                .Where(i => i.ToplamAdet <= i.KritikStokSeviyesi)
                .ToListAsync();

            return Ok(new { sktUyarilari, kritikStoklar });
        }

        // POST: api/IlacStok — Yeni stok partisi ekle
        [HttpPost]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> PostStok(IlacStok stok)
        {
            stok.GirisTarihi = DateTime.Now;
            _context.IlacStoklari.Add(stok);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Stok eklendi.", stok.Id });
        }

        // POST: api/IlacStok/hizli-degisim — Hızlı Stok Artır / Azalt (+1 / -1)
        [HttpPost("hizli-degisim")]
        public async Task<IActionResult> HizliStokDegisimi([FromBody] HizliStokModel model)
        {
            var ilac = await _context.Ilaclar.FindAsync(model.IlacId);
            if (ilac == null) return NotFound("İlaç bulunamadı.");

            if (model.Miktar > 0)
            {
                // Stok Artır (+1)
                var enSonStok = await _context.IlacStoklari
                    .Where(s => s.IlacId == model.IlacId)
                    .OrderByDescending(s => s.GirisTarihi)
                    .FirstOrDefaultAsync();

                if (enSonStok != null)
                {
                    enSonStok.Adet += model.Miktar;
                }
                else
                {
                    _context.IlacStoklari.Add(new IlacStok
                    {
                        IlacId = model.IlacId,
                        PartiNo = "PRT-" + DateTime.Now.ToString("yyMMdd"),
                        Adet = model.Miktar,
                        SonKullanmaTarihi = DateTime.Now.AddYears(2),
                        GirisTarihi = DateTime.Now
                    });
                }
            }
            else if (model.Miktar < 0)
            {
                // Stok Azalt (-1)
                var azaltilacakMiktar = Math.Abs(model.Miktar);
                var aktifStoklar = await _context.IlacStoklari
                    .Where(s => s.IlacId == model.IlacId && s.Adet > 0)
                    .OrderBy(s => s.SonKullanmaTarihi)
                    .ToListAsync();

                foreach (var stok in aktifStoklar)
                {
                    if (azaltilacakMiktar <= 0) break;
                    if (stok.Adet >= azaltilacakMiktar)
                    {
                        stok.Adet -= azaltilacakMiktar;
                        azaltilacakMiktar = 0;
                    }
                    else
                    {
                        azaltilacakMiktar -= stok.Adet;
                        stok.Adet = 0;
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Stok başarıyla güncellendi." });
        }

        // DELETE: api/IlacStok/5 — Stok partisi sil
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim,Bashemsire")]
        public async Task<IActionResult> DeleteStok(int id)
        {
            var stok = await _context.IlacStoklari.FindAsync(id);
            if (stok == null) return NotFound();
            _context.IlacStoklari.Remove(stok);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class HizliStokModel
    {
        public int IlacId { get; set; }
        public int Miktar { get; set; }
    }
}
