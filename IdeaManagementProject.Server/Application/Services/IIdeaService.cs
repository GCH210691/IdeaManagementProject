namespace IdeaManagementProject.Server.Application.Services;

public interface IIdeaService
{
    Task<IReadOnlyList<IdeaView>> GetIdeasAsync(CancellationToken cancellationToken = default);
    Task<IdeaView?> GetIdeaByIdAsync(int ideaId, bool incrementViewCount = false, CancellationToken cancellationToken = default);
    Task<IdeaSubmissionWindowView> GetSubmissionWindowAsync(CancellationToken cancellationToken = default);
    Task<IdeaCreationResult> CreateIdeaAsync(CreateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationResult> UpdateIdeaAsync(UpdateIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaMutationStatus> DeleteIdeaAsync(DeleteIdeaInput input, CancellationToken cancellationToken = default);
    Task<IdeaCommentMutationResult> AddCommentAsync(AddIdeaCommentInput input, CancellationToken cancellationToken = default);
    Task<IdeaVoteSummaryView?> CastVoteAsync(CastIdeaVoteInput input, CancellationToken cancellationToken = default);
}

public sealed record CreateIdeaInput(int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record UpdateIdeaInput(int IdeaId, int UserId, string Title, string Content, bool IsAnonymous, IReadOnlyList<int> CategoryIds);

public sealed record DeleteIdeaInput(int IdeaId, int UserId);

public sealed record AddIdeaCommentInput(int IdeaId, int UserId, string Content);

public sealed record CastIdeaVoteInput(int IdeaId, int UserId, int Value);

public enum IdeaCreationStatus
{
    Success,
    UserNotFound,
    NoOpenClosurePeriod
}

public enum IdeaCommentMutationStatus
{
    Success,
    IdeaNotFound,
    UserNotFound,
    CommentClosed
}

public enum IdeaMutationStatus
{
    Success,
    NotFound,
    Forbidden
}

public sealed record IdeaCreationResult(IdeaCreationStatus Status, IdeaView? Idea, IdeaSubmissionWindowView SubmissionWindow);

public sealed record IdeaMutationResult(IdeaMutationStatus Status, IdeaView? Idea);

public sealed record IdeaCommentMutationResult(
    IdeaCommentMutationStatus Status,
    IdeaCommentView? Comment,
    DateTime? CommentEndAt);

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

public sealed record IdeaSubmissionWindowView(
    string State,
    int? ClosurePeriodId,
    string? Title,
    DateTime? IdeaStartAt,
    DateTime? IdeaEndAt);

public sealed record IdeaView(
    int IdeaId,
    string Title,
    string Content,
    int AuthorUserId,
    string AuthorName,
    int DepartmentId,
    string DepartmentName,
    int ClosurePeriodId,
    string ClosurePeriodTitle,
    int AcademicYearId,
    string AcademicYearName,
    bool IsAnonymous,
    int ViewCount,
    int UpvoteCount,
    int DownvoteCount,
    DateTime CreatedAt,
    DateTime IdeaStartAt,
    DateTime IdeaEndAt,
    DateTime CommentEndAt,
    bool IsCommentOpen,
    IReadOnlyList<string> Categories,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<IdeaCommentView> Comments,
    IReadOnlyList<IdeaAttachmentView> Attachments);
