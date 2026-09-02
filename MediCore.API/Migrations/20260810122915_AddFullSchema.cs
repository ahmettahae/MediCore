using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFullSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                    BitisTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UygulandiMi = table.Column<bool>(type: "INTEGER", nullable: false),
                    UygulanmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "HemsireNotlari",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HastaId = table.Column<int>(type: "INTEGER", nullable: false),
                    KullaniciId = table.Column<int>(type: "INTEGER", nullable: false),
                    Not = table.Column<string>(type: "TEXT", nullable: false),
                    Tarih = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HemsireNotlari", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HemsireNotlari_Hastalar_HastaId",
                        column: x => x.HastaId,
                        principalTable: "Hastalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HemsireNotlari_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VitalBulgular",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HastaId = table.Column<int>(type: "INTEGER", nullable: false),
                    KullaniciId = table.Column<int>(type: "INTEGER", nullable: false),
                    NabizBPM = table.Column<int>(type: "INTEGER", nullable: true),
                    TansiyonSistol = table.Column<int>(type: "INTEGER", nullable: true),
                    TansiyonDiyastol = table.Column<int>(type: "INTEGER", nullable: true),
                    AtesC = table.Column<decimal>(type: "TEXT", nullable: true),
                    SoluSayisi = table.Column<int>(type: "INTEGER", nullable: true),
                    SaturasyonYuzdesi = table.Column<int>(type: "INTEGER", nullable: true),
                    Tarih = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VitalBulgular", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VitalBulgular_Hastalar_HastaId",
                        column: x => x.HastaId,
                        principalTable: "Hastalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VitalBulgular_Kullanicilar_KullaniciId",
                        column: x => x.KullaniciId,
                        principalTable: "Kullanicilar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Kullanicilar",
                columns: new[] { "Id", "Ad", "EPosta", "Rol", "SifreHash", "Soyad", "TcKimlikNo" },
                values: new object[,]
                {
                    { 1, "Ahmet", "yonetici@medicore.com", "Yonetici", "$2a$11$hhsH2tzcnPpnTAJmJnitQOl8WmTnb8cpMnfictcF1VLdkObbJerKy", "Yönetici", "11111111111" },
                    { 2, "Ayşe", "hemsire@medicore.com", "Hemsire", "$2a$11$hhsH2tzcnPpnTAJmJnitQOl8WmTnb8cpMnfictcF1VLdkObbJerKy", "Hemşire", "22222222222" }
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
                name: "IX_HemsireNotlari_HastaId",
                table: "HemsireNotlari",
                column: "HastaId");

            migrationBuilder.CreateIndex(
                name: "IX_HemsireNotlari_KullaniciId",
                table: "HemsireNotlari",
                column: "KullaniciId");

            migrationBuilder.CreateIndex(
                name: "IX_IlacStoklari_IlacId",
                table: "IlacStoklari",
                column: "IlacId");

            migrationBuilder.CreateIndex(
                name: "IX_VitalBulgular_HastaId",
                table: "VitalBulgular",
                column: "HastaId");

            migrationBuilder.CreateIndex(
                name: "IX_VitalBulgular_KullaniciId",
                table: "VitalBulgular",
                column: "KullaniciId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HastaIlaclari");

            migrationBuilder.DropTable(
                name: "HemsireNotlari");

            migrationBuilder.DropTable(
                name: "IlacStoklari");

            migrationBuilder.DropTable(
                name: "VitalBulgular");

            migrationBuilder.DropTable(
                name: "Ilaclar");

            migrationBuilder.DropTable(
                name: "Kullanicilar");
        }
    }
}
