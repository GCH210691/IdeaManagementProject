namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record AdminUserDto(
    int Id,
    string Name,
    string Email,
    string Role,
    int DepartmentId,
    string DepartmentName,
    DateTime? AcceptedTermsAt);

public sealed record UpdateAdminUserRequest(
    string? Name,
    string? Email,
    string? Role,
    int? DepartmentId,
    DateTime? AcceptedTermsAt,
    string? Password);

public sealed record AdminUserOptionsResponse(
    IReadOnlyList<AdminRoleOptionDto> Roles,
    IReadOnlyList<AdminDepartmentOptionDto> Departments);

public sealed record AdminRoleOptionDto(string RoleName);

public sealed record AdminDepartmentOptionDto(int DepartmentId, string Name);
