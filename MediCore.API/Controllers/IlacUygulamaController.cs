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
    public class IlacUygulamaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IlacUygulamaController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/IlacUygulama/gunluk?tarih=2026-08-18&ogun=Sabah
        [HttpGet("gunluk")]
        public async Task<IActionResult> GetGunlukCizelge([FromQuery] DateTime? tarih, [FromQuery] string? ogun)
        {
            var secilenTarih = tarih?.Date ?? DateTime.Today;
            var secilenOgun = string.IsNullOrWhiteSpace(ogun) ? "Sabah" : ogun;

            // Aktif hastaları getir
            var hastalar = await _context.Hastalar
                .Where(h => h.Durum == "Aktif")
                .OrderBy(h => h.OdaNo)
                .ThenBy(h => h.YatakNo)
                .ToListAsync();

            var hastaIdler = hastalar.Select(h => h.Id).ToList();

            // Hastaların aktif ilaç reçetelerini getir
            var hastaIlaclari = await _context.HastaIlaclari
                .Where(hi => hastaIdler.Contains(hi.HastaId) && (hi.BitisTarihi == null || hi.BitisTarihi >= secilenTarih))
                .Include(hi => hi.Ilac)
                .ToListAsync();

            // O gün ve o öğündeki mevcut uygulama kayıtlarını getir
            var uygulamalar = await _context.IlacUygulamalari
                .Where(u => u.Tarih.Date == secilenTarih && u.Ogun == secilenOgun && hastaIdler.Contains(u.HastaId))
                .ToListAsync();

            var sonuc = hastalar.Select(h =>
            {
                var hastaninIlaclari = hastaIlaclari.Where(hi => hi.HastaId == h.Id).ToList();

                var ilacDetaylari = hastaninIlaclari.Select(hi =>
                {
                    var mevcutKayit = uygulamalar.FirstOrDefault(u => u.HastaIlacId == hi.Id);
                    return new
                    {
                        HastaIlacId = hi.Id,
                        IlacId = hi.IlacId,
                        IlacAd = hi.Ilac?.Ad ?? "Bilinmeyen İlaç",
                        EtkenMadde = hi.Ilac?.EtkenMadde ?? "",
                        Form = hi.Ilac?.Form ?? "Tablet",
                        Dozaj = hi.Dozaj,
                        KullanimSikligi = hi.KullanimSikligi,
                        KullanimSekli = hi.KullanimSekli,
                        Durum = mevcutKayit?.Durum ?? "Bekliyor",
                        UygulamaZamani = mevcutKayit?.UygulamaZamani,
                        UygulayanKullaniciAd = mevcutKayit?.UygulayanKullaniciAd,
                        Aciklama = mevcutKayit?.Aciklama,
                        UygulamaId = mevcutKayit?.Id
                    };
                }).ToList();

                return new
                {
                    HastaId = h.Id,
                    h.HastaNo,
                    h.Ad,
                    h.Soyad,
                    h.OdaNo,
                    h.YatakNo,
                    h.AlerjiBilgisi,
                    Ilaclar = ilacDetaylari,
                    ToplamIlac = ilacDetaylari.Count,
                    TamamlananIlac = ilacDetaylari.Count(i => i.Durum == "Verildi")
                };
            }).Where(h => h.Ilaclar.Any()).ToList();

            return Ok(new
            {
                Tarih = secilenTarih,
                Ogun = secilenOgun,
                ToplamHasta = sonuc.Count,
                ToplamPlanlananIlac = sonuc.Sum(s => s.ToplamIlac),
                TamamlananIlac = sonuc.Sum(s => s.TamamlananIlac),
                Cizelge = sonuc
            });
        }

        // POST: api/IlacUygulama/durum-guncelle
        [HttpPost("durum-guncelle")]
        public async Task<IActionResult> DurumGuncelle([FromBody] DurumGuncelleDto dto)
        {
            var secilenTarih = dto.Tarih?.Date ?? DateTime.Today;
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Hemşire";

            var kayit = await _context.IlacUygulamalari
                .FirstOrDefaultAsync(u => u.HastaIlacId == dto.HastaIlacId && u.Tarih.Date == secilenTarih && u.Ogun == dto.Ogun);

            if (kayit == null)
            {
                var hastaIlac = await _context.HastaIlaclari.FindAsync(dto.HastaIlacId);
                if (hastaIlac == null) return NotFound("İlaç ataması bulunamadı.");

                kayit = new IlacUygulama
                {
                    HastaId = hastaIlac.HastaId,
                    HastaIlacId = hastaIlac.Id,
                    IlacId = hastaIlac.IlacId,
                    Tarih = secilenTarih,
                    Ogun = dto.Ogun,
                    Durum = dto.Durum,
                    UygulamaZamani = dto.Durum == "Bekliyor" ? null : DateTime.Now,
                    UygulayanKullaniciAd = userName,
                    Aciklama = dto.Aciklama
                };
                _context.IlacUygulamalari.Add(kayit);
            }
            else
            {
                kayit.Durum = dto.Durum;
                kayit.UygulamaZamani = dto.Durum == "Bekliyor" ? null : DateTime.Now;
                kayit.UygulayanKullaniciAd = userName;
                kayit.Aciklama = dto.Aciklama;
            }

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "İlaç uygulama durumu güncellendi.", kayit });
        }

        // POST: api/IlacUygulama/toplu-verildi
        [HttpPost("toplu-verildi")]
        public async Task<IActionResult> TopluVerildi([FromBody] TopluVerildiDto dto)
        {
            if (dto.HastaIlacIdler == null || !dto.HastaIlacIdler.Any())
                return BadRequest("İlaç listesi boş olamaz.");

            var secilenTarih = dto.Tarih?.Date ?? DateTime.Today;
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Hemşire";

            var hastaIlaclari = await _context.HastaIlaclari
                .Where(hi => dto.HastaIlacIdler.Contains(hi.Id))
                .ToListAsync();

            var mevcutKayitlar = await _context.IlacUygulamalari
                .Where(u => u.Tarih.Date == secilenTarih && u.Ogun == dto.Ogun && dto.HastaIlacIdler.Contains(u.HastaIlacId))
                .ToListAsync();

            foreach (var hi in hastaIlaclari)
            {
                var kayit = mevcutKayitlar.FirstOrDefault(m => m.HastaIlacId == hi.Id);
                if (kayit == null)
                {
                    _context.IlacUygulamalari.Add(new IlacUygulama
                    {
                        HastaId = hi.HastaId,
                        HastaIlacId = hi.Id,
                        IlacId = hi.IlacId,
                        Tarih = secilenTarih,
                        Ogun = dto.Ogun,
                        Durum = "Verildi",
                        UygulamaZamani = DateTime.Now,
                        UygulayanKullaniciAd = userName,
                        Aciklama = "Toplu onay ile verildi"
                    });
                }
                else
                {
                    kayit.Durum = "Verildi";
                    kayit.UygulamaZamani = DateTime.Now;
                    kayit.UygulayanKullaniciAd = userName;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { mesaj = $"{hastaIlaclari.Count} adet ilaç başarıyla verildi olarak kaydedildi." });
        }

        // GET: api/IlacUygulama/ozet?tarih=2026-08-18
        [HttpGet("ozet")]
        public async Task<IActionResult> GetGunlukOzet([FromQuery] DateTime? tarih)
        {
            var secilenTarih = tarih?.Date ?? DateTime.Today;

            var aktifHastaSayisi = await _context.Hastalar.CountAsync(h => h.Durum == "Aktif");
            var aktifHastaIlaclari = await _context.HastaIlaclari
                .Where(hi => hi.BitisTarihi == null || hi.BitisTarihi >= secilenTarih)
                .CountAsync();

            var bugunkuUygulamalar = await _context.IlacUygulamalari
                .Where(u => u.Tarih.Date == secilenTarih)
                .ToListAsync();

            var sabahVerilen = bugunkuUygulamalar.Count(u => u.Ogun == "Sabah" && u.Durum == "Verildi");
            var ogleVerilen = bugunkuUygulamalar.Count(u => u.Ogun == "Öğle" && u.Durum == "Verildi");
            var aksamVerilen = bugunkuUygulamalar.Count(u => u.Ogun == "Akşam" && u.Durum == "Verildi");
            var geceVerilen = bugunkuUygulamalar.Count(u => u.Ogun == "Gece" && u.Durum == "Verildi");

            return Ok(new
            {
                Tarih = secilenTarih,
                AktifHastaSayisi = aktifHastaSayisi,
                ToplamPlanlananDoz = aktifHastaIlaclari * 4, // 4 öğün varsayımı
                ToplamVerilen = bugunkuUygulamalar.Count(u => u.Durum == "Verildi"),
                ToplamReddedilen = bugunkuUygulamalar.Count(u => u.Durum == "Reddedildi" || u.Durum == "AcVerilemedi"),
                SabahVerilen = sabahVerilen,
                OgleVerilen = ogleVerilen,
                AksamVerilen = aksamVerilen,
                GeceVerilen = geceVerilen
            });
        }
    }

    public class DurumGuncelleDto
    {
        public int HastaIlacId { get; set; }
        public DateTime? Tarih { get; set; }
        public string Ogun { get; set; } = "Sabah";
        public string Durum { get; set; } = "Verildi";
        public string? Aciklama { get; set; }
    }

    public class TopluVerildiDto
    {
        public List<int> HastaIlacIdler { get; set; } = new();
        public DateTime? Tarih { get; set; }
        public string Ogun { get; set; } = "Sabah";
    }
}
