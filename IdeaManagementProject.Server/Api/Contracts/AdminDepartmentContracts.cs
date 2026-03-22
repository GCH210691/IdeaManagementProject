namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record AdminDepartmentDto(
    int DepartmentId,
    string Name,
    IReadOnlyList<AdminDepartmentCoordinatorDto> QaCoordinators);

public sealed record AdminDepartmentCoordinatorDto(
    int UserId,
    string Name,
    string Email);

public sealed record CreateAdminDepartmentRequest(
    string? Name,
    IReadOnlyList<int>? QaCoordinatorUserIds);

public sealed record UpdateAdminDepartmentRequest(
    string? Name,
    IReadOnlyList<int>? QaCoordinatorUserIds);
