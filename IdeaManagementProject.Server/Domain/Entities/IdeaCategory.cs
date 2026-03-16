namespace IdeaManagementProject.Server.Domain.Entities;

public class IdeaCategory
{
    public int IdeaId { get; set; }
    public int CategoryId { get; set; }

    public Idea Idea { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
