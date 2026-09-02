namespace MediCore.API.Entities
{
    public class Personel
    {
        public int Id { get; set; }
        public string AdSoyad { get; set; } = string.Empty;
        public string Unvan { get; set; } = string.Empty;
        public string Cinsiyet { get; set; } = string.Empty;
        public string Telefon { get; set; } = string.Empty;
        public string Durum { get; set; } = string.Empty;
        public string Vardiya { get; set; } = string.Empty;
        public int ToplamNot { get; set; } = 0;
        public DateTime? SonNobetTarihi { get; set; }
    }
}
