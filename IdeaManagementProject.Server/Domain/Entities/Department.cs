namespace IdeaManagementProject.Server.Domain.Entities;

public class Department
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? QaCoordinatorUserId { get; set; }

    public User? QaCoordinatorUser { get; set; }
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Idea> Ideas { get; set; } = new List<Idea>();
}
