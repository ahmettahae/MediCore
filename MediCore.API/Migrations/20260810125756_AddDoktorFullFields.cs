using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDoktorFullFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CalistigiBirim",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Cinsiyet",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DogumTarihi",
                table: "Doktorlar",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Durum",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EPosta",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "GoreveBaslamaTarihi",
                table: "Doktorlar",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KullaniciAdi",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SicilNo",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Sifre",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TcKimlikNo",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Telefon",
                table: "Doktorlar",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CalistigiBirim",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "Cinsiyet",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "DogumTarihi",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "Durum",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "EPosta",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "GoreveBaslamaTarihi",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "KullaniciAdi",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "SicilNo",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "Sifre",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "TcKimlikNo",
                table: "Doktorlar");

            migrationBuilder.DropColumn(
                name: "Telefon",
                table: "Doktorlar");
        }
    }
}
