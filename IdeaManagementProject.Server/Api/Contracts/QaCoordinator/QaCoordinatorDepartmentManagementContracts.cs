namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record QaCoordinatorDepartmentManagementResponse(
    int DepartmentId,
    string DepartmentName,
    IReadOnlyList<QaCoordinatorDepartmentStaffDto> DepartmentStaff,
    IReadOnlyList<QaCoordinatorDepartmentStaffDto> AvailableStaff);

public sealed record QaCoordinatorDepartmentStaffDto(
    int Id,
    string Name,
    string Email,
    int DepartmentId,
    string DepartmentName);

public sealed record UpdateQaCoordinatorDepartmentStaffRequest(
    int? DepartmentId);
