namespace IdeaManagementProject.Server.Domain.Entities;

public class Idea
{
    public int IdeaId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int AuthorUserId { get; set; }
    public int DepartmentId { get; set; }
    public bool IsAnonymous { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }

    public User AuthorUser { get; set; } = null!;
    public Department Department { get; set; } = null!;
}
