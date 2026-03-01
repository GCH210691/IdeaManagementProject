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
        return await _dbContext.Ideas
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new IdeaView(
                x.IdeaId,
                x.Title,
                x.Content,
                x.AuthorUserId,
                x.IsAnonymous ? "Anonymous" : x.AuthorUser.Name,
                x.DepartmentId,
                x.Department.Name,
                x.IsAnonymous,
                x.ViewCount,
                x.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default)
    {
        if (!incrementViewCount)
        {
            return await _dbContext.Ideas
                .AsNoTracking()
                .Include(x => x.AuthorUser)
                .Include(x => x.Department)
                .Where(x => x.IdeaId == ideaId)
                .Select(x => new IdeaView(
                    x.IdeaId,
                    x.Title,
                    x.Content,
                    x.AuthorUserId,
                    x.IsAnonymous ? "Anonymous" : x.AuthorUser.Name,
                    x.DepartmentId,
                    x.Department.Name,
                    x.IsAnonymous,
                    x.ViewCount,
                    x.CreatedAt))
                .FirstOrDefaultAsync(cancellationToken);
        }

        var idea = await _dbContext.Ideas
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
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

        var idea = new Idea
        {
            Title = input.Title.Trim(),
            Content = input.Content.Trim(),
            AuthorUserId = user.UserId,
            DepartmentId = user.DepartmentId,
            IsAnonymous = input.IsAnonymous,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Ideas.Add(idea);
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
            .FirstOrDefaultAsync(x => x.IdeaId == input.IdeaId, cancellationToken);

        if (idea is null)
        {
            return new IdeaMutationResult(IdeaMutationStatus.NotFound, null);
        }

        if (idea.AuthorUserId != input.UserId)
        {
            return new IdeaMutationResult(IdeaMutationStatus.Forbidden, null);
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
            idea.CreatedAt);
    }
}
