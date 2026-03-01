namespace IdeaManagementProject.Server.Domain.Entities;

public class User
{
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public int RoleId { get; set; }
    public DateTime? AcceptedTermsAt { get; set; }

    public Department Department { get; set; } = null!;
    public Role Role { get; set; } = null!;
    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
}
