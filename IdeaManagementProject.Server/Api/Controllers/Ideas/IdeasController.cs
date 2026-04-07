using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Application.Services;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/ideas")]
[Authorize]
public class IdeasController : ControllerBase
{
    private readonly IIdeaService _ideaService;
    private readonly AppDbContext _dbContext;
    private readonly IIdeaAttachmentStorage _attachmentStorage;

    public IdeasController(IIdeaService ideaService, AppDbContext dbContext, IIdeaAttachmentStorage attachmentStorage)
    {
        _ideaService = ideaService;
        _dbContext = dbContext;
        _attachmentStorage = attachmentStorage;
    }

    [HttpGet]
    public async Task<IActionResult> GetIdeas(CancellationToken cancellationToken)
    {
        var ideas = await _ideaService.GetIdeasAsync(cancellationToken);
        var response = ideas.Select(x => ToDto(x, 0)).ToList();
        return Ok(response);
    }

    [HttpGet("submission-window")]
    [Authorize(Roles = "STAFF,QA_COORDINATOR")]
    public async Task<IActionResult> GetSubmissionWindow(CancellationToken cancellationToken)
    {
        var submissionWindow = await _ideaService.GetSubmissionWindowAsync(cancellationToken);
        return Ok(ToDto(submissionWindow));
    }

