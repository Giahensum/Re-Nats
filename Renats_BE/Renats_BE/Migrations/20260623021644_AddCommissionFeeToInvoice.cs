using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Renats_BE.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionFeeToInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "commission_fee",
                table: "invoices",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "commission_fee",
                table: "invoices");
        }
    }
}
