using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class HastaIlac
    {
        public int Id { get; set; }
        
        public int HastaId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Hasta? Hasta { get; set; }
        
        public int IlacId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Ilac? Ilac { get; set; }
        
        public string Dozaj { get; set; } = string.Empty;
        public string KullanimSikligi { get; set; } = string.Empty;
        public string KullanimSekli { get; set; } = string.Empty;
        
        public DateTime BaslangicTarihi { get; set; } = DateTime.Now;
        public DateTime? BitisTarihi { get; set; }

        public bool UygulandiMi { get; set; } = false;
        public DateTime? UygulanmaTarihi { get; set; }
    }
}