using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Application.Services;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "ADMIN")]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;

    public AdminUsersController(AppDbContext dbContext, IPasswordHasher passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var users = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Include(x => x.Department)
            .OrderBy(x => x.UserId)
            .Select(x => new AdminUserDto(
                x.UserId,
                x.Name,
                x.Email,
                x.Role.RoleName,
                x.DepartmentId,
                x.Department.Name,
                x.AcceptedTermsAt))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(CancellationToken cancellationToken)
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .OrderBy(x => x.RoleName)
            .Select(x => new AdminRoleOptionDto(x.RoleName))
            .ToListAsync(cancellationToken);

        var departments = await _dbContext.Departments
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new AdminDepartmentOptionDto(x.DepartmentId, x.Name))
            .ToListAsync(cancellationToken);

        return Ok(new AdminUserOptionsResponse(roles, departments));
    }

    [HttpPut("{userId:int}")]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateAdminUserRequest? request, CancellationToken cancellationToken)
    {
        if (request is null ||
            string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Role) ||
            request.DepartmentId is null ||
            request.DepartmentId <= 0)
        {
            return BadRequest(new { message = "Name, email, role, and department are required." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedRole = request.Role.Trim().ToUpperInvariant();

        var emailExists = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(x => x.UserId != userId && x.Email == normalizedEmail, cancellationToken);

        if (emailExists)
        {
            return Conflict(new { message = "Email is already used by another account." });
        }

        var role = await _dbContext.Roles
            .FirstOrDefaultAsync(x => x.RoleName == normalizedRole, cancellationToken);

        if (role is null)
        {
            return BadRequest(new { message = "Invalid role." });
        }

        var department = await _dbContext.Departments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.DepartmentId == request.DepartmentId.Value, cancellationToken);

        if (department is null)
        {
            return BadRequest(new { message = "Invalid department." });
        }

        var user = await _dbContext.Users
            .Include(x => x.Role)
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.Name = request.Name.Trim();
        user.Email = normalizedEmail;
        user.RoleId = role.RoleId;
        user.DepartmentId = department.DepartmentId;
        user.AcceptedTermsAt = request.AcceptedTermsAt;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(request.Password.Trim());
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = new AdminUserDto(
            user.UserId,
            user.Name,
            user.Email,
            role.RoleName,
            department.DepartmentId,
            department.Name,
            user.AcceptedTermsAt);

        return Ok(response);
    }
}
