using System;
using System.Threading.Tasks;
using MediCore.API.Data;
using MediCore.API.Entities;

namespace MediCore.API.Helpers
{
    public static class AuditLogger
    {
        public static async Task LogAsync(AppDbContext context, string kullanici, string rol, string islemTuru, string detay, string? ipAdresi = null)
        {
            try
            {
                var log = new AktiviteLog
                {
                    Tarih = DateTime.Now,
                    Kullanici = string.IsNullOrWhiteSpace(kullanici) ? "Sistem" : kullanici,
                    Rol = string.IsNullOrWhiteSpace(rol) ? "System" : rol,
                    IslemTuru = islemTuru,
                    Detay = detay,
                    IpAdresi = ipAdresi
                };
                context.AktiviteLoglari.Add(log);
                await context.SaveChangesAsync();
            }
            catch (Exception)
            {
                // Audit log yazma hatası ana iş akışını engellememelidir
            }
        }
    }
}
