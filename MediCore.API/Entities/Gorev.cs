namespace MediCore.API.Entities
{
    public class Gorev
    {
        public int Id { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Detay { get; set; } = string.Empty;
        public string Durum { get; set; } = "yapilacak"; // yapilacak, devam, tamamlandi
        public string PersonelAdSoyad { get; set; } = string.Empty;
        public string Oncelik { get; set; } = "Normal"; // Düşük, Normal, Yüksek, Kritik
        public DateTime OlusturmaTarihi { get; set; } = DateTime.Now;
    }
}
