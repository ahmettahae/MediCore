using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class IlacStok
    {
        public int Id { get; set; }
        
        public int IlacId { get; set; }

        [JsonIgnore]
        [ValidateNever]
        public Ilac? Ilac { get; set; }

        public string PartiNo { get; set; } = string.Empty;
        public int Adet { get; set; }
        public DateTime SonKullanmaTarihi { get; set; }
        public DateTime GirisTarihi { get; set; } = DateTime.Now;
    }
}