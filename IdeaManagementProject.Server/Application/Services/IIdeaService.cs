namespace IdeaManagementProject.Server.Application.Services;

public interface IIdeaService
{
    Task<IReadOnlyList<IdeaView>> GetIdeasAsync(CancellationToken cancellationToken = default);
    Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default);
    Task<IdeaView?> CreateIdeaAsync(CreateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationResult> UpdateIdeaAsync(UpdateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationStatus> DeleteIdeaAsync(DeleteIdeaInput input, CancellationToken cancellationToken = default);
}

public sealed record CreateIdeaInput(int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record UpdateIdeaInput(int IdeaId, int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record DeleteIdeaInput(int IdeaId, int UserId);

public enum IdeaMutationStatus
{
    Success,
    NotFound,
    Forbidden
}

public sealed record IdeaMutationResult(IdeaMutationStatus Status, IdeaView? Idea);

public sealed record IdeaView(
    int IdeaId,
    string Title,
    string Content,
    int AuthorUserId,
    string AuthorName,
    int DepartmentId,
    string DepartmentName,
    bool IsAnonymous,
    int ViewCount,
    DateTime CreatedAt,
    IReadOnlyList<string> Categories,
    IReadOnlyList<int> CategoryIds);
