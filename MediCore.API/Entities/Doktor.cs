using System;
using System.Text.Json.Serialization;

namespace MediCore.API.Entities
{
    public class Doktor
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public string Soyad { get; set; } = string.Empty;
        public string TcKimlikNo { get; set; } = string.Empty;
        public DateTime? DogumTarihi { get; set; }
        public string Cinsiyet { get; set; } = string.Empty;
        public string Telefon { get; set; } = string.Empty;
        public string EPosta { get; set; } = string.Empty;
        public string UzmanlikAlani { get; set; } = string.Empty;
        public string SicilNo { get; set; } = string.Empty;
        public string CalistigiBirim { get; set; } = string.Empty;
        public DateTime? GoreveBaslamaTarihi { get; set; }
        public string KullaniciAdi { get; set; } = string.Empty;
        public string Sifre { get; set; } = string.Empty;
        public string Durum { get; set; } = "Aktif";
    }
}