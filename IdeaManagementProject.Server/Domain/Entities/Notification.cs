namespace IdeaManagementProject.Server.Domain.Entities;

public class Notification
{
    public int NotificationId { get; set; }
    public int RecipientUserId { get; set; }
    public int? IdeaId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public string IdeaTitle { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public User RecipientUser { get; set; } = null!;
    public Idea? Idea { get; set; }
}
