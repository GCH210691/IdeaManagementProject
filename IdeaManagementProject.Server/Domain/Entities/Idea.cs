namespace IdeaManagementProject.Server.Domain.Entities;

public class Idea
{
    public int IdeaId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int AuthorUserId { get; set; }
    public int DepartmentId { get; set; }
    public int ClosurePeriodId { get; set; }
    public bool IsAnonymous { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }

    public User AuthorUser { get; set; } = null!;
    public Department Department { get; set; } = null!;
    public ClosurePeriod ClosurePeriod { get; set; } = null!;
    public ICollection<IdeaCategory> IdeaCategories { get; set; } = new List<IdeaCategory>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
