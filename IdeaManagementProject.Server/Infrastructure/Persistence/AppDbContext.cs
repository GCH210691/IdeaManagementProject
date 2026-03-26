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
    public DbSet<Idea> Ideas => Set<Idea>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<IdeaCategory> IdeaCategories => Set<IdeaCategory>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Vote> Votes => Set<Vote>();

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

        modelBuilder.Entity<Idea>(entity =>
        {
            entity.ToTable("Idea");

            entity.HasKey(x => x.IdeaId);
            entity.Property(x => x.IdeaId).HasColumnName("idea_id");

            entity.Property(x => x.Title)
                .HasColumnName("title")
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(x => x.Content)
                .HasColumnName("content")
                .HasColumnType("longtext")
                .IsRequired();

            entity.Property(x => x.AuthorUserId)
                .HasColumnName("author_user_id")
                .IsRequired();

            entity.Property(x => x.DepartmentId)
                .HasColumnName("department_id")
                .IsRequired();

            entity.Property(x => x.IsAnonymous)
                .HasColumnName("is_anonymous")
                .IsRequired();

            entity.Property(x => x.ViewCount)
                .HasColumnName("view_count")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne(x => x.AuthorUser)
                .WithMany(x => x.Ideas)
                .HasForeignKey(x => x.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Department)
                .WithMany(x => x.Ideas)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comment");

            entity.HasKey(x => x.CommentId);
            entity.Property(x => x.CommentId).HasColumnName("comment_id");

            entity.Property(x => x.IdeaId)
                .HasColumnName("idea_id")
                .IsRequired();

            entity.Property(x => x.AuthorUserId)
                .HasColumnName("author_user_id")
                .IsRequired();

            entity.Property(x => x.Content)
                .HasColumnName("content")
                .HasColumnType("longtext")
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne(x => x.Idea)
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.IdeaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.AuthorUser)
                .WithMany(x => x.Comments)
                .HasForeignKey(x => x.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Vote>(entity =>
        {
            entity.ToTable("Vote");

            entity.HasKey(x => x.VoteId);
            entity.Property(x => x.VoteId).HasColumnName("vote_id");

            entity.Property(x => x.IdeaId)
                .HasColumnName("idea_id")
                .IsRequired();

            entity.Property(x => x.UserId)
                .HasColumnName("user_id")
                .IsRequired();

            entity.Property(x => x.Value)
                .HasColumnName("value")
                .IsRequired();

            entity.HasIndex(x => new { x.IdeaId, x.UserId }).IsUnique();

            entity.HasOne(x => x.Idea)
                .WithMany(x => x.Votes)
                .HasForeignKey(x => x.IdeaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Votes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Category");

            entity.HasKey(x => x.CategoryId);
            entity.Property(x => x.CategoryId).HasColumnName("category_id");

            entity.Property(x => x.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<IdeaCategory>(entity =>
        {
            entity.ToTable("IdeaCategory");

            entity.HasKey(x => new { x.IdeaId, x.CategoryId });

            entity.Property(x => x.IdeaId).HasColumnName("idea_id");
            entity.Property(x => x.CategoryId).HasColumnName("category_id");

            entity.HasOne(x => x.Idea)
                .WithMany(x => x.IdeaCategories)
                .HasForeignKey(x => x.IdeaId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.IdeaCategories)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
