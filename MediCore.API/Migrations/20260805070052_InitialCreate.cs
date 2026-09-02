using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Hastalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HastaNo = table.Column<string>(type: "TEXT", nullable: false),
                    TcKimlikNo = table.Column<string>(type: "TEXT", nullable: false),
                    Ad = table.Column<string>(type: "TEXT", nullable: false),
                    Soyad = table.Column<string>(type: "TEXT", nullable: false),
                    DogumTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Cinsiyet = table.Column<string>(type: "TEXT", nullable: false),
                    Telefon = table.Column<string>(type: "TEXT", nullable: false),
                    HastaYakiniAd = table.Column<string>(type: "TEXT", nullable: false),
                    HastaYakiniTelefon = table.Column<string>(type: "TEXT", nullable: false),
                    OdaNo = table.Column<string>(type: "TEXT", nullable: false),
                    YatakNo = table.Column<string>(type: "TEXT", nullable: false),
                    Hastalik = table.Column<string>(type: "TEXT", nullable: false),
                    AlerjiBilgisi = table.Column<string>(type: "TEXT", nullable: false),
                    GirisTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CikisTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Durum = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hastalar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Ilaclar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Barkod = table.Column<string>(type: "TEXT", nullable: false),
                    Ad = table.Column<string>(type: "TEXT", nullable: false),
                    EtkenMadde = table.Column<string>(type: "TEXT", nullable: false),
                    Form = table.Column<string>(type: "TEXT", nullable: false),
                    UreticiFirma = table.Column<string>(type: "TEXT", nullable: false),
                    KritikStokSeviyesi = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ilaclar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Kullanicilar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TcKimlikNo = table.Column<string>(type: "TEXT", nullable: false),
                    Ad = table.Column<string>(type: "TEXT", nullable: false),
                    Soyad = table.Column<string>(type: "TEXT", nullable: false),
                    EPosta = table.Column<string>(type: "TEXT", nullable: false),
                    SifreHash = table.Column<string>(type: "TEXT", nullable: false),
                    Rol = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kullanicilar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HastaIlaclari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HastaId = table.Column<int>(type: "INTEGER", nullable: false),
                    IlacId = table.Column<int>(type: "INTEGER", nullable: false),
                    Dozaj = table.Column<string>(type: "TEXT", nullable: false),
                    KullanimSikligi = table.Column<string>(type: "TEXT", nullable: false),
                    KullanimSekli = table.Column<string>(type: "TEXT", nullable: false),
                    BaslangicTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    BitisTarihi = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HastaIlaclari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HastaIlaclari_Hastalar_HastaId",
                        column: x => x.HastaId,
                        principalTable: "Hastalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HastaIlaclari_Ilaclar_IlacId",
                        column: x => x.IlacId,
                        principalTable: "Ilaclar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IlacStoklari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    IlacId = table.Column<int>(type: "INTEGER", nullable: false),
                    PartiNo = table.Column<string>(type: "TEXT", nullable: false),
                    Adet = table.Column<int>(type: "INTEGER", nullable: false),
                    SonKullanmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GirisTarihi = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IlacStoklari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IlacStoklari_Ilaclar_IlacId",
                        column: x => x.IlacId,
                        principalTable: "Ilaclar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HastaIlaclari_HastaId",
                table: "HastaIlaclari",
                column: "HastaId");

            migrationBuilder.CreateIndex(
                name: "IX_HastaIlaclari_IlacId",
                table: "HastaIlaclari",
                column: "IlacId");

            migrationBuilder.CreateIndex(
                name: "IX_IlacStoklari_IlacId",
                table: "IlacStoklari",
                column: "IlacId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HastaIlaclari");

            migrationBuilder.DropTable(
                name: "IlacStoklari");

            migrationBuilder.DropTable(
                name: "Kullanicilar");

            migrationBuilder.DropTable(
                name: "Hastalar");

            migrationBuilder.DropTable(
                name: "Ilaclar");
        }
    }
}
