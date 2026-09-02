using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace MediCore.API.Entities
{
    public class IlacUygulama
    {
        public int Id { get; set; }

        public int HastaId { get; set; }
        [JsonIgnore]
        [ValidateNever]
        public Hasta? Hasta { get; set; }

        public int HastaIlacId { get; set; }
        [JsonIgnore]
        [ValidateNever]
        public HastaIlac? HastaIlac { get; set; }

        public int IlacId { get; set; }
        [JsonIgnore]
        [ValidateNever]
        public Ilac? Ilac { get; set; }

        public int? UygulayanKullaniciId { get; set; }
        public string? UygulayanKullaniciAd { get; set; }

        public DateTime Tarih { get; set; } = DateTime.Today;
        public string Ogun { get; set; } = "Sabah"; // Sabah, Öğle, Akşam, Gece

        // Durum: Bekliyor, Verildi, Reddedildi, Uyuyor, Ertelendi, AcVerilemedi
        public string Durum { get; set; } = "Bekliyor";
        public DateTime? UygulamaZamani { get; set; }
        public string? Aciklama { get; set; }
    }
}
