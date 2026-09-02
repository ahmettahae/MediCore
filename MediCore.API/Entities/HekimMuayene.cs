using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class HekimMuayene
    {
        public int Id { get; set; }

        public int HastaId { get; set; }
        [JsonIgnore]
        [ValidateNever]
        public Hasta? Hasta { get; set; }

        public int? DoktorId { get; set; }
        public string DoktorAd { get; set; } = string.Empty;

        public DateTime MuayeneTarihi { get; set; } = DateTime.Now;

        public string Sikayet { get; set; } = string.Empty;
        public string KlinikBulgular { get; set; } = string.Empty;
        public string Tani { get; set; } = string.Empty;
        public string TedaviPlani { get; set; } = string.Empty;
        public string? DiyetVeBakimOnerisi { get; set; }
        public string? ReceteOzeti { get; set; }
        public DateTime? KontrolTarihi { get; set; }

        // Genel Sağlık Durumu: Stabil, Takipte, Kritik, SevkPlanlandi
        public string Durum { get; set; } = "Stabil";
    }
}
