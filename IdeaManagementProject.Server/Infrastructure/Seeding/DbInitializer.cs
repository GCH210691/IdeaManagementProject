using Microsoft.EntityFrameworkCore;
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

        await dbContext.Database.MigrateAsync();

        await SeedRolesAsync(dbContext);
        await SeedDepartmentsAsync(dbContext);
        await SeedAdminAsync(dbContext, passwordHasher);
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
