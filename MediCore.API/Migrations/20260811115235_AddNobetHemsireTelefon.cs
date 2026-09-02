using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediCore.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNobetHemsireTelefon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HemsireTelefon",
                table: "Nobetler",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HemsireTelefon",
                table: "Nobetler");
        }
    }
}
