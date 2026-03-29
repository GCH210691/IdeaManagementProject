using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdeaManagementProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAcademicYearsAndClosurePeriods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AcademicYear",
                columns: table => new
                {
                    academic_year_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    year_name = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcademicYear", x => x.academic_year_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ClosurePeriod",
                columns: table => new
                {
                    closure_period_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    academic_year_id = table.Column<int>(type: "int", nullable: false),
                    title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    idea_start_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    idea_end_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    comment_end_at = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClosurePeriod", x => x.closure_period_id);
                    table.ForeignKey(
                        name: "FK_ClosurePeriod_AcademicYear_academic_year_id",
                        column: x => x.academic_year_id,
                        principalTable: "AcademicYear",
                        principalColumn: "academic_year_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "closure_period_id",
                table: "Idea",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                INSERT INTO `AcademicYear` (`year_name`)
                SELECT 'Legacy imported data'
                FROM DUAL
                WHERE EXISTS (SELECT 1 FROM `Idea`)
                  AND NOT EXISTS (SELECT 1 FROM `AcademicYear` WHERE `year_name` = 'Legacy imported data');
                """);

            migrationBuilder.Sql("""
                INSERT INTO `ClosurePeriod` (`academic_year_id`, `title`, `idea_start_at`, `idea_end_at`, `comment_end_at`)
                SELECT ay.`academic_year_id`, 'Legacy imported ideas', '2000-01-01 00:00:00', '2000-01-01 00:00:01', '9999-12-31 23:59:59.999999'
                FROM `AcademicYear` ay
                WHERE ay.`year_name` = 'Legacy imported data'
                  AND EXISTS (SELECT 1 FROM `Idea`)
                  AND NOT EXISTS (SELECT 1 FROM `ClosurePeriod` WHERE `title` = 'Legacy imported ideas');
                """);

            migrationBuilder.Sql("""
                UPDATE `Idea`
                SET `closure_period_id` = (
                    SELECT cp.`closure_period_id`
                    FROM `ClosurePeriod` cp
                    WHERE cp.`title` = 'Legacy imported ideas'
                    ORDER BY cp.`closure_period_id`
                    LIMIT 1)
                WHERE `closure_period_id` IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "closure_period_id",
                table: "Idea",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Idea_closure_period_id",
                table: "Idea",
                column: "closure_period_id");

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYear_year_name",
                table: "AcademicYear",
                column: "year_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClosurePeriod_academic_year_id",
                table: "ClosurePeriod",
                column: "academic_year_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Idea_ClosurePeriod_closure_period_id",
                table: "Idea",
                column: "closure_period_id",
                principalTable: "ClosurePeriod",
                principalColumn: "closure_period_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Idea_ClosurePeriod_closure_period_id",
                table: "Idea");

            migrationBuilder.DropTable(
                name: "ClosurePeriod");

            migrationBuilder.DropTable(
                name: "AcademicYear");

            migrationBuilder.DropIndex(
                name: "IX_Idea_closure_period_id",
                table: "Idea");

            migrationBuilder.DropColumn(
                name: "closure_period_id",
                table: "Idea");
        }
    }
}
