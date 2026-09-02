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
    public class PersonelController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PersonelController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Personel>>> GetPersoneller()
        {


            var personeller = await _context.Personeller
                .Where(p => p.Unvan != "Kurum Yöneticisi" && p.Unvan != "Yönetici")
                .ToListAsync();



            var nobetler = await _context.Nobetler.ToListAsync();
            bool degisiklikVar = false;

            foreach (var personel in personeller)
            {
                var adParcalari = (personel.AdSoyad ?? "")
                    .Replace("Dr.", "")
                    .Replace("Hemşire", "")
                    .Replace("Hem.", "")
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries);

                var kisininNobetleri = nobetler.Where(n => {
                    var nobetMetni = $"{n.HemsireAd} {n.HemsireSoyad}";
                    return adParcalari.Length > 0 && adParcalari.All(parca => nobetMetni.Contains(parca, StringComparison.OrdinalIgnoreCase));
                }).ToList();

                var nobetSayisi = kisininNobetleri.Count;

                if (kisininNobetleri.Any())
                {
                    var sonTarih = kisininNobetleri.Max(n => n.NobetTarihi);
                    if (personel.SonNobetTarihi != sonTarih || personel.ToplamNot != nobetSayisi)
                    {
                        personel.SonNobetTarihi = sonTarih;
                        personel.ToplamNot = nobetSayisi;
                        degisiklikVar = true;
                    }
                }
                else
                {
                    if (personel.SonNobetTarihi != null || personel.ToplamNot != 0)
                    {
                        personel.SonNobetTarihi = null;
                        personel.ToplamNot = 0;
                        degisiklikVar = true;
                    }
                }
            }

            // Tüm doktorların Personel listesinde yer almasını otomatik garanti et
            var tumDoktorlar = await _context.Doktorlar.ToListAsync();
            foreach (var doc in tumDoktorlar)
            {
                var docAdSoyad = $"Dr. {doc.Ad} {doc.Soyad}";
                var varMi = personeller.Any(p => p.AdSoyad == docAdSoyad || p.AdSoyad == $"{doc.Ad} {doc.Soyad}" || (doc.Ad != null && p.AdSoyad.Contains(doc.Ad) && doc.Soyad != null && p.AdSoyad.Contains(doc.Soyad)));
                if (!varMi)
                {
                    var yeniPersonel = new Personel
                    {
                        AdSoyad = docAdSoyad,
                        Unvan = "Doktor",
                        Cinsiyet = doc.Cinsiyet ?? "Belirtilmedi",
                        Telefon = doc.Telefon ?? "-",
                        Durum = doc.Durum == "Aktif" ? "Mesaide" : "İzinli",
                        Vardiya = "Hafta İçi (08:00 - 17:00)"
                    };
                    _context.Personeller.Add(yeniPersonel);
                    degisiklikVar = true;
                }
            }

            // Personel listesindeki tüm Başhekim ve Doktorların Doktorlar listesinde yer almasını garanti et
            var drPersoneller = personeller.Where(p => p.Unvan == "Başhekim" || p.Unvan == "Doktor").ToList();
            foreach (var drP in drPersoneller)
            {
                var adTemiz = (drP.AdSoyad ?? "").Replace("Dr.", "").Trim();
                var doktorDb = await _context.Doktorlar.FirstOrDefaultAsync(d => (d.Ad + " " + d.Soyad).Contains(adTemiz) || adTemiz.Contains(d.Ad));
                if (doktorDb == null)
                {
                    var adSoyadSplit = adTemiz.Split(' ');
                    var ad = adSoyadSplit.Length > 0 ? adSoyadSplit[0] : "";
                    var soyad = adSoyadSplit.Length > 1 ? string.Join(" ", adSoyadSplit.Skip(1)) : "";

                    _context.Doktorlar.Add(new Doktor
                    {
                        Ad = ad,
                        Soyad = soyad,
                        UzmanlikAlani = drP.Unvan == "Başhekim" ? "Başhekim" : "Uzman Hekim",
                        Cinsiyet = drP.Cinsiyet,
                        Telefon = drP.Telefon,
                        Durum = "Aktif",
                        CalistigiBirim = drP.Unvan == "Başhekim" ? "Başhekimlik" : "Poliklinik"
                    });
                    degisiklikVar = true;
                }
            }

            if (degisiklikVar)
            {
                await _context.SaveChangesAsync();
                personeller = await _context.Personeller
                    .Where(p => p.Unvan != "Kurum Yöneticisi" && p.Unvan != "Yönetici")
                    .ToListAsync();
            }

            return personeller;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Personel>> GetPersonel(int id)
        {
            var personel = await _context.Personeller.FindAsync(id);
            if (personel == null) return NotFound();
            return personel;
        }

        private ActionResult? ValidatePersonel(Personel personel)
        {
            if (string.IsNullOrWhiteSpace(personel.AdSoyad) || personel.AdSoyad.Trim().Length < 3)
            {
                return BadRequest("Geçersiz Ad Soyad (en az 3 karakter olmalıdır).");
            }
            if (!personel.AdSoyad.Trim().Contains(" "))
            {
                return BadRequest("Ad Soyad alanında hem ad hem soyad bulunmalıdır (aralarında boşluk bırakarak yazın).");
            }
            if (string.IsNullOrWhiteSpace(personel.Unvan))
            {
                return BadRequest("Unvan alanı boş olamaz.");
            }
            if (!string.IsNullOrEmpty(personel.Telefon) && !Helpers.ValidationHelper.IsValidPhone(personel.Telefon))
            {
                return BadRequest("Geçersiz Telefon Numarası (Cep telefonu 5xx xxx xx xx formatında olmalıdır).");
            }
            return null;
        }

        [HttpPost]
        [Authorize(Roles = "Bashekim")]
        public async Task<ActionResult<Personel>> CreatePersonel(Personel personel)
        {
            var valResult = ValidatePersonel(personel);
            if (valResult != null) return valResult;

            _context.Personeller.Add(personel);
            await _context.SaveChangesAsync();

            // Eğer Başhekim veya Doktor ekleniyorsa Doktorlar tablosuna da ekle
            if (personel.Unvan == "Başhekim" || personel.Unvan == "Doktor")
            {
                var adTemiz = (personel.AdSoyad ?? "").Replace("Dr.", "").Trim();
                var doktorExist = await _context.Doktorlar.AnyAsync(d => (d.Ad + " " + d.Soyad).Contains(adTemiz) || adTemiz.Contains(d.Ad));
                if (!doktorExist)
                {
                    var adSoyadSplit = adTemiz.Split(' ');
                    var ad = adSoyadSplit.Length > 0 ? adSoyadSplit[0] : "";
                    var soyad = adSoyadSplit.Length > 1 ? string.Join(" ", adSoyadSplit.Skip(1)) : "";

                    _context.Doktorlar.Add(new Doktor
                    {
                        Ad = ad,
                        Soyad = soyad,
                        UzmanlikAlani = personel.Unvan == "Başhekim" ? "Başhekim" : "Uzman Hekim",
                        Cinsiyet = personel.Cinsiyet,
                        Telefon = personel.Telefon,
                        Durum = "Aktif",
                        KullaniciAdi = GenerateUsername(personel.AdSoyad, personel.Unvan)
                    });
                    await _context.SaveChangesAsync();
                }
            }
            else if (personel.Unvan.Contains("Hemşire") || personel.Unvan.Contains("Hemsire") || personel.Unvan.Contains("Başhemşire"))
            {
                var clean = CleanName(personel.AdSoyad);
                var parts = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var ad = parts.Length > 0 ? parts[0] : "";
                var soyad = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
                var username = GenerateUsername(personel.AdSoyad, personel.Unvan);

                var yeniKullanici = new Kullanici
                {
                    Ad = ad,
                    Soyad = soyad,
                    EPosta = username,
                    Rol = "Hemsire",
                    SifreHash = "",
                    SifreBelirlendi = false,
                    TcKimlikNo = ""
                };
                _context.Kullanicilar.Add(yeniKullanici);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetPersonel), new { id = personel.Id }, personel);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> UpdatePersonel(int id, Personel personel)
        {
            if (id != personel.Id) return BadRequest();

            var valResult = ValidatePersonel(personel);
            if (valResult != null) return valResult;

            var mevcut = await _context.Personeller.FindAsync(id);
            if (mevcut == null) return NotFound();

            var eskiAdSoyad = mevcut.AdSoyad;
            var eskiUnvan = mevcut.Unvan;

            mevcut.AdSoyad = personel.AdSoyad;
            mevcut.Unvan = personel.Unvan;
            mevcut.Cinsiyet = personel.Cinsiyet;
            mevcut.Telefon = personel.Telefon;
            mevcut.Durum = personel.Durum;
            mevcut.Vardiya = personel.Vardiya;
            mevcut.ToplamNot = personel.ToplamNot;
            mevcut.SonNobetTarihi = personel.SonNobetTarihi;

            // Eğer unvan Başhekim veya Doktor ise Doktorlar tablosunu da güncelle veya ekle
            var adTemiz = (personel.AdSoyad ?? "").Replace("Dr.", "").Trim();
            var doktorDb = await _context.Doktorlar.FirstOrDefaultAsync(d => (d.Ad + " " + d.Soyad).Contains(adTemiz) || adTemiz.Contains(d.Ad));
            
            if (personel.Unvan == "Başhekim" || personel.Unvan == "Doktor")
            {
                if (doktorDb != null)
                {
                    doktorDb.UzmanlikAlani = personel.Unvan == "Başhekim" ? "Başhekim" : (doktorDb.UzmanlikAlani == "Başhekim" ? "Uzman Hekim" : doktorDb.UzmanlikAlani);
                    if (personel.Unvan == "Başhekim") 
                    {
                        doktorDb.CalistigiBirim = "Başhekimlik";
                    }
                    doktorDb.KullaniciAdi = GenerateUsername(personel.AdSoyad, personel.Unvan);
                }
                else
                {
                    var adSoyadSplit = adTemiz.Split(' ');
                    var ad = adSoyadSplit.Length > 0 ? adSoyadSplit[0] : "";
                    var soyad = adSoyadSplit.Length > 1 ? string.Join(" ", adSoyadSplit.Skip(1)) : "";

                    _context.Doktorlar.Add(new Doktor
                    {
                        Ad = ad,
                        Soyad = soyad,
                        UzmanlikAlani = personel.Unvan == "Başhekim" ? "Başhekim" : "Uzman Hekim",
                        Cinsiyet = personel.Cinsiyet,
                        Telefon = personel.Telefon,
                        Durum = "Aktif",
                        KullaniciAdi = GenerateUsername(personel.AdSoyad, personel.Unvan)
                    });
                }
            }

            // Kullanıcı hesabı senkronizasyonu
            var oldUsername = GenerateUsername(eskiAdSoyad, eskiUnvan);
            var kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.EPosta == oldUsername);

            if (personel.Unvan.Contains("Hemşire") || personel.Unvan.Contains("Hemsire") || personel.Unvan.Contains("Başhemşire"))
            {
                var clean = CleanName(personel.AdSoyad);
                var parts = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var ad = parts.Length > 0 ? parts[0] : "";
                var soyad = parts.Length > 1 ? string.Join(" ", parts.Skip(1)) : "";
                var newUsername = GenerateUsername(personel.AdSoyad, personel.Unvan);

                if (kullanici != null)
                {
                    kullanici.Ad = ad;
                    kullanici.Soyad = soyad;
                    kullanici.EPosta = newUsername;
                    kullanici.Rol = "Hemsire";
                }
                else
                {
                    _context.Kullanicilar.Add(new Kullanici
                    {
                        Ad = ad,
                        Soyad = soyad,
                        EPosta = newUsername,
                        Rol = "Hemsire",
                        SifreHash = "",
                        SifreBelirlendi = false,
                        TcKimlikNo = ""
                    });
                }
            }
            else
            {
                // Unvan hemşirelikten çıkarıldıysa Kullanici hesabını sil
                if (kullanici != null)
                {
                    _context.Kullanicilar.Remove(kullanici);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(mevcut);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Bashekim")]
        public async Task<IActionResult> DeletePersonel(int id)
        {
            var personel = await _context.Personeller.FindAsync(id);
            if (personel == null) return NotFound();

            var username = GenerateUsername(personel.AdSoyad, personel.Unvan);
            var kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.EPosta == username);
            if (kullanici != null)
            {
                _context.Kullanicilar.Remove(kullanici);
            }

            _context.Personeller.Remove(personel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PersonelExists(int id)
        {
            return _context.Personeller.Any(e => e.Id == id);
        }

        private static string CleanName(string? adSoyad)
        {
            if (string.IsNullOrWhiteSpace(adSoyad)) return "";
            return adSoyad
                .Replace("Dr.", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Hekim", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Hemşire", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Hem.", "", StringComparison.OrdinalIgnoreCase)
                .Trim();
        }

        private static string ConvertTurkishChars(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "";
            var source = "İIŞĞÜÇÖışğüçö";
            var destination = "iisgucoisguco";
            var result = text;
            for (int i = 0; i < source.Length; i++)
            {
                result = result.Replace(source[i].ToString(), destination[i].ToString());
            }
            
            var cleaned = result.ToLowerInvariant();
            var sb = new System.Text.StringBuilder();
            foreach (char c in cleaned)
            {
                if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }

        private static string GenerateUsername(string? adSoyad, string? unvan)
        {
            var clean = CleanName(adSoyad);
            var parts = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return "";

            var prefix = "per";
            var u = unvan?.ToLowerInvariant() ?? "";
            if (u.Contains("hemsire") || u.Contains("hemşire") || u.Contains("başhemşire"))
                prefix = "hem";
            else if (u.Contains("doktor") || u.Contains("hekim") || u.Contains("başhekim") || u.Contains("yönetici") || u.Contains("yonetici"))
                prefix = "dr";

            var surname = ConvertTurkishChars(parts[parts.Length - 1]);
            var firstLetters = "";
            for (int i = 0; i < parts.Length - 1; i++)
            {
                var cleanedPart = ConvertTurkishChars(parts[i]);
                if (cleanedPart.Length > 0)
                    firstLetters += cleanedPart[0];
            }

            if (parts.Length == 1)
            {
                return $"{prefix}_{ConvertTurkishChars(parts[0])}";
            }

            return $"{prefix}_{firstLetters}{surname}";
        }
    }
}
