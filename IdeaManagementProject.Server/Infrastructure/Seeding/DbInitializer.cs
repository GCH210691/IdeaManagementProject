using System.Data;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using IdeaManagementProject.Server.Application.Services;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Infrastructure.Seeding;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        await BaselineExistingSchemaAsync(dbContext);
        await dbContext.Database.MigrateAsync();

        await SeedRolesAsync(dbContext);
        await SeedDepartmentsAsync(dbContext);
        await SeedAdminAsync(dbContext, passwordHasher);
    }

    private static async Task BaselineExistingSchemaAsync(AppDbContext dbContext)
    {
        if (await TableExistsAsync(dbContext, "__EFMigrationsHistory"))
        {
            return;
        }

        var baselineMigrations = await GetBaselineMigrationIdsAsync(dbContext);
        if (baselineMigrations.Count == 0)
        {
            return;
        }

        var historyRepository = dbContext.GetService<IHistoryRepository>();
        var connection = dbContext.Database.GetDbConnection();
        var shouldCloseConnection = connection.State != ConnectionState.Open;

        if (shouldCloseConnection)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using (var createCommand = connection.CreateCommand())
            {
                createCommand.CommandText = historyRepository.GetCreateIfNotExistsScript();
                await createCommand.ExecuteNonQueryAsync();
            }

            var productVersion = typeof(DbContext).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
                .InformationalVersion
                ?.Split('+')[0]
                ?? "9.0.0";

            foreach (var migrationId in baselineMigrations)
            {
                await using var insertCommand = connection.CreateCommand();
                insertCommand.CommandText = historyRepository.GetInsertScript(
                    new HistoryRow(migrationId, productVersion));
                await insertCommand.ExecuteNonQueryAsync();
            }
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static async Task<List<string>> GetBaselineMigrationIdsAsync(AppDbContext dbContext)
    {
        var migrationChecks = new[]
        {
            new
            {
                MigrationId = "20260225025512_InitialMySql",
                RequiredTables = new[] { "Role", "Department", "User" }
            },
            new
            {
                MigrationId = "20260301162221_AddIdeas",
                RequiredTables = new[] { "Idea" }
            },
            new
            {
                MigrationId = "20260315174923_AddCategories",
                RequiredTables = new[] { "Category", "IdeaCategory" }
            }
        };

        var baselineMigrations = new List<string>();

        foreach (var migration in migrationChecks)
        {
            var hasAllTables = true;

            foreach (var tableName in migration.RequiredTables)
            {
                if (!await TableExistsAsync(dbContext, tableName))
                {
                    hasAllTables = false;
                    break;
                }
            }

            if (!hasAllTables)
            {
                break;
            }

            baselineMigrations.Add(migration.MigrationId);
        }

        if (baselineMigrations.Count > 0)
        {
            Console.WriteLine(
                "Detected existing application schema without EF migration history. " +
                $"Baselining migrations: {string.Join(", ", baselineMigrations)}");
        }

        return baselineMigrations;
    }

    private static async Task<bool> TableExistsAsync(AppDbContext dbContext, string tableName)
    {
        var connection = dbContext.Database.GetDbConnection();
        var shouldCloseConnection = connection.State != ConnectionState.Open;

        if (shouldCloseConnection)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_name = @tableName
                """;

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@tableName";
            parameter.Value = tableName;
            command.Parameters.Add(parameter);

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }
        finally
        {
            if (shouldCloseConnection)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static async Task SeedRolesAsync(AppDbContext dbContext)
    {
        if (await dbContext.Roles.AnyAsync())
        {
            return;
        }

        var roles = new[]
        {
            new Role { RoleName = "STAFF" },
            new Role { RoleName = "QA_COORDINATOR" },
            new Role { RoleName = "QA_MANAGER" },
            new Role { RoleName = "ADMIN" }
        };

        dbContext.Roles.AddRange(roles);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedDepartmentsAsync(AppDbContext dbContext)
    {
        if (await dbContext.Departments.AnyAsync())
        {
            return;
        }

        var departments = new[]
        {
            new Department { Name = "Administration" },
            new Department { Name = "Computer Science" }
        };

        dbContext.Departments.AddRange(departments);
        await dbContext.SaveChangesAsync();
    }

    private static async Task SeedAdminAsync(AppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        const string adminEmail = "admin@university.com";
        const string adminPassword = "Admin@123";

        var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == adminEmail);
        var adminRoleId = await dbContext.Roles
            .Where(x => x.RoleName == "ADMIN")
            .Select(x => x.RoleId)
            .SingleAsync();

        var administrationDepartmentId = await dbContext.Departments
            .Where(x => x.Name == "Administration")
            .Select(x => x.DepartmentId)
            .SingleAsync();

        if (existingAdmin is null)
        {
            dbContext.Users.Add(new User
            {
                Name = "System Admin",
                Email = adminEmail,
                PasswordHash = passwordHasher.HashPassword(adminPassword),
                RoleId = adminRoleId,
                DepartmentId = administrationDepartmentId,
                AcceptedTermsAt = DateTime.UtcNow
            });

            await dbContext.SaveChangesAsync();
            return;
        }

        var changed = false;

        if (existingAdmin.RoleId != adminRoleId)
        {
            existingAdmin.RoleId = adminRoleId;
            changed = true;
        }

        if (existingAdmin.DepartmentId != administrationDepartmentId)
        {
            existingAdmin.DepartmentId = administrationDepartmentId;
            changed = true;
        }

        if (!passwordHasher.VerifyPassword(adminPassword, existingAdmin.PasswordHash))
        {
            existingAdmin.PasswordHash = passwordHasher.HashPassword(adminPassword);
            changed = true;
        }

        if (changed)
        {
            await dbContext.SaveChangesAsync();
        }
    }
}
