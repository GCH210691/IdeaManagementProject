using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Domain.Entities;

namespace IdeaManagementProject.Server.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Department> Departments => Set<Department>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Role");

            entity.HasKey(x => x.RoleId);
            entity.Property(x => x.RoleId).HasColumnName("role_id");

            entity.Property(x => x.RoleName)
                .HasColumnName("role_name")
                .HasMaxLength(64)
                .IsRequired();

            entity.HasIndex(x => x.RoleName).IsUnique();
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("Department");

            entity.HasKey(x => x.DepartmentId);
            entity.Property(x => x.DepartmentId).HasColumnName("department_id");

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.QaCoordinatorUserId)
                .HasColumnName("qa_coordinator_user_id");

            entity.HasOne(x => x.QaCoordinatorUser)
                .WithMany()
                .HasForeignKey(x => x.QaCoordinatorUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("User");

            entity.HasKey(x => x.UserId);
            entity.Property(x => x.UserId).HasColumnName("user_id");

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasColumnName("email")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(512)
                .IsRequired();

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id")
                .IsRequired();

            entity.Property(x => x.RoleId)
                .HasColumnName("role_id")
                .IsRequired();

            entity.Property(x => x.AcceptedTermsAt)
                .HasColumnName("accepted_terms_at");

            entity.HasIndex(x => x.Email).IsUnique();

            entity.HasOne(x => x.Department)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
