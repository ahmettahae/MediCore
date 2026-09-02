namespace MediCore.API.Entities
{
    public class Hasta
    {
        // Hastanın Kişisel Bilgileri
        public int Id { get; set; }
        public string HastaNo { get; set; } = string.Empty; 
        public string TcKimlikNo { get; set; } = string.Empty;
        public string Ad { get; set; } = string.Empty;
        public string Soyad { get; set; } = string.Empty;
        public DateTime DogumTarihi { get; set; }
        public string Cinsiyet { get; set; } = string.Empty;
        public string Telefon { get; set; } = string.Empty;
        
        // Hasta Yakını Bilgileri
        public string HastaYakiniAd { get; set; } = string.Empty;
        public string HastaYakiniTelefon { get; set; } = string.Empty;
        
        // Bakım Merkezi Oda / Yatak Konumu
        public string OdaNo { get; set; } = string.Empty;
        public string YatakNo { get; set; } = string.Empty;
        
        // Sağlık Detayları
        public string Hastalik { get; set; } = string.Empty;
        public string AlerjiBilgisi { get; set; } = string.Empty;
        
        // Yatış ve Durum Takibi
        public DateTime GirisTarihi { get; set; } = DateTime.Now;
        public DateTime? CikisTarihi { get; set; } 
        public string Durum { get; set; } = "Aktif"; 
    }
}