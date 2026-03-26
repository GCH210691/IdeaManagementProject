namespace IdeaManagementProject.Server.Domain.Entities;

public class Vote
{
    public int VoteId { get; set; }
    public int IdeaId { get; set; }
    public int UserId { get; set; }
    public int Value { get; set; }

    public Idea Idea { get; set; } = null!;
    public User User { get; set; } = null!;
}
