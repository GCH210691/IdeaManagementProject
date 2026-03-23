namespace IdeaManagementProject.Server.Domain.Entities;

public class Comment
{
    public int CommentId { get; set; }
    public int IdeaId { get; set; }
    public int AuthorUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Idea Idea { get; set; } = null!;
    public User AuthorUser { get; set; } = null!;
}
