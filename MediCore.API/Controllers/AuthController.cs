using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net;
using System.Net.Mail;
using MediCore.API.Data;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using MediCore.API.Helpers;

namespace MediCore.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AuthController(IConfiguration configuration, AppDbContext context, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _context = context;
            _env = env;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var girisMetni = model.EPosta?.Trim().ToLower();

            if (string.IsNullOrWhiteSpace(girisMetni))
                return BadRequest("Kullanıcı adı girilmelidir.");

            Kullanici? kullanici = null;
            bool isShortcut = false;

            // 1. Kısayol Kontrolleri: (Yalnızca Development/Geliştirici ortamında izin verilir)
            if (_env.IsDevelopment())
            {
                isShortcut = girisMetni == "a" || girisMetni == "h" || girisMetni == "d" || girisMetni == "bh" || girisMetni == "y";

                if (girisMetni == "a")
                {
                    kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.Rol == "Bashekim")
                        ?? new Kullanici { Id = 1, Ad = "Ahmet Taha", Soyad = "Erol", EPosta = "dr_aterol", Rol = "Bashekim" };
                }
                else if (girisMetni == "bh")
                {
                    kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.Rol == "Bashemsire")
                        ?? new Kullanici { Id = 101, Ad = "Fatma", Soyad = "Başhemşire", EPosta = "hem_bashemsire", Rol = "Bashemsire" };
                }
                else if (girisMetni == "y")
                {
                    kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.Rol == "Yonetici")
                        ?? new Kullanici { Id = 102, Ad = "Denetçi", Soyad = "Yönetici", EPosta = "yonetici_denetci", Rol = "Yonetici" };
                }
                else if (girisMetni == "h")
                {
                    kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.Rol == "Hemsire")
                        ?? new Kullanici { Id = 2, Ad = "Ayşe", Soyad = "Hemşire", EPosta = "hem_hhemsire", Rol = "Hemsire" };
                }
                else if (girisMetni == "d")
                {
                    var doktor = await _context.Doktorlar.FirstOrDefaultAsync();
                    if (doktor != null)
                    {
                        kullanici = new Kullanici
                        {
                            Id = doktor.Id,
                            Ad = doktor.Ad,
                            Soyad = doktor.Soyad,
                            EPosta = doktor.EPosta ?? "dr_moz",
                            Rol = "Doktor"
                        };
                    }
                    else
                    {
                        kullanici = new Kullanici { Id = 3, Ad = "Mehmet", Soyad = "Doktor", EPosta = "dr_moz", Rol = "Doktor" };
                    }
                }
            }

            // 2. Eğer kısayol değilse e-posta / TC No / Kullanıcı adı ile veritabanından ara
            if (kullanici == null)
            {
                kullanici = await _context.Kullanicilar
                    .FirstOrDefaultAsync(k => k.EPosta.ToLower() == girisMetni ||
                                              k.TcKimlikNo == girisMetni ||
                                              k.Ad.ToLower() == girisMetni);

                // Eğer Kullanicilar tablosunda yoksa Doktorlar tablosunda ara
                if (kullanici == null)
                {
                    var doktor = await _context.Doktorlar
                        .FirstOrDefaultAsync(d => d.KullaniciAdi.ToLower() == girisMetni ||
                                                  d.EPosta.ToLower() == girisMetni ||
                                                  d.TcKimlikNo == girisMetni);
                    if (doktor != null)
                    {
                        kullanici = new Kullanici
                        {
                            Id = doktor.Id,
                            Ad = doktor.Ad,
                            Soyad = doktor.Soyad,
                            EPosta = doktor.EPosta,
                            Rol = "Doktor"
                        };
                    }
                }
            }

            if (kullanici == null)
                return Unauthorized("Kullanıcı adı veya şifre hatalı.");

            // 3. İlk Giriş / Aktivasyon Kontrolü: Şifresi belirlenmemiş kullanıcılar için OTP üretilir
            if (!isShortcut && !kullanici.SifreBelirlendi)
            {
                var kod = Random.Shared.Next(100000, 999999).ToString();
                kullanici.GeciciKod = kod;
                kullanici.GeciciKodSonTarih = DateTime.Now.AddMinutes(5);

                // Veritabanını güncelle
                _context.Kullanicilar.Update(kullanici);
                await _context.SaveChangesAsync();

                // E-posta ile OTP kodunu gönder
                await SendOtpEmailAsync(kullanici.EPosta, $"{kullanici.Ad} {kullanici.Soyad}", kod);

                return Ok(new
                {
                    IlkGiris = true,
                    EPosta = model.EPosta?.Trim() ?? kullanici.EPosta, // Girilen metni aynen dön ki UI eşleştirebilsin
                    Mesaj = "İlk girişiniz tespit edildi. Lütfen e-posta adresinize gönderilen geçici aktivasyon kodunu girip yeni şifrenizi belirleyin."
                });
            }

            // 4. Şifre Doğrulama: Kayıtlı BCrypt hash ile doğrulama (Geliştirici kısayolları için doğrudan giriş sağlanır)
            bool sifreGecerli = isShortcut || (!string.IsNullOrEmpty(kullanici.SifreHash) && BCrypt.Net.BCrypt.Verify(model.Sifre, kullanici.SifreHash));

            if (!sifreGecerli)
                return Unauthorized("Kullanıcı adı veya şifre hatalı.");

            // 5. JWT Token üret
            var token = GenerateJwtToken(kullanici.Id, kullanici.EPosta, kullanici.Rol, kullanici.Ad, kullanici.Soyad);

            // Aktivite loguna kaydet
            await AuditLogger.LogAsync(_context, $"{kullanici.Ad} {kullanici.Soyad}", kullanici.Rol, "Sistem Girişi", $"{kullanici.Ad} {kullanici.Soyad} ({kullanici.Rol}) sisteme başarılı giriş yaptı.", HttpContext.Connection.RemoteIpAddress?.ToString());

            return Ok(new
            {
                Token = token,
                Rol = kullanici.Rol,
                Ad = kullanici.Ad,
                Soyad = kullanici.Soyad
            });
        }

        [HttpPost("activate")]
        public async Task<IActionResult> Activate([FromBody] ActivateModel model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.EPosta) || string.IsNullOrWhiteSpace(model.Kod) || string.IsNullOrWhiteSpace(model.YeniSifre))
            {
                return BadRequest("Tüm alanlar doldurulmalıdır.");
            }

            var username = model.EPosta.Trim().ToLower();
            Kullanici? kullanici = null;

            // Giriş kısayollarını çöz (Yalnızca Development/Geliştirici ortamında izin verilir)
            if (_env.IsDevelopment())
            {
                if (username == "h")
                {
                    kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.Rol == "Hemsire");
                }
                else if (username == "d")
                {
                    var doktor = await _context.Doktorlar.FirstOrDefaultAsync();
                    if (doktor != null)
                    {
                        kullanici = await _context.Kullanicilar.FirstOrDefaultAsync(k => k.EPosta == doktor.KullaniciAdi);
                    }
                }
            }

            if (kullanici == null)
            {
                kullanici = await _context.Kullanicilar
                    .FirstOrDefaultAsync(k => k.EPosta.ToLower() == username ||
                                              k.TcKimlikNo == username);
            }

            if (kullanici == null)
            {
                return NotFound("Kullanıcı bulunamadı.");
            }

            if (kullanici.SifreBelirlendi)
            {
                return BadRequest("Bu hesap zaten aktive edilmiş. Lütfen normal giriş yapınız.");
            }

            if (kullanici.GeciciKod != model.Kod)
            {
                return BadRequest("Geçersiz aktivasyon kodu.");
            }

            if (kullanici.GeciciKodSonTarih < DateTime.Now)
            {
                return BadRequest("Aktivasyon kodunun süresi dolmuş. Lütfen tekrar giriş yapmayı deneyin.");
            }

            // Güçlü Parola Politikası Doğrulaması (Password Complexity Policy)
            if (string.IsNullOrWhiteSpace(model.YeniSifre) || model.YeniSifre.Length < 6)
            {
                return BadRequest("Yeni şifre en az 6 karakter uzunluğunda olmalıdır.");
            }
            if (!model.YeniSifre.Any(char.IsDigit))
            {
                return BadRequest("Yeni şifre en az bir rakam (0-9) içermelidir.");
            }
            if (!model.YeniSifre.Any(char.IsUpper))
            {
                return BadRequest("Yeni şifre en az bir büyük harf (A-Z) içermelidir.");
            }

            // Yeni şifreyi kaydet
            kullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(model.YeniSifre);
            kullanici.SifreBelirlendi = true;
            kullanici.GeciciKod = null;
            kullanici.GeciciKodSonTarih = null;

            // Doktor ise onun Doktorlar tablosundaki düz şifresini de güncel tutalım (kullanışlılık/test amaçlı)
            if (kullanici.Rol == "Doktor")
            {
                var doktor = await _context.Doktorlar.FirstOrDefaultAsync(d => d.KullaniciAdi == kullanici.EPosta);
                if (doktor != null)
                {
                    doktor.Sifre = model.YeniSifre;
                }
            }

            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(kullanici.Id, kullanici.EPosta, kullanici.Rol, kullanici.Ad, kullanici.Soyad);

            return Ok(new
            {
                Token = token,
                Rol = kullanici.Rol,
                Ad = kullanici.Ad,
                Soyad = kullanici.Soyad
            });
        }

        private string GenerateJwtToken(int kullaniciId, string eposta, string rol, string ad, string soyad)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, kullaniciId.ToString()),
                new Claim("KullaniciId", kullaniciId.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, eposta),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, rol),
                new Claim(ClaimTypes.Name, $"{ad} {soyad}"),
                new Claim(ClaimTypes.Email, eposta)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task SendOtpEmailAsync(string recipientEmail, string recipientName, string otpCode)
        {
            // E-posta adresinin geçerliliğini basitçe kontrol et
            if (string.IsNullOrWhiteSpace(recipientEmail) || !recipientEmail.Contains("@"))
            {
                Console.WriteLine($"[WARN] Invalid or empty email address '{recipientEmail}' for {recipientName}. E-mail OTP cannot be sent. Printing code to console instead: {otpCode}");
                return;
            }

            var smtpSettings = _configuration.GetSection("SmtpSettings");
            var server = smtpSettings["Server"];
            var portStr = smtpSettings["Port"];
            var senderEmail = smtpSettings["SenderEmail"];
            var senderName = smtpSettings["SenderName"] ?? "MediCore Klinik";
            var password = smtpSettings["Password"];
            var enableSslStr = smtpSettings["EnableSsl"];

            if (string.IsNullOrWhiteSpace(server) || string.IsNullOrWhiteSpace(senderEmail))
            {
                Console.WriteLine($"[WARN] SMTP settings not configured in appsettings.json. Printing OTP to console instead: {otpCode}");
                return;
            }

            int port = int.TryParse(portStr, out int p) ? p : 587;
            bool enableSsl = !bool.TryParse(enableSslStr, out bool ssl) || ssl;

            try
            {
                using (var mail = new MailMessage())
                {
                    mail.From = new MailAddress(senderEmail, senderName);
                    mail.To.Add(new MailAddress(recipientEmail, recipientName));
                    mail.Subject = "MediCore Aktivasyon Doğrulama Kodu";
                    mail.Body = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                            <h2 style='color: #1E3E56; text-align: center;'>MediCore Aktivasyon ve Şifre Belirleme</h2>
                            <p>Merhaba <strong>{recipientName}</strong>,</p>
                            <p>MediCore Klinik ve Bakım Yönetim Sistemi'ne ilk girişinizi tamamlamak için doğrulama kodunuz aşağıdadır:</p>
                            <div style='background-color: #f4f7f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;'>
                                <span style='font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #10B981;'>{otpCode}</span>
                            </div>
                            <p style='color: #ef4444; font-size: 13px;'>Bu kod güvenlik nedeniyle <strong>5 dakika</strong> geçerlidir.</p>
                            <p>Lütfen bu kodu kimseyle paylaşmayınız.</p>
                            <hr style='border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;' />
                            <p style='font-size: 11px; color: #888888; text-align: center;'>Bu e-posta MediCore Sistemi tarafından otomatik olarak gönderilmiştir.</p>
                        </div>";
                    mail.IsBodyHtml = true;

                    using (var smtp = new SmtpClient(server, port))
                    {
                        smtp.Credentials = new NetworkCredential(senderEmail, password);
                        smtp.EnableSsl = enableSsl;
                        await smtp.SendMailAsync(mail);
                    }
                }
                Console.WriteLine($"[INFO] OTP e-mail successfully sent to {recipientEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to send OTP e-mail to {recipientEmail}. Error: {ex.Message}. OTP Code: {otpCode}");
            }
        }
    }

    public class LoginModel
    {
        public string EPosta { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
    }

    public class ActivateModel
    {
        public string EPosta { get; set; } = string.Empty;
        public string Kod { get; set; } = string.Empty;
        public string YeniSifre { get; set; } = string.Empty;
    }
}