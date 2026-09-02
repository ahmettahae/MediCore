namespace MediCore.API.Entities
{
    public class Nobet
    {
        public int Id { get; set; }

        // Hemşire Bilgisi
        public string HemsireAd { get; set; } = string.Empty;
        public string HemsireSoyad { get; set; } = string.Empty;
        public string? HemsireTelefon { get; set; }

        // Vardiya Bilgisi: "Gunduz" | "Aksam" | "Gece"
        public string VardiyaTuru { get; set; } = string.Empty;

        // Vardiya Saatleri
        public TimeSpan BaslangicSaati { get; set; }
        public TimeSpan BitisSaati { get; set; }

        // Nöbet Tarihi
        public DateTime NobetTarihi { get; set; } = DateTime.Today;

        // Nöbet Teslim Notu / Uyarı
        public string? TeslimNotu { get; set; }

        // Aktif Mi?
        public bool Aktif { get; set; } = true;
    }
}