    [HttpGet("export/csv")]
    [Authorize(Roles = "QA_MANAGER")]
    public async Task<IActionResult> ExportIdeasCsv(CancellationToken cancellationToken)
    {
        var ideas = await _dbContext.Ideas
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.AuthorUser)
                .ThenInclude(x => x.Role)
            .Include(x => x.Department)
            .Include(x => x.ClosurePeriod)
                .ThenInclude(x => x.AcademicYear)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .Include(x => x.Comments)
                .ThenInclude(x => x.AuthorUser)
                    .ThenInclude(x => x.Role)
            .Include(x => x.Votes)
                .ThenInclude(x => x.User)
                    .ThenInclude(x => x.Role)
            .OrderBy(x => x.IdeaId)
            .ToListAsync(cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine(string.Join(",",
            Csv("IdeaId"),
            Csv("Title"),
            Csv("Content"),
            Csv("AuthorUserId"),
            Csv("AuthorName"),
            Csv("AuthorEmail"),
            Csv("AuthorRole"),
            Csv("DepartmentId"),
            Csv("DepartmentName"),
            Csv("AcademicYear"),
            Csv("ClosurePeriod"),
            Csv("IdeaStartAt"),
            Csv("IdeaEndAt"),
            Csv("CommentEndAt"),
            Csv("IsAnonymous"),
            Csv("ViewCount"),
            Csv("IdeaCreatedAt"),
            Csv("Categories"),
            Csv("Comments"),
            Csv("UpvoteCount"),
            Csv("DownvoteCount"),
            Csv("Votes")));

        foreach (var idea in ideas)
        {
            var categories = string.Join(" | ",
                idea.IdeaCategories
                    .OrderBy(x => x.Category.Name)
                    .Select(x => x.Category.Name));

            var comments = string.Join(" | ",
                idea.Comments
                    .OrderBy(x => x.CreatedAt)
                    .ThenBy(x => x.CommentId)
                    .Select(x => $"{x.AuthorUser.Name} [{ToRoleLabel(x.AuthorUser.Role.RoleName)}] {x.CreatedAt:O}: {x.Content}"));

            var upvoteCount = idea.Votes.Count(x => x.Value > 0);
            var downvoteCount = idea.Votes.Count(x => x.Value < 0);
            var votes = string.Join(" | ",
                idea.Votes
                    .OrderBy(x => x.User.Name)
                    .ThenBy(x => x.VoteId)
                    .Select(x => $"{x.User.Name} [{ToRoleLabel(x.User.Role.RoleName)}]: {(x.Value > 0 ? "Upvote" : "Downvote")}"));

            csv.AppendLine(string.Join(",",
                Csv(idea.IdeaId),
                Csv(idea.Title),
                Csv(idea.Content),
                Csv(idea.AuthorUserId),
                Csv(idea.IsAnonymous ? "Anonymous" : idea.AuthorUser.Name),
                Csv(idea.AuthorUser.Email),
                Csv(ToRoleLabel(idea.AuthorUser.Role.RoleName)),
                Csv(idea.DepartmentId),
                Csv(idea.Department.Name),
                Csv(idea.ClosurePeriod.AcademicYear.YearName),
                Csv(idea.ClosurePeriod.Title),
                Csv(idea.ClosurePeriod.IdeaStartAt.ToString("O")),
                Csv(idea.ClosurePeriod.IdeaEndAt.ToString("O")),
                Csv(idea.ClosurePeriod.CommentEndAt.ToString("O")),
                Csv(idea.IsAnonymous),
                Csv(idea.ViewCount),
                Csv(idea.CreatedAt.ToString("O")),
                Csv(categories),
                Csv(comments),
                Csv(upvoteCount),
                Csv(downvoteCount),
                Csv(votes)));
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        var fileName = $"system-data-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
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

        var result = await _ideaService.AddCommentAsync(
            new AddIdeaCommentInput(ideaId, userId, request.Content),
            cancellationToken);

        return result.Status switch
        {
            IdeaCommentMutationStatus.IdeaNotFound => NotFound(new { message = "Idea not found." }),
            IdeaCommentMutationStatus.UserNotFound => NotFound(new { message = "User not found." }),
            IdeaCommentMutationStatus.CommentClosed => StatusCode(409, new
            {
                message = "Comment is not available at the moment.",
                commentEndAt = result.CommentEndAt
            }),
            _ => StatusCode(201, ToDto(result.Comment!))
        };
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
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> CreateIdea([FromForm] CreateIdeaRequest? request, CancellationToken cancellationToken)
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

        var result = await _ideaService.CreateIdeaAsync(
            new CreateIdeaInput(userId, request.Title, request.Content, request.IsAnonymous, categoryIds),
            cancellationToken);

        return result.Status switch
        {
            IdeaCreationStatus.UserNotFound => NotFound(new { message = "User not found." }),
            IdeaCreationStatus.NoOpenClosurePeriod => StatusCode(409, new
            {
                message = "No idea submission window is open right now.",
                submissionWindow = ToDto(result.SubmissionWindow)
            }),
            _ => await FinishCreateIdeaAsync(result.Idea!, request.Files, cancellationToken)
        };
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

    [HttpGet("attachments/{attachmentId:int}/download")]
    [Authorize(Roles = "QA_MANAGER")]
    public async Task<IActionResult> DownloadAttachment(int attachmentId, CancellationToken cancellationToken)
    {
        var attachment = await _dbContext.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AttachmentId == attachmentId, cancellationToken);

        if (attachment is null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        var file = await _attachmentStorage.OpenReadAsync(attachment.FilePath, cancellationToken);
        if (file is null)
        {
            return NotFound(new { message = "Attachment file not found." });
        }

        return File(file.Stream, attachment.ContentType, attachment.OriginalName);
    }

    private async Task<IActionResult> FinishCreateIdeaAsync(IdeaView createdIdea, IReadOnlyList<IFormFile>? files, CancellationToken cancellationToken)
    {
        var uploadFiles = (files ?? [])
            .Where(x => x is not null && x.Length > 0)
            .ToList();

        if (uploadFiles.Count > 0)
        {
            foreach (var file in uploadFiles)
            {
                var storedAttachment = await _attachmentStorage.SaveAsync(createdIdea.IdeaId, file, cancellationToken);
                _dbContext.Attachments.Add(new Attachment
                {
                    IdeaId = createdIdea.IdeaId,
                    FilePath = storedAttachment.RelativePath,
                    OriginalName = Path.GetFileName(file.FileName),
                    ContentType = storedAttachment.ContentType,
                    UploadedAt = DateTime.UtcNow,
                });
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            createdIdea = await _ideaService.GetIdeaByIdAsync(createdIdea.IdeaId, false, cancellationToken) ?? createdIdea;
        }

        return StatusCode(201, ToDto(createdIdea, 0));
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
            idea.ClosurePeriodId,
            idea.ClosurePeriodTitle,
            idea.AcademicYearId,
            idea.AcademicYearName,
            idea.IsAnonymous,
            idea.ViewCount,
            idea.UpvoteCount,
            idea.DownvoteCount,
            currentUserVote,
            idea.CreatedAt,
            idea.IdeaStartAt,
            idea.IdeaEndAt,
            idea.CommentEndAt,
            idea.IsCommentOpen,
            idea.Categories,
            idea.CategoryIds,
            idea.Comments.Select(ToDto).ToList(),
            idea.Attachments.Select(ToDto).ToList());
    }

    private static IdeaSubmissionWindowDto ToDto(IdeaSubmissionWindowView submissionWindow)
    {
        return new IdeaSubmissionWindowDto(
            submissionWindow.State,
            submissionWindow.ClosurePeriodId,
            submissionWindow.Title,
            submissionWindow.IdeaStartAt,
            submissionWindow.IdeaEndAt);
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

    private static IdeaAttachmentDto ToDto(IdeaAttachmentView attachment)
    {
        return new IdeaAttachmentDto(
            attachment.AttachmentId,
            attachment.OriginalName,
            attachment.ContentType,
            attachment.UploadedAt);
    }

    private static string Csv(object? value)
    {
        var text = Convert.ToString(value) ?? string.Empty;
        return $"\"{text.Replace("\"", "\"\"")}\"";
    }

    private static string ToRoleLabel(string role)
    {
        return string.Join(" ",
            role.Split('_', StringSplitOptions.RemoveEmptyEntries)
                .Select(part => char.ToUpperInvariant(part[0]) + part[1..].ToLowerInvariant()));
    }
}
