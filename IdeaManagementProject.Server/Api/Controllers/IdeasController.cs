using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Application.Services;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/ideas")]
[Authorize]
public class IdeasController : ControllerBase
{
    private readonly IIdeaService _ideaService;

    public IdeasController(IIdeaService ideaService)
    {
        _ideaService = ideaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetIdeas(CancellationToken cancellationToken)
    {
        var ideas = await _ideaService.GetIdeasAsync(cancellationToken);
        var response = ideas.Select(ToDto).ToList();
        return Ok(response);
    }

    [HttpGet("{ideaId:int}")]
    public async Task<IActionResult> GetIdea(int ideaId, [FromQuery] bool incrementViewCount = true, CancellationToken cancellationToken = default)
    {
        var idea = await _ideaService.GetIdeaByIdAsync(ideaId, incrementViewCount, cancellationToken);
        if (idea is null)
        {
            return NotFound(new { message = "Idea not found." });
        }

        return Ok(ToDto(idea));
    }

    [HttpPost]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> CreateIdea([FromBody] CreateIdeaRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var createdIdea = await _ideaService.CreateIdeaAsync(
            new CreateIdeaInput(userId, request.Title, request.Content, request.IsAnonymous),
            cancellationToken);

        if (createdIdea is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return StatusCode(201, ToDto(createdIdea));
    }

    [HttpPut("{ideaId:int}")]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> UpdateIdea(int ideaId, [FromBody] UpdateIdeaRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _ideaService.UpdateIdeaAsync(
            new UpdateIdeaInput(ideaId, userId, request.Title, request.Content, request.IsAnonymous),
            cancellationToken);

        return result.Status switch
        {
            IdeaMutationStatus.NotFound => NotFound(new { message = "Idea not found." }),
            IdeaMutationStatus.Forbidden => StatusCode(403, new { message = "You can only edit your own ideas." }),
            _ => Ok(ToDto(result.Idea!))
        };
    }

    [HttpDelete("{ideaId:int}")]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> DeleteIdea(int ideaId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _ideaService.DeleteIdeaAsync(new DeleteIdeaInput(ideaId, userId), cancellationToken);

        return result switch
        {
            IdeaMutationStatus.NotFound => NotFound(new { message = "Idea not found." }),
            IdeaMutationStatus.Forbidden => StatusCode(403, new { message = "You can only delete your own ideas." }),
            _ => NoContent()
        };
    }

    private bool TryGetUserId(out int userId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out userId);
    }

    private static IdeaDto ToDto(IdeaView idea)
    {
        return new IdeaDto(
            idea.IdeaId,
            idea.Title,
            idea.Content,
            idea.AuthorUserId,
            idea.AuthorName,
            idea.DepartmentId,
            idea.DepartmentName,
            idea.IsAnonymous,
            idea.ViewCount,
            idea.CreatedAt);
    }
}
