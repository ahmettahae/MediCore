using Microsoft.EntityFrameworkCore;
using MediCore.API.Entities;

namespace MediCore.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Tablolar
        public DbSet<Hasta> Hastalar { get; set; }
        public DbSet<Doktor> Doktorlar { get; set; }
        public DbSet<Kullanici> Kullanicilar { get; set; }
        public DbSet<Ilac> Ilaclar { get; set; }
        public DbSet<IlacStok> IlacStoklari { get; set; }
        public DbSet<HastaIlac> HastaIlaclari { get; set; }
        public DbSet<HemsireNotu> HemsireNotlari { get; set; }
        public DbSet<VitalBulgu> VitalBulgular { get; set; }
        public DbSet<HastahaneSevk> HastahaneSevkleri { get; set; }
        public DbSet<Nobet> Nobetler { get; set; }
        
        // Yeni Personel ve Nöbet/Görev Yönetimi Modülleri
        public DbSet<Personel> Personeller { get; set; }
        public DbSet<Gorev> Gorevler { get; set; }
        public DbSet<VardiyaRaporu> VardiyaRaporlari { get; set; }
        public DbSet<Duyuru> Duyurular { get; set; }
        
        // Klinik & Operasyon Modülleri (Hemşire MAR & Kurum Hekimi Vizite)
        public DbSet<IlacUygulama> IlacUygulamalari { get; set; }
        public DbSet<HekimMuayene> HekimMuayeneleri { get; set; }
        public DbSet<AktiviteLog> AktiviteLoglari { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}