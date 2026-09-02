using System;

namespace MediCore.API.Entities
{
    public class AktiviteLog
    {
        public int Id { get; set; }
        public DateTime Tarih { get; set; } = DateTime.Now;
        public string Kullanici { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string IslemTuru { get; set; } = string.Empty;
        public string Detay { get; set; } = string.Empty;
        public string? IpAdresi { get; set; }
    }
}
