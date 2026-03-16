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
        var ideas = await _dbContext.Ideas
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return ideas.Select(ToView).ToList();
    }

    public async Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default)
    {
        if (!incrementViewCount)
        {
            var ideaSnapshot = await _dbContext.Ideas
                .AsNoTracking()
                .Include(x => x.AuthorUser)
                .Include(x => x.Department)
                .Include(x => x.IdeaCategories)
                    .ThenInclude(x => x.Category)
                .FirstOrDefaultAsync(x => x.IdeaId == ideaId, cancellationToken);

            return ideaSnapshot is null ? null : ToView(ideaSnapshot);
        }

        var idea = await _dbContext.Ideas
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Category)
            .FirstOrDefaultAsync(x => x.IdeaId == ideaId, cancellationToken);

        if (idea is null)
        {
            return null;
        }

        idea.ViewCount += 1;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToView(idea);
    }

    public async Task<IdeaView?> CreateIdeaAsync(CreateIdeaInput input, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.UserId == input.UserId, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var selectedCategoryIds = input.CategoryIds.Distinct().ToList();
        var categories = await _dbContext.Categories
            .Where(x => selectedCategoryIds.Contains(x.CategoryId))
            .ToListAsync(cancellationToken);

        var idea = new Idea
        {
            Title = input.Title.Trim(),
            Content = input.Content.Trim(),
            AuthorUserId = user.UserId,
            DepartmentId = user.DepartmentId,
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

        await _dbContext.SaveChangesAsync(cancellationToken);

        idea.AuthorUser = user;
        idea.Department = user.Department;

        return ToView(idea);
    }

    public async Task<IdeaMutationResult> UpdateIdeaAsync(UpdateIdeaInput input, CancellationToken cancellationToken = default)
    {
        var idea = await _dbContext.Ideas
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
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

        return new IdeaMutationResult(IdeaMutationStatus.Success, ToView(idea));
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

    private static IdeaView ToView(Idea idea)
    {
        var orderedCategories = idea.IdeaCategories
            .OrderBy(x => x.Category.Name)
            .ToList();

        return new IdeaView(
            idea.IdeaId,
            idea.Title,
            idea.Content,
            idea.AuthorUserId,
            idea.IsAnonymous ? "Anonymous" : idea.AuthorUser.Name,
            idea.DepartmentId,
            idea.Department.Name,
            idea.IsAnonymous,
            idea.ViewCount,
            idea.CreatedAt,
            orderedCategories.Select(x => x.Category.Name).ToList(),
            orderedCategories.Select(x => x.CategoryId).ToList());
    }
}
