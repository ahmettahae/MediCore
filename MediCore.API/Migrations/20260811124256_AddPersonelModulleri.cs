using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonelModulleri : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Duyurular",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Baslik = table.Column<string>(type: "TEXT", nullable: false),
                    Icerik = table.Column<string>(type: "TEXT", nullable: false),
                    Yazar = table.Column<string>(type: "TEXT", nullable: false),
                    Tarih = table.Column<DateTime>(type: "TEXT", nullable: false),
                    OnemliMi = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Duyurular", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Gorevler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Baslik = table.Column<string>(type: "TEXT", nullable: false),
                    Detay = table.Column<string>(type: "TEXT", nullable: false),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    PersonelAdSoyad = table.Column<string>(type: "TEXT", nullable: false),
                    Oncelik = table.Column<string>(type: "TEXT", nullable: false),
                    OlusturmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Gorevler", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Personeller",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AdSoyad = table.Column<string>(type: "TEXT", nullable: false),
                    Unvan = table.Column<string>(type: "TEXT", nullable: false),
                    Cinsiyet = table.Column<string>(type: "TEXT", nullable: false),
                    Telefon = table.Column<string>(type: "TEXT", nullable: false),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    Vardiya = table.Column<string>(type: "TEXT", nullable: false),
                    ToplamNot = table.Column<int>(type: "INTEGER", nullable: false),
                    SonNobetTarihi = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personeller", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VardiyaRaporlari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Tarih = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TeslimEden = table.Column<string>(type: "TEXT", nullable: false),
                    TeslimAlan = table.Column<string>(type: "TEXT", nullable: false),
                    GenelDurum = table.Column<string>(type: "TEXT", nullable: false),
                    Notlar = table.Column<string>(type: "TEXT", nullable: false),
                    Eksiklikler = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VardiyaRaporlari", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Duyurular");

            migrationBuilder.DropTable(
                name: "Gorevler");

            migrationBuilder.DropTable(
                name: "Personeller");

            migrationBuilder.DropTable(
                name: "VardiyaRaporlari");
        }
    }
}
