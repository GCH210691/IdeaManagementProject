namespace IdeaManagementProject.Server.Application.Services;

public interface IAuthService
{
    Task<AuthResult?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<UserProfile?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<RegistrationOptions> GetRegistrationOptionsAsync(CancellationToken cancellationToken = default);
    Task<RegisterResult> RegisterAsync(RegisterInput input, CancellationToken cancellationToken = default);
}

public sealed record AuthResult(string Token, UserProfile User);

public sealed record UserProfile(
    int Id,
    string Name,
    string Email,
    string Role,
    int DepartmentId,
    DateTime? AcceptedTermsAt);

public sealed record RegisterInput(
    string Name,
    string Email,
    string Password,
    int DepartmentId,
    string RoleName,
    bool AcceptedTerms);

public enum RegisterFailureReason
{
    None = 0,
    EmailExists = 1,
    DepartmentNotFound = 2,
    RoleNotFound = 3
}

public sealed record RegisterResult(RegisterFailureReason FailureReason, AuthResult? Auth);

public sealed record RegistrationOptions(
    IReadOnlyList<RoleOption> Roles,
    IReadOnlyList<DepartmentOption> Departments);

public sealed record RoleOption(string RoleName);

public sealed record DepartmentOption(int DepartmentId, string Name);
