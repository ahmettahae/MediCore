namespace MediCore.API.Entities
{
    public class Duyuru
    {
        public int Id { get; set; }
        public string Baslik { get; set; } = string.Empty;
        public string Icerik { get; set; } = string.Empty;
        public string Yazar { get; set; } = string.Empty;
        public DateTime Tarih { get; set; } = DateTime.Now;
        public bool OnemliMi { get; set; } = false;
    }
}
