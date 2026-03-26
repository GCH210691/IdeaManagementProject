using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Application.Services;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/ideas")]
[Authorize]
public class IdeasController : ControllerBase
{
    private readonly IIdeaService _ideaService;
    private readonly AppDbContext _dbContext;

    public IdeasController(IIdeaService ideaService, AppDbContext dbContext)
    {
        _ideaService = ideaService;
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetIdeas(CancellationToken cancellationToken)
    {
        var ideas = await _ideaService.GetIdeasAsync(cancellationToken);
        var response = ideas.Select(x => ToDto(x, 0)).ToList();
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

        var currentUserVote = await GetCurrentUserVoteAsync(ideaId, cancellationToken);
        return Ok(ToDto(idea, currentUserVote));
    }

    [HttpPost("{ideaId:int}/comments")]
    public async Task<IActionResult> AddComment(int ideaId, [FromBody] CreateIdeaCommentRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Comment content is required." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var comment = await _ideaService.AddCommentAsync(
            new AddIdeaCommentInput(ideaId, userId, request.Content),
            cancellationToken);

        if (comment is null)
        {
            return NotFound(new { message = "Idea not found." });
        }

        return StatusCode(201, ToDto(comment));
    }

    [HttpPut("{ideaId:int}/vote")]
    public async Task<IActionResult> CastVote(int ideaId, [FromBody] CastIdeaVoteRequest? request, CancellationToken cancellationToken)
    {
        if (request?.Value is null || (request.Value.Value != -1 && request.Value.Value != 0 && request.Value.Value != 1))
        {
            return BadRequest(new { message = "Vote value must be -1, 0, or 1." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var voteSummary = await _ideaService.CastVoteAsync(
            new CastIdeaVoteInput(ideaId, userId, request.Value.Value),
            cancellationToken);

        if (voteSummary is null)
        {
            return NotFound(new { message = "Idea not found." });
        }

        return Ok(ToDto(voteSummary));
    }

    [HttpPost]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> CreateIdea([FromBody] CreateIdeaRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        var categoryIds = NormalizeCategoryIds(request.CategoryIds);
        if (!await AreValidCategoryIdsAsync(categoryIds, cancellationToken))
        {
            return BadRequest(new { message = "One or more categories are invalid." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var createdIdea = await _ideaService.CreateIdeaAsync(
            new CreateIdeaInput(userId, request.Title, request.Content, request.IsAnonymous, categoryIds),
            cancellationToken);

        if (createdIdea is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return StatusCode(201, ToDto(createdIdea, 0));
    }

    [HttpPut("{ideaId:int}")]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> UpdateIdea(int ideaId, [FromBody] UpdateIdeaRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Title and content are required." });
        }

        var categoryIds = NormalizeCategoryIds(request.CategoryIds);
        if (!await AreValidCategoryIdsAsync(categoryIds, cancellationToken))
        {
            return BadRequest(new { message = "One or more categories are invalid." });
        }

        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var result = await _ideaService.UpdateIdeaAsync(
            new UpdateIdeaInput(ideaId, userId, request.Title, request.Content, request.IsAnonymous, categoryIds),
            cancellationToken);

        return result.Status switch
        {
            IdeaMutationStatus.NotFound => NotFound(new { message = "Idea not found." }),
            IdeaMutationStatus.Forbidden => StatusCode(403, new { message = "You can only edit your own ideas." }),
            _ => Ok(ToDto(result.Idea!, 0))
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

    private async Task<bool> AreValidCategoryIdsAsync(IReadOnlyList<int> categoryIds, CancellationToken cancellationToken)
    {
        if (categoryIds.Count == 0)
        {
            return true;
        }

        var count = await _dbContext.Categories
            .AsNoTracking()
            .CountAsync(x => categoryIds.Contains(x.CategoryId), cancellationToken);

        return count == categoryIds.Count;
    }

    private static IReadOnlyList<int> NormalizeCategoryIds(IReadOnlyList<int>? categoryIds)
    {
        return (categoryIds ?? [])
            .Where(x => x > 0)
            .Distinct()
            .ToList();
    }

    private async Task<int> GetCurrentUserVoteAsync(int ideaId, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId))
        {
            return 0;
        }

        var vote = await _dbContext.Votes
            .AsNoTracking()
            .Where(x => x.IdeaId == ideaId && x.UserId == userId)
            .Select(x => (int?)x.Value)
            .FirstOrDefaultAsync(cancellationToken);

        return vote ?? 0;
    }

    private static IdeaDto ToDto(IdeaView idea, int currentUserVote)
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
            idea.UpvoteCount,
            idea.DownvoteCount,
            currentUserVote,
            idea.CreatedAt,
            idea.Categories,
            idea.CategoryIds,
            idea.Comments.Select(ToDto).ToList());
    }

    private static IdeaCommentDto ToDto(IdeaCommentView comment)
    {
        return new IdeaCommentDto(
            comment.CommentId,
            comment.AuthorUserId,
            comment.AuthorName,
            comment.AuthorRole,
            comment.Content,
            comment.CreatedAt);
    }

    private static IdeaVoteSummaryDto ToDto(IdeaVoteSummaryView voteSummary)
    {
        return new IdeaVoteSummaryDto(
            voteSummary.UpvoteCount,
            voteSummary.DownvoteCount,
            voteSummary.CurrentUserVote);
    }
}
