using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Application.Services;

public class IdeaService : IIdeaService
{
    private readonly AppDbContext _dbContext;

    public IdeaService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<IdeaView>> GetIdeasAsync(CancellationToken cancellationToken = default)
    {
        var now = GetCurrentClosureTime();

        var ideas = await _dbContext.Ideas
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.ClosurePeriod)
                .ThenInclude(x => x.AcademicYear)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return ideas.Select(x => ToView(x, includeComments: false, now)).ToList();
    }

    public async Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default)
    {
        var now = GetCurrentClosureTime();

        if (!incrementViewCount)
        {
            var ideaSnapshot = await _dbContext.Ideas
                .AsNoTracking()
                .AsSplitQuery()
                .Include(x => x.AuthorUser)
                .Include(x => x.Department)
                .Include(x => x.ClosurePeriod)
                    .ThenInclude(x => x.AcademicYear)
                .Include(x => x.IdeaCategories)
                    .ThenInclude(x => x.Category)
                .Include(x => x.Votes)
                .Include(x => x.Attachments)
                .Include(x => x.Comments)
                    .ThenInclude(x => x.AuthorUser)
                        .ThenInclude(x => x.Role)
                .FirstOrDefaultAsync(x => x.IdeaId == ideaId, cancellationToken);

            return ideaSnapshot is null ? null : ToView(ideaSnapshot, includeComments: true, now);
        }

        var idea = await _dbContext.Ideas
            .AsSplitQuery()
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.ClosurePeriod)
                .ThenInclude(x => x.AcademicYear)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .Include(x => x.Votes)
            .Include(x => x.Attachments)
            .Include(x => x.Comments)
                .ThenInclude(x => x.AuthorUser)
                    .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.IdeaId == ideaId, cancellationToken);

        if (idea is null)
        {
            return null;
        }

        idea.ViewCount += 1;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToView(idea, includeComments: true, now);
    }

    public async Task<IdeaSubmissionWindowView> GetSubmissionWindowAsync(CancellationToken cancellationToken = default)
    {
        var now = GetCurrentClosureTime();

        var openWindow = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .OrderBy(x => x.IdeaStartAt)
            .FirstOrDefaultAsync(
                x => x.IdeaStartAt <= now && x.IdeaEndAt >= now,
                cancellationToken);

        if (openWindow is not null)
        {
            return ToSubmissionWindowView("open", openWindow);
        }

        var upcomingWindow = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Where(x => x.IdeaStartAt > now)
            .OrderBy(x => x.IdeaStartAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (upcomingWindow is not null)
        {
            return ToSubmissionWindowView("upcoming", upcomingWindow);
        }

        var latestEndedWindow = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Where(x => x.IdeaEndAt < now)
            .OrderByDescending(x => x.IdeaEndAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestEndedWindow is not null)
        {
            return ToSubmissionWindowView("closed", latestEndedWindow);
        }

        return new IdeaSubmissionWindowView("unavailable", null, null, null, null);
    }

    public async Task<IdeaCreationResult> CreateIdeaAsync(CreateIdeaInput input, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Department)
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.UserId == input.UserId, cancellationToken);

        if (user is null)
        {
            return new IdeaCreationResult(
                IdeaCreationStatus.UserNotFound,
                null,
                await GetSubmissionWindowAsync(cancellationToken));
        }

        var now = GetCurrentClosureTime();

        var openClosurePeriod = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Include(x => x.AcademicYear)
            .OrderBy(x => x.IdeaStartAt)
            .FirstOrDefaultAsync(
                x => x.IdeaStartAt <= now && x.IdeaEndAt >= now,
                cancellationToken);

        if (openClosurePeriod is null)
        {
            return new IdeaCreationResult(
                IdeaCreationStatus.NoOpenClosurePeriod,
                null,
                await GetSubmissionWindowAsync(cancellationToken));
        }

        var selectedCategoryIds = input.CategoryIds.Distinct().ToList();
        var categories = selectedCategoryIds.Count == 0
            ? []
            : await _dbContext.Categories
                .Where(x => selectedCategoryIds.Contains(x.CategoryId))
                .ToListAsync(cancellationToken);

        var idea = new Idea
        {
            Title = input.Title.Trim(),
            Content = input.Content.Trim(),
            AuthorUserId = user.UserId,
            DepartmentId = user.DepartmentId,
            ClosurePeriodId = openClosurePeriod.ClosurePeriodId,
            IsAnonymous = input.IsAnonymous,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Ideas.Add(idea);
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var category in categories)
        {
            idea.IdeaCategories.Add(new IdeaCategory
            {
                IdeaId = idea.IdeaId,
                CategoryId = category.CategoryId,
                Idea = idea,
                Category = category,
            });
        }

        if (string.Equals(user.Role.RoleName, "STAFF", StringComparison.OrdinalIgnoreCase))
        {
            var coordinatorIds = await _dbContext.Users
                .AsNoTracking()
                .Where(x => x.DepartmentId == user.DepartmentId && x.Role.RoleName == "QA_COORDINATOR")
                .Select(x => x.UserId)
                .ToListAsync(cancellationToken);

            foreach (var coordinatorId in coordinatorIds)
            {
                _dbContext.Notifications.Add(new Notification
                {
                    RecipientUserId = coordinatorId,
                    IdeaId = idea.IdeaId,
                    StaffName = user.Name,
                    IdeaTitle = idea.Title,
                    DepartmentName = user.Department.Name,
                    Message = $"{user.Name} created the idea \"{idea.Title}\".",
                    CreatedAt = DateTime.UtcNow,
                });
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        idea.AuthorUser = user;
        idea.Department = user.Department;
        idea.ClosurePeriod = openClosurePeriod;

        return new IdeaCreationResult(
            IdeaCreationStatus.Success,
            ToView(idea, includeComments: false, now),
            ToSubmissionWindowView("open", openClosurePeriod));
    }

    public async Task<IdeaMutationResult> UpdateIdeaAsync(UpdateIdeaInput input, CancellationToken cancellationToken = default)
    {
        var now = GetCurrentClosureTime();

        var idea = await _dbContext.Ideas
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.ClosurePeriod)
                .ThenInclude(x => x.AcademicYear)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .FirstOrDefaultAsync(x => x.IdeaId == input.IdeaId, cancellationToken);

        if (idea is null)
        {
            return new IdeaMutationResult(IdeaMutationStatus.NotFound, null);
        }

        if (idea.AuthorUserId != input.UserId)
        {
            return new IdeaMutationResult(IdeaMutationStatus.Forbidden, null);
        }

        var nextCategoryIds = input.CategoryIds.Distinct().ToHashSet();
        var currentCategoryIds = idea.IdeaCategories.Select(x => x.CategoryId).ToHashSet();

        var removeItems = idea.IdeaCategories
            .Where(x => !nextCategoryIds.Contains(x.CategoryId))
            .ToList();

        if (removeItems.Count > 0)
        {
            _dbContext.IdeaCategories.RemoveRange(removeItems);
        }

        var categoryIdsToAdd = nextCategoryIds
            .Where(x => !currentCategoryIds.Contains(x))
            .ToList();

        if (categoryIdsToAdd.Count > 0)
        {
            var categoriesToAdd = await _dbContext.Categories
                .Where(x => categoryIdsToAdd.Contains(x.CategoryId))
                .ToListAsync(cancellationToken);

            foreach (var category in categoriesToAdd)
            {
                idea.IdeaCategories.Add(new IdeaCategory
                {
                    IdeaId = idea.IdeaId,
                    CategoryId = category.CategoryId,
                    Idea = idea,
                    Category = category,
                });
            }
        }

        idea.Title = input.Title.Trim();
        idea.Content = input.Content.Trim();
        idea.IsAnonymous = input.IsAnonymous;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new IdeaMutationResult(IdeaMutationStatus.Success, ToView(idea, includeComments: false, now));
    }

    public async Task<IdeaMutationStatus> DeleteIdeaAsync(DeleteIdeaInput input, CancellationToken cancellationToken = default)
    {
        var idea = await _dbContext.Ideas
            .FirstOrDefaultAsync(x => x.IdeaId == input.IdeaId, cancellationToken);

        if (idea is null)
        {
            return IdeaMutationStatus.NotFound;
        }

        if (idea.AuthorUserId != input.UserId)
        {
            return IdeaMutationStatus.Forbidden;
        }

        _dbContext.Ideas.Remove(idea);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return IdeaMutationStatus.Success;
    }

    public async Task<IdeaCommentMutationResult> AddCommentAsync(AddIdeaCommentInput input, CancellationToken cancellationToken = default)
    {
        var now = GetCurrentClosureTime();

        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x => x.UserId == input.UserId, cancellationToken);

        if (user is null)
        {
            return new IdeaCommentMutationResult(IdeaCommentMutationStatus.UserNotFound, null, null);
        }

        var idea = await _dbContext.Ideas
            .AsNoTracking()
            .Include(x => x.ClosurePeriod)
            .FirstOrDefaultAsync(x => x.IdeaId == input.IdeaId, cancellationToken);

        if (idea is null)
        {
            return new IdeaCommentMutationResult(IdeaCommentMutationStatus.IdeaNotFound, null, null);
        }

        if (now > idea.ClosurePeriod.CommentEndAt)
        {
            return new IdeaCommentMutationResult(
                IdeaCommentMutationStatus.CommentClosed,
                null,
                idea.ClosurePeriod.CommentEndAt);
        }

        var comment = new Comment
        {
            IdeaId = input.IdeaId,
            AuthorUserId = input.UserId,
            Content = input.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
        };

        _dbContext.Comments.Add(comment);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new IdeaCommentMutationResult(
            IdeaCommentMutationStatus.Success,
            new IdeaCommentView(
                comment.CommentId,
                user.UserId,
                user.Name,
                user.Role.RoleName,
                comment.Content,
                comment.CreatedAt),
            idea.ClosurePeriod.CommentEndAt);
    }

    public async Task<IdeaVoteSummaryView?> CastVoteAsync(CastIdeaVoteInput input, CancellationToken cancellationToken = default)
    {
        var ideaExists = await _dbContext.Ideas
            .AsNoTracking()
            .AnyAsync(x => x.IdeaId == input.IdeaId, cancellationToken);

        if (!ideaExists)
        {
            return null;
        }

        var existingVote = await _dbContext.Votes
            .FirstOrDefaultAsync(x => x.IdeaId == input.IdeaId && x.UserId == input.UserId, cancellationToken);

        var currentUserVote = input.Value;

        if (input.Value == 0)
        {
            if (existingVote is not null)
            {
                _dbContext.Votes.Remove(existingVote);
            }

            currentUserVote = 0;
        }
        else if (existingVote is null)
        {
            _dbContext.Votes.Add(new Vote
            {
                IdeaId = input.IdeaId,
                UserId = input.UserId,
                Value = input.Value,
            });
        }
        else if (existingVote.Value == input.Value)
        {
            _dbContext.Votes.Remove(existingVote);
            currentUserVote = 0;
        }
        else
        {
            existingVote.Value = input.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var votes = await _dbContext.Votes
            .AsNoTracking()
            .Where(x => x.IdeaId == input.IdeaId)
            .ToListAsync(cancellationToken);

        return new IdeaVoteSummaryView(
            votes.Count(x => x.Value > 0),
            votes.Count(x => x.Value < 0),
            currentUserVote);
    }

    private static DateTime GetCurrentClosureTime()
    {
        return DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);
    }

    private static IdeaSubmissionWindowView ToSubmissionWindowView(string state, ClosurePeriod closurePeriod)
    {
        return new IdeaSubmissionWindowView(
            state,
            closurePeriod.ClosurePeriodId,
            closurePeriod.Title,
            closurePeriod.IdeaStartAt,
            closurePeriod.IdeaEndAt);
    }

    private static IdeaView ToView(Idea idea, bool includeComments, DateTime now)
    {
        var orderedCategories = idea.IdeaCategories
            .OrderBy(x => x.Category.Name)
            .ToList();

        var upvoteCount = idea.Votes.Count(x => x.Value > 0);
        var downvoteCount = idea.Votes.Count(x => x.Value < 0);

        var orderedComments = includeComments
            ? idea.Comments
                .OrderBy(x => x.CreatedAt)
                .ThenBy(x => x.CommentId)
                .Select(x => new IdeaCommentView(
                    x.CommentId,
                    x.AuthorUserId,
                    x.AuthorUser.Name,
                    x.AuthorUser.Role.RoleName,
                    x.Content,
                    x.CreatedAt))
                .ToList()
            : [];

        var orderedAttachments = idea.Attachments
            .OrderBy(x => x.UploadedAt)
            .ThenBy(x => x.AttachmentId)
            .Select(x => new IdeaAttachmentView(
                x.AttachmentId,
                x.OriginalName,
                x.ContentType,
                x.UploadedAt))
            .ToList();

        return new IdeaView(
            idea.IdeaId,
            idea.Title,
            idea.Content,
            idea.AuthorUserId,
            idea.IsAnonymous ? "Anonymous" : idea.AuthorUser.Name,
            idea.DepartmentId,
            idea.Department.Name,
            idea.ClosurePeriodId,
            idea.ClosurePeriod.Title,
            idea.ClosurePeriod.AcademicYearId,
            idea.ClosurePeriod.AcademicYear.YearName,
            idea.IsAnonymous,
            idea.ViewCount,
            upvoteCount,
            downvoteCount,
            idea.CreatedAt,
            idea.ClosurePeriod.IdeaStartAt,
            idea.ClosurePeriod.IdeaEndAt,
            idea.ClosurePeriod.CommentEndAt,
            now <= idea.ClosurePeriod.CommentEndAt,
            orderedCategories.Select(x => x.Category.Name).ToList(),
            orderedCategories.Select(x => x.CategoryId).ToList(),
            orderedComments,
            orderedAttachments);
    }
}
