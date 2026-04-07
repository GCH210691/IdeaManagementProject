using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Application.Services;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var result = await _authService.LoginAsync(request.Email, request.Password, cancellationToken);
        if (result is null)
        {
            return Unauthorized(new { message = "Invalid credentials" });
        }

        return Ok(new LoginResponse(result.Token, ToDto(result.User)));
    }

    [HttpGet("register-options")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterOptions(CancellationToken cancellationToken)
    {
        var options = await _authService.GetRegistrationOptionsAsync(cancellationToken);

        var response = new RegisterOptionsResponse(
            options.Roles.Select(x => new RoleOptionDto(x.RoleName)).ToList(),
            options.Departments.Select(x => new DepartmentOptionDto(x.DepartmentId, x.Name)).ToList());

        return Ok(response);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest? request, CancellationToken cancellationToken)
    {
        if (request is null ||
            string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.Role) ||
            request.DepartmentId is null ||
            request.DepartmentId <= 0)
        {
            return BadRequest(new { message = "Name, email, password, role, and department are required." });
        }

        var result = await _authService.RegisterAsync(
            new RegisterInput(
                request.Name,
                request.Email,
                request.Password,
                request.DepartmentId.Value,
                request.Role,
                request.AcceptedTerms),
            cancellationToken);

        return result.FailureReason switch
        {
            RegisterFailureReason.EmailExists => Conflict(new { message = "Email is already registered." }),
            RegisterFailureReason.DepartmentNotFound => BadRequest(new { message = "Invalid department." }),
            RegisterFailureReason.RoleNotFound => BadRequest(new { message = "Invalid role." }),
            RegisterFailureReason.None when result.Auth is not null => StatusCode(201, new LoginResponse(result.Auth.Token, ToDto(result.Auth.User))),
            _ => StatusCode(500, new { message = "Registration failed." })
        };
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(userId, cancellationToken);
        if (user is null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(new MeResponse(ToDto(user)));
    }

    private static AuthUserDto ToDto(UserProfile user)
    {
        return new AuthUserDto(
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.DepartmentId,
            user.AcceptedTermsAt);
    }
}
