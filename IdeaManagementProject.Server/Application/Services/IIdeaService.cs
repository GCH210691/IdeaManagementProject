namespace IdeaManagementProject.Server.Application.Services;

public interface IIdeaService
{
    Task<IReadOnlyList<IdeaView>> GetIdeasAsync(CancellationToken cancellationToken = default);
    Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default);
    Task<IdeaView?> CreateIdeaAsync(CreateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationResult> UpdateIdeaAsync(UpdateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationStatus> DeleteIdeaAsync(DeleteIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaCommentView?> AddCommentAsync(AddIdeaCommentInput input, CancellationToken cancellationToken = default);
    Task<IdeaVoteSummaryView?> CastVoteAsync(CastIdeaVoteInput input, CancellationToken cancellationToken = default);
}

public sealed record CreateIdeaInput(int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record UpdateIdeaInput(int IdeaId, int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record DeleteIdeaInput(int IdeaId, int UserId);

public sealed record AddIdeaCommentInput(int IdeaId, int UserId, string Content);

public sealed record CastIdeaVoteInput(int IdeaId, int UserId, int Value);

public enum IdeaMutationStatus
{
    Success,
    NotFound,
    Forbidden
}

public sealed record IdeaMutationResult(IdeaMutationStatus Status, IdeaView? Idea);

public sealed record IdeaCommentView(
    int CommentId,
    int AuthorUserId,
    string AuthorName,
    string AuthorRole,
    string Content,
    DateTime CreatedAt);

public sealed record IdeaVoteSummaryView(
    int UpvoteCount,
    int DownvoteCount,
    int CurrentUserVote);

public sealed record IdeaAttachmentView(
    int AttachmentId,
    string OriginalName,
    string ContentType,
    DateTime UploadedAt);

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
    int UpvoteCount,
    int DownvoteCount,
    DateTime CreatedAt,
    IReadOnlyList<string> Categories,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<IdeaCommentView> Comments,
    IReadOnlyList<IdeaAttachmentView> Attachments);
