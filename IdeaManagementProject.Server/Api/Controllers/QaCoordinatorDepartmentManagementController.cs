using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/qa-coordinator/department-management")]
[Authorize(Roles = "QA_COORDINATOR")]
public class QaCoordinatorDepartmentManagementController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public QaCoordinatorDepartmentManagementController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetDepartmentManagement(CancellationToken cancellationToken)
    {
        var coordinator = await GetCoordinatorContextAsync(cancellationToken);
        if (coordinator is null)
        {
            return Unauthorized();
        }

        var departmentStaff = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.DepartmentId == coordinator.DepartmentId && x.Role.RoleName == "STAFF")
            .OrderBy(x => x.Name)
            .ThenBy(x => x.UserId)
            .Select(x => new QaCoordinatorDepartmentStaffDto(
                x.UserId,
                x.Name,
                x.Email,
                x.DepartmentId,
                x.Department.Name))
            .ToListAsync(cancellationToken);

        var availableStaff = await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.DepartmentId != coordinator.DepartmentId && x.Role.RoleName == "STAFF")
            .OrderBy(x => x.Name)
            .ThenBy(x => x.UserId)
            .Select(x => new QaCoordinatorDepartmentStaffDto(
                x.UserId,
                x.Name,
                x.Email,
                x.DepartmentId,
                x.Department.Name))
            .ToListAsync(cancellationToken);

        return Ok(new QaCoordinatorDepartmentManagementResponse(
            coordinator.DepartmentId,
            coordinator.DepartmentName,
            departmentStaff,
            availableStaff));
    }

    [HttpPut("staff/{userId:int}/department")]
    public async Task<IActionResult> AssignStaffToDepartment(
        int userId,
        [FromBody] UpdateQaCoordinatorDepartmentStaffRequest? request,
        CancellationToken cancellationToken)
    {
        var coordinator = await GetCoordinatorContextAsync(cancellationToken);
        if (coordinator is null)
        {
            return Unauthorized();
        }

        if (request?.DepartmentId is null || request.DepartmentId.Value <= 0)
        {
            return BadRequest(new { message = "Department is required." });
        }

        if (request.DepartmentId.Value != coordinator.DepartmentId)
        {
            return BadRequest(new { message = "QA coordinators can only assign staff to their own department." });
        }

        var staffUser = await _dbContext.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (staffUser is null)
        {
            return NotFound(new { message = "Staff user not found." });
        }

        if (!string.Equals(staffUser.Role.RoleName, "STAFF", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Only staff accounts can be reassigned." });
        }

        staffUser.DepartmentId = coordinator.DepartmentId;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new QaCoordinatorDepartmentStaffDto(
            staffUser.UserId,
            staffUser.Name,
            staffUser.Email,
            coordinator.DepartmentId,
            coordinator.DepartmentName));
    }

    private async Task<CoordinatorContext?> GetCoordinatorContextAsync(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return await _dbContext.Users
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.Role.RoleName == "QA_COORDINATOR")
            .Select(x => new CoordinatorContext(
                x.UserId,
                x.DepartmentId,
                x.Department.Name))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private sealed record CoordinatorContext(int UserId, int DepartmentId, string DepartmentName);
}
