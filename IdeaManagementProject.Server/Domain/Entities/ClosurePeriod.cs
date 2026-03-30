namespace IdeaManagementProject.Server.Domain.Entities;

public class ClosurePeriod
{
    public int ClosurePeriodId { get; set; }
    public int AcademicYearId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime IdeaStartAt { get; set; }
    public DateTime IdeaEndAt { get; set; }
    public DateTime CommentEndAt { get; set; }

    public AcademicYear AcademicYear { get; set; } = null!;
    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
}
