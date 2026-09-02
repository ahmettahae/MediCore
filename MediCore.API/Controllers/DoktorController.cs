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
    public class DoktorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DoktorController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Doktor — Kurum Hekimleri / Doktor Listesi
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doktor>>> GetDoktorlar([FromQuery] string? ara)
        {
            var sorgu = _context.Doktorlar.AsQueryable();

            if (!string.IsNullOrWhiteSpace(ara))
            {
                var k = ara.ToLower();
                sorgu = sorgu.Where(d =>
                    d.Ad.ToLower().Contains(k) ||
                    d.Soyad.ToLower().Contains(k) ||
                    (d.UzmanlikAlani != null && d.UzmanlikAlani.ToLower().Contains(k)) ||
                    (d.CalistigiBirim != null && d.CalistigiBirim.ToLower().Contains(k)) ||
                    (d.TcKimlikNo != null && d.TcKimlikNo.Contains(k)) ||
                    (d.SicilNo != null && d.SicilNo.ToLower().Contains(k)));
            }

            var doktorlar = await sorgu.ToListAsync();
            return Ok(doktorlar);
        }

        // GET: api/Doktor/5 — Tekil Doktor Getir
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Doktor>> GetDoktor(int id)
        {
            var doktor = await _context.Doktorlar.FindAsync(id);
            if (doktor == null) return NotFound();
            return Ok(doktor);
        }

        // GET: api/Doktor/kurumhekim — Kurum Hekimini getir
        [HttpGet("kurumhekim")]
        [HttpGet("kurum-hekim")]
        public async Task<IActionResult> GetKurumHekimi()
        {
            var doktor = await _context.Doktorlar.FirstOrDefaultAsync(d => d.UzmanlikAlani == "Başhekim" || d.UzmanlikAlani == "Başhekimlik");
            if (doktor == null) {
                doktor = await _context.Doktorlar.FirstOrDefaultAsync(); // fallback
            }
            if (doktor == null) return NotFound("Kurum hekimi veya başhekim tanımlanmamış.");
            return Ok(doktor);
        }

        // PUT: api/Doktor/kurumhekim — Kurum Hekimini Güncelle (Yönetici)
        [HttpPut("kurumhekim")]
        [HttpPut("kurum-hekim")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> PutKurumHekimi([FromBody] Doktor doktor)
        {
            var mevcut = await _context.Doktorlar.FirstOrDefaultAsync();
            if (mevcut == null)
            {
                doktor.Durum = "Aktif";
                _context.Doktorlar.Add(doktor);
            }
            else
            {
                mevcut.Ad = doktor.Ad;
                mevcut.Soyad = doktor.Soyad;
                mevcut.TcKimlikNo = doktor.TcKimlikNo;
                mevcut.DogumTarihi = doktor.DogumTarihi;
                mevcut.Cinsiyet = doktor.Cinsiyet;
                mevcut.Telefon = doktor.Telefon;
                mevcut.EPosta = doktor.EPosta;
                mevcut.UzmanlikAlani = doktor.UzmanlikAlani;
                mevcut.SicilNo = doktor.SicilNo;
                mevcut.CalistigiBirim = doktor.CalistigiBirim;
                mevcut.GoreveBaslamaTarihi = doktor.GoreveBaslamaTarihi;
                mevcut.KullaniciAdi = doktor.KullaniciAdi;
                mevcut.Durum = doktor.Durum ?? "Aktif";
            }

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Kurum hekimi bilgileri güncellendi." });
        }

        // POST: api/Doktor — Yeni doktor ekle
        [HttpPost]
        [Authorize(Roles = "Bashekim")]
        public async Task<ActionResult<Doktor>> PostDoktor([FromBody] Doktor doktor)
        {
            doktor.Durum = doktor.Durum ?? "Aktif";
            _context.Doktorlar.Add(doktor);

            // Personel kadrosuna da otomatik olarak ekle
            var adSoyad = $"Dr. {doktor.Ad} {doktor.Soyad}";
            var personelExist = await _context.Personeller.AnyAsync(p => p.AdSoyad == adSoyad || p.AdSoyad == $"{doktor.Ad} {doktor.Soyad}");
            if (!personelExist)
            {
                _context.Personeller.Add(new Personel
                {
                    AdSoyad = adSoyad,
                    Unvan = "Doktor",
                    Cinsiyet = doktor.Cinsiyet ?? "Belirtilmedi",
                    Telefon = doktor.Telefon ?? "-",
                    Durum = doktor.Durum == "Aktif" ? "Mesaide" : "İzinli",
                    Vardiya = "Hafta İçi (08:00 - 17:00)"
                });
            }

            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDoktorlar), new { }, doktor);
        }

        // PUT: api/Doktor/5 — Doktor güncelle
        [HttpPut("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> PutDoktor(int id, [FromBody] Doktor doktor)
        {
            if (id != doktor.Id) return BadRequest("ID uyuşmazlığı.");

            var mevcut = await _context.Doktorlar.FindAsync(id);
            if (mevcut == null) return NotFound();

            var eskiAdSoyad = $"Dr. {mevcut.Ad} {mevcut.Soyad}";

            mevcut.Ad = doktor.Ad;
            mevcut.Soyad = doktor.Soyad;
            mevcut.TcKimlikNo = doktor.TcKimlikNo;
            mevcut.DogumTarihi = doktor.DogumTarihi;
            mevcut.Cinsiyet = doktor.Cinsiyet;
            mevcut.Telefon = doktor.Telefon;
            mevcut.EPosta = doktor.EPosta;
            mevcut.UzmanlikAlani = doktor.UzmanlikAlani;
            mevcut.SicilNo = doktor.SicilNo;
            mevcut.CalistigiBirim = doktor.CalistigiBirim;
            mevcut.GoreveBaslamaTarihi = doktor.GoreveBaslamaTarihi;
            mevcut.KullaniciAdi = doktor.KullaniciAdi;
            mevcut.Durum = doktor.Durum ?? "Aktif";

            // Personel kaydını da güncelle
            var yeniAdSoyad = $"Dr. {doktor.Ad} {doktor.Soyad}";
            var personelRecord = await _context.Personeller.FirstOrDefaultAsync(p => p.AdSoyad == eskiAdSoyad || p.AdSoyad == $"{mevcut.Ad} {mevcut.Soyad}");
            if (personelRecord != null)
            {
                personelRecord.AdSoyad = yeniAdSoyad;
                personelRecord.Cinsiyet = doktor.Cinsiyet ?? personelRecord.Cinsiyet;
                personelRecord.Telefon = doktor.Telefon ?? personelRecord.Telefon;
                personelRecord.Durum = (doktor.Durum ?? "Aktif") == "Aktif" ? "Mesaide" : "İzinli";
            }

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Doktor bilgileri güncellendi." });
        }

        // DELETE: api/Doktor/5 — Doktor sil
        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> DeleteDoktor(int id)
        {
            var doktor = await _context.Doktorlar.FindAsync(id);
            if (doktor == null) return NotFound();

            var adSoyad = $"Dr. {doktor.Ad} {doktor.Soyad}";
            var personelRecord = await _context.Personeller.FirstOrDefaultAsync(p => p.AdSoyad == adSoyad || p.AdSoyad == $"{doktor.Ad} {doktor.Soyad}");
            if (personelRecord != null)
            {
                _context.Personeller.Remove(personelRecord);
            }

            _context.Doktorlar.Remove(doktor);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}