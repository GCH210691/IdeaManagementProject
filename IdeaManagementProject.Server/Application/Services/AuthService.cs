using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResult?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .Include(x => x.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var validPassword = _passwordHasher.VerifyPassword(password, user.PasswordHash);
        if (!validPassword)
        {
            return null;
        }

        var token = _jwtTokenService.GenerateToken(user);
        return new AuthResult(token, ToUserProfile(user));
    }

    public async Task<UserProfile?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(x => x.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        return user is null ? null : ToUserProfile(user);
    }

    public async Task<RegistrationOptions> GetRegistrationOptionsAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .OrderBy(x => x.RoleName)
            .Select(x => new RoleOption(x.RoleName))
            .ToListAsync(cancellationToken);

        var departments = await _dbContext.Departments
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new DepartmentOption(x.DepartmentId, x.Name))
            .ToListAsync(cancellationToken);

        return new RegistrationOptions(roles, departments);
    }

    public async Task<RegisterResult> RegisterAsync(RegisterInput input, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = input.Email.Trim().ToLowerInvariant();
        var normalizedRoleName = input.RoleName.Trim().ToUpperInvariant();

        var emailExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return new RegisterResult(RegisterFailureReason.EmailExists, null);
        }

        var role = await _dbContext.Roles
            .FirstOrDefaultAsync(x => x.RoleName == normalizedRoleName, cancellationToken);

        if (role is null)
        {
            return new RegisterResult(RegisterFailureReason.RoleNotFound, null);
        }

        var department = await _dbContext.Departments
            .FirstOrDefaultAsync(x => x.DepartmentId == input.DepartmentId, cancellationToken);

        if (department is null)
        {
            return new RegisterResult(RegisterFailureReason.DepartmentNotFound, null);
        }

        var user = new User
        {
            Name = input.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(input.Password),
            DepartmentId = department.DepartmentId,
            RoleId = role.RoleId,
            Role = role,
            AcceptedTermsAt = input.AcceptedTerms ? DateTime.UtcNow : null
        };

        _dbContext.Users.Add(user);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return new RegisterResult(RegisterFailureReason.EmailExists, null);
        }

        var token = _jwtTokenService.GenerateToken(user);
        var authResult = new AuthResult(token, ToUserProfile(user));

        return new RegisterResult(RegisterFailureReason.None, authResult);
    }

    private static UserProfile ToUserProfile(User user)
    {
        return new UserProfile(
            user.UserId,
            user.Name,
            user.Email,
            user.Role.RoleName,
            user.DepartmentId,
            user.AcceptedTermsAt);
    }
}
//git push test
