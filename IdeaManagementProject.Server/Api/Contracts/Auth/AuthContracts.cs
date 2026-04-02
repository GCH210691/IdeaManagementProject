namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record LoginRequest(string? Email, string? Password);

public sealed record RegisterRequest(
    string? Name,
    string? Email,
    string? Password,
    int? DepartmentId,
    string? Role,
    bool AcceptedTerms);

public sealed record AuthUserDto(
    int Id,
    string Name,
    string Email,
    string Role,
    int DepartmentId,
    DateTime? AcceptedTermsAt);

public sealed record LoginResponse(string Token, AuthUserDto User);

public sealed record MeResponse(AuthUserDto User);

public sealed record RegisterOptionsResponse(
    IReadOnlyList<RoleOptionDto> Roles,
    IReadOnlyList<DepartmentOptionDto> Departments);

public sealed record RoleOptionDto(string RoleName);

public sealed record DepartmentOptionDto(int DepartmentId, string Name);
