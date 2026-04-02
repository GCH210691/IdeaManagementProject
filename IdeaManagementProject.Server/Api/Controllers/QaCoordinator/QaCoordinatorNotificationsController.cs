using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/qa-coordinator/notifications")]
[Authorize(Roles = "QA_COORDINATOR")]
public class QaCoordinatorNotificationsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public QaCoordinatorNotificationsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var notifications = await _dbContext.Notifications
            .AsNoTracking()
            .Where(x => x.RecipientUserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.NotificationId)
            .Select(x => new QaCoordinatorNotificationDto(
                x.NotificationId,
                x.IdeaId,
                x.StaffName,
                x.IdeaTitle,
                x.DepartmentName,
                x.Message,
                x.CreatedAt,
                x.IdeaId != null))
            .ToListAsync(cancellationToken);

        return Ok(notifications);
    }

    private bool TryGetUserId(out int userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out userId);
    }
}
