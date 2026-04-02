using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
public class PingController : ControllerBase
{
    [HttpGet("api/admin/ping")]
    [Authorize(Roles = "ADMIN")]
    public IActionResult AdminPing()
    {
        return Ok("ok-admin");
    }

    [HttpGet("api/manager/ping")]
    [Authorize(Roles = "QA_MANAGER")]
    public IActionResult ManagerPing()
    {
        return Ok("ok-manager");
    }

    [HttpGet("api/staff/ping")]
    [Authorize]
    public IActionResult StaffPing()
    {
        return Ok("ok-authenticated");
    }
}
