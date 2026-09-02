using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class HastahaneSevk
    {
        public int Id { get; set; }
        public int HastaId { get; set; }
        
        [JsonIgnore]
        [ValidateNever]
        public Hasta? Hasta { get; set; }

        public DateTime SevkTarihi { get; set; } = DateTime.Now;
        public string SevkEdilenHastane { get; set; } = string.Empty;
        public string SevkNedeni { get; set; } = string.Empty;
        public string SevkTipi { get; set; } = "Acil (112 Ambulans)";
        public string DoktorNotu { get; set; } = string.Empty;
        public int? SevkEdenKullaniciId { get; set; }
        public string SevkEdenAd { get; set; } = string.Empty;
        public string Durum { get; set; } = "Sevk Edildi";
        public DateTime? GeriDonusTarihi { get; set; }
        public string GeriDonusNotu { get; set; } = string.Empty;
    }
}
