namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record QaCoordinatorNotificationDto(
    int NotificationId,
    int? IdeaId,
    string StaffName,
    string IdeaTitle,
    string DepartmentName,
    string Message,
    DateTime CreatedAt,
    bool CanViewIdea);
