using Microsoft.AspNetCore.Http;

namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record CreateIdeaRequest(
    string? Title,
    string? Content,
    bool IsAnonymous,
    IReadOnlyList<int>? CategoryIds,
    IReadOnlyList<IFormFile>? Files);

public sealed record UpdateIdeaRequest(string? Title, string? Content, bool IsAnonymous, IReadOnlyList<int>? CategoryIds);

public sealed record CreateIdeaCommentRequest(string? Content);

public sealed record CastIdeaVoteRequest(int? Value);

public sealed record IdeaSubmissionWindowDto(
    string State,
    int? ClosurePeriodId,
    string? Title,
    DateTime? IdeaStartAt,
    DateTime? IdeaEndAt);

public sealed record IdeaCommentDto(
    int CommentId,
    int AuthorUserId,
    string AuthorName,
    string AuthorRole,
    string Content,
    DateTime CreatedAt);

public sealed record IdeaVoteSummaryDto(
    int UpvoteCount,
    int DownvoteCount,
    int CurrentUserVote);

public sealed record IdeaAttachmentDto(
    int AttachmentId,
    string OriginalName,
    string ContentType,
    DateTime UploadedAt);

public sealed record IdeaDto(
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
    int CurrentUserVote,
    DateTime CreatedAt,
    DateTime IdeaStartAt,
    DateTime IdeaEndAt,
    DateTime CommentEndAt,
    bool IsCommentOpen,
    IReadOnlyList<string> Categories,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<IdeaCommentDto> Comments,
    IReadOnlyList<IdeaAttachmentDto> Attachments);
