namespace MediCore.API.Entities
{
    public class Kullanici
    {
        public int Id { get; set; }
        
        // Sisteme eklenen TC Kimlik No alanı
        public string TcKimlikNo { get; set; } = string.Empty; 
        
        public string Ad { get; set; } = string.Empty;
        public string Soyad { get; set; } = string.Empty;
        
        // Sisteme giriş yaparken kullanılacak
        public string EPosta { get; set; } = string.Empty; 
        
        // Şifreleri açık metin olarak değil, hash'lenmiş (şifrelenmiş) olarak tutacağız
        public string SifreHash { get; set; } = string.Empty; 
        
        // Kullanıcının yetkisini belirlemek için: "Yonetici" veya "Hemsire"
        public string Rol { get; set; } = string.Empty; 

        // İlk girişte şifre değiştirme takibi
        public bool SifreBelirlendi { get; set; } = false;
        
        // SMS / E-posta ile gönderilen geçici aktivasyon kodu
        public string? GeciciKod { get; set; }
        
        // Geçici kodun son geçerlilik tarihi
        public DateTime? GeciciKodSonTarih { get; set; }
    }
}