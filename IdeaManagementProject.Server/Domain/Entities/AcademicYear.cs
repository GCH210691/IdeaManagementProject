namespace IdeaManagementProject.Server.Domain.Entities;

public class AcademicYear
{
    public int AcademicYearId { get; set; }
    public string YearName { get; set; } = string.Empty;

    public ICollection<ClosurePeriod> ClosurePeriods { get; set; } = new List<ClosurePeriod>();
}
