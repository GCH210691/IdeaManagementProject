namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record AdminDepartmentDto(
    int DepartmentId,
    string Name,
    int? QaCoordinatorUserId,
    string? QaCoordinatorName);

public sealed record CreateAdminDepartmentRequest(
    string? Name,
    int? QaCoordinatorUserId);

public sealed record UpdateAdminDepartmentRequest(
    string? Name,
    int? QaCoordinatorUserId);
