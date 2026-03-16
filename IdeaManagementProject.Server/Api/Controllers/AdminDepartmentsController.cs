using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/admin/departments")]
[Authorize(Roles = "ADMIN")]
public class AdminDepartmentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminDepartmentsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken)
    {
        var departments = await _dbContext.Departments
            .AsNoTracking()
            .Include(x => x.QaCoordinatorUser)
            .OrderBy(x => x.DepartmentId)
            .Select(x => new AdminDepartmentDto(
                x.DepartmentId,
                x.Name,
                x.QaCoordinatorUserId,
                x.QaCoordinatorUser != null ? x.QaCoordinatorUser.Name : null))
            .ToListAsync(cancellationToken);

        return Ok(departments);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateAdminDepartmentRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Department name is required." });
        }

        var qaCoordinator = await ResolveQaCoordinatorAsync(request.QaCoordinatorUserId, cancellationToken);
        if (request.QaCoordinatorUserId is not null && qaCoordinator is null)
        {
            return BadRequest(new { message = "Invalid QA coordinator user." });
        }

        var department = new Department
        {
            Name = request.Name.Trim(),
            QaCoordinatorUserId = request.QaCoordinatorUserId
        };

        _dbContext.Departments.Add(department);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = new AdminDepartmentDto(
            department.DepartmentId,
            department.Name,
            department.QaCoordinatorUserId,
            qaCoordinator?.Name);

        return StatusCode(201, response);
    }

    [HttpPut("{departmentId:int}")]
    public async Task<IActionResult> UpdateDepartment(int departmentId, [FromBody] UpdateAdminDepartmentRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Department name is required." });
        }

        var department = await _dbContext.Departments
            .Include(x => x.QaCoordinatorUser)
            .FirstOrDefaultAsync(x => x.DepartmentId == departmentId, cancellationToken);

        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var qaCoordinator = await ResolveQaCoordinatorAsync(request.QaCoordinatorUserId, cancellationToken);
        if (request.QaCoordinatorUserId is not null && qaCoordinator is null)
        {
            return BadRequest(new { message = "Invalid QA coordinator user." });
        }

        department.Name = request.Name.Trim();
        department.QaCoordinatorUserId = request.QaCoordinatorUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = new AdminDepartmentDto(
            department.DepartmentId,
            department.Name,
            department.QaCoordinatorUserId,
            qaCoordinator?.Name);

        return Ok(response);
    }

    [HttpDelete("{departmentId:int}")]
    public async Task<IActionResult> DeleteDepartment(int departmentId, CancellationToken cancellationToken)
    {
        var department = await _dbContext.Departments
            .FirstOrDefaultAsync(x => x.DepartmentId == departmentId, cancellationToken);

        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var usedByUsers = await _dbContext.Users
            .AsNoTracking()
            .AnyAsync(x => x.DepartmentId == departmentId, cancellationToken);

        var usedByIdeas = await _dbContext.Ideas
            .AsNoTracking()
            .AnyAsync(x => x.DepartmentId == departmentId, cancellationToken);

        if (usedByUsers || usedByIdeas)
        {
            return Conflict(new { message = "Department is in use and cannot be deleted." });
        }

        _dbContext.Departments.Remove(department);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<User?> ResolveQaCoordinatorAsync(int? userId, CancellationToken cancellationToken)
    {
        if (userId is null)
        {
            return null;
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.UserId == userId.Value, cancellationToken);

        if (user is null)
        {
            return null;
        }

        return user.Role.RoleName == "QA_COORDINATOR" ? user : null;
    }
}
