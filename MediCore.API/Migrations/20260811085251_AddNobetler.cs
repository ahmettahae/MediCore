using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNobetler : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Randevular");

            migrationBuilder.DeleteData(
                table: "Kullanicilar",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Kullanicilar",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.AlterColumn<DateTime>(
                name: "GoreveBaslamaTarihi",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "HastahaneSevkleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HastaId = table.Column<int>(type: "INTEGER", nullable: false),
                    SevkTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SevkEdilenHastane = table.Column<string>(type: "TEXT", nullable: false),
                    SevkNedeni = table.Column<string>(type: "TEXT", nullable: false),
                    SevkTipi = table.Column<string>(type: "TEXT", nullable: false),
                    DoktorNotu = table.Column<string>(type: "TEXT", nullable: false),
                    SevkEdenKullaniciId = table.Column<int>(type: "INTEGER", nullable: true),
                    SevkEdenAd = table.Column<string>(type: "TEXT", nullable: false),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    GeriDonusTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    GeriDonusNotu = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HastahaneSevkleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HastahaneSevkleri_Hastalar_HastaId",
                        column: x => x.HastaId,
                        principalTable: "Hastalar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Nobetler",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HemsireAd = table.Column<string>(type: "TEXT", nullable: false),
                    HemsireSoyad = table.Column<string>(type: "TEXT", nullable: false),
                    VardiyaTuru = table.Column<string>(type: "TEXT", nullable: false),
                    BaslangicSaati = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    BitisSaati = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    NobetTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TeslimNotu = table.Column<string>(type: "TEXT", nullable: true),
                    Aktif = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nobetler", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HastahaneSevkleri_HastaId",
                table: "HastahaneSevkleri",
                column: "HastaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HastahaneSevkleri");

            migrationBuilder.DropTable(
                name: "Nobetler");

            migrationBuilder.AlterColumn<DateTime>(
                name: "GoreveBaslamaTarihi",
                table: "Doktorlar",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "TEXT");

            migrationBuilder.CreateTable(
                name: "Randevular",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DoktorId = table.Column<int>(type: "INTEGER", nullable: false),
                    HastaId = table.Column<int>(type: "INTEGER", nullable: false),
                    Durum = table.Column<string>(type: "TEXT", nullable: false),
                    Notlar = table.Column<string>(type: "TEXT", nullable: false),
                    RandevuTarihi = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Randevular", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Randevular_Doktorlar_DoktorId",
                        column: x => x.DoktorId,
                        principalTable: "Doktorlar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Randevular_Hastalar_HastaId",
                        column: x => x.HastaId,
                        principalTable: "Hastalar",
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
                name: "IX_Randevular_DoktorId",
                table: "Randevular",
                column: "DoktorId");

            migrationBuilder.CreateIndex(
                name: "IX_Randevular_HastaId",
                table: "Randevular",
                column: "HastaId");
        }
    }
}
