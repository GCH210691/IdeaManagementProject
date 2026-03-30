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
            .OrderBy(x => x.DepartmentId)
            .ToListAsync(cancellationToken);

        var qaCoordinators = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Where(x => x.Role.RoleName == "QA_COORDINATOR")
            .OrderBy(x => x.Name)
            .ThenBy(x => x.UserId)
            .ToListAsync(cancellationToken);

        var coordinatorByDepartmentId = qaCoordinators
            .GroupBy(x => x.DepartmentId)
            .ToDictionary(
                x => x.Key,
                x => (IReadOnlyList<AdminDepartmentCoordinatorDto>)x
                    .Select(user => new AdminDepartmentCoordinatorDto(user.UserId, user.Name, user.Email))
                    .ToList());

        var response = departments
            .Select(department =>
            {
                coordinatorByDepartmentId.TryGetValue(
                    department.DepartmentId,
                    out var departmentCoordinators);

                return new AdminDepartmentDto(
                    department.DepartmentId,
                    department.Name,
                    departmentCoordinators ?? Array.Empty<AdminDepartmentCoordinatorDto>());
            })
            .ToList();

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateAdminDepartmentRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Department name is required." });
        }

        var qaCoordinators = await ResolveTrackedQaCoordinatorsAsync(request.QaCoordinatorUserIds, cancellationToken);
        if (request.QaCoordinatorUserIds is not null && qaCoordinators is null)
        {
            return BadRequest(new { message = "One or more QA coordinator users are invalid." });
        }

        var department = new Department
        {
            Name = request.Name.Trim()
        };

        _dbContext.Departments.Add(department);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (qaCoordinators is not null && qaCoordinators.Count > 0)
        {
            AssignQaCoordinatorsToDepartment(qaCoordinators, department.DepartmentId);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var response = await BuildDepartmentDtoAsync(department.DepartmentId, department.Name, cancellationToken);
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
            .FirstOrDefaultAsync(x => x.DepartmentId == departmentId, cancellationToken);

        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        var qaCoordinators = await ResolveTrackedQaCoordinatorsAsync(request.QaCoordinatorUserIds, cancellationToken);
        if (request.QaCoordinatorUserIds is not null && qaCoordinators is null)
        {
            return BadRequest(new { message = "One or more QA coordinator users are invalid." });
        }

        department.Name = request.Name.Trim();

        if (qaCoordinators is not null && qaCoordinators.Count > 0)
        {
            AssignQaCoordinatorsToDepartment(qaCoordinators, department.DepartmentId);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = await BuildDepartmentDtoAsync(department.DepartmentId, department.Name, cancellationToken);
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

    private async Task<IReadOnlyList<User>?> ResolveTrackedQaCoordinatorsAsync(IReadOnlyList<int>? userIds, CancellationToken cancellationToken)
    {
        if (userIds is null)
        {
            return Array.Empty<User>();
        }

        var uniqueUserIds = userIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (uniqueUserIds.Count == 0)
        {
            return Array.Empty<User>();
        }

        var users = await _dbContext.Users
            .Where(x => uniqueUserIds.Contains(x.UserId) && x.Role.RoleName == "QA_COORDINATOR")
            .ToListAsync(cancellationToken);

        if (users.Count != uniqueUserIds.Count)
        {
            return null;
        }

        return users;
    }

    private void AssignQaCoordinatorsToDepartment(IReadOnlyList<User> qaCoordinators, int departmentId)
    {
        foreach (var qaCoordinator in qaCoordinators)
        {
            qaCoordinator.DepartmentId = departmentId;
        }
    }

    private async Task<AdminDepartmentDto> BuildDepartmentDtoAsync(int departmentId, string departmentName, CancellationToken cancellationToken)
    {
        var qaCoordinators = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Where(x => x.DepartmentId == departmentId && x.Role.RoleName == "QA_COORDINATOR")
            .OrderBy(x => x.Name)
            .ThenBy(x => x.UserId)
            .Select(x => new AdminDepartmentCoordinatorDto(x.UserId, x.Name, x.Email))
            .ToListAsync(cancellationToken);

        return new AdminDepartmentDto(departmentId, departmentName, qaCoordinators);
    }
}
