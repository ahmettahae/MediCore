using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class VitalBulgu
    {
        public int Id { get; set; }
        
        public int HastaId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Hasta? Hasta { get; set; }

        public int KullaniciId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Kullanici? Kullanici { get; set; }

        public int? NabizBPM { get; set; }
        public int? TansiyonSistol { get; set; }
        public int? TansiyonDiyastol { get; set; }
        public decimal? AtesC { get; set; }
        public int? SoluSayisi { get; set; }
        public int? SaturasyonYuzdesi { get; set; }

        public DateTime Tarih { get; set; } = DateTime.Now;
    }
}
