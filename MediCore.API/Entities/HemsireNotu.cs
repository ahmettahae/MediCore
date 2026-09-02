using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class HemsireNotu
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

        public string Not { get; set; } = string.Empty;
        public DateTime Tarih { get; set; } = DateTime.Now;
    }
}
