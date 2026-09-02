namespace MediCore.API.Entities
{
    public class Ilac
    {
        public int Id { get; set; }
        
        // Gelecekteki barkod/QR entegrasyonu için şimdiden hazır
        public string Barkod { get; set; } = string.Empty; 
        
        public string Ad { get; set; } = string.Empty;
        public string EtkenMadde { get; set; } = string.Empty;
        public string Form { get; set; } = string.Empty;
        public string UreticiFirma { get; set; } = string.Empty;
        public int KritikStokSeviyesi { get; set; } = 10;
    }
}