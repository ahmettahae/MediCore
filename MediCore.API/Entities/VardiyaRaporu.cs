namespace MediCore.API.Entities
{
    public class VardiyaRaporu
    {
        public int Id { get; set; }
        public DateTime Tarih { get; set; } = DateTime.Now;
        public string TeslimEden { get; set; } = string.Empty;
        public string TeslimAlan { get; set; } = string.Empty;
        public string GenelDurum { get; set; } = string.Empty;
        public string Notlar { get; set; } = string.Empty;
        public string Eksiklikler { get; set; } = string.Empty;
    }
}
