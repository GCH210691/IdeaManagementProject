namespace IdeaManagementProject.Server.Domain.Entities;

public class Category
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<IdeaCategory> IdeaCategories { get; set; } = new List<IdeaCategory>();
}
