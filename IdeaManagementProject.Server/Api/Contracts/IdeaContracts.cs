namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record CreateIdeaRequest(string? Title, string? Content, bool IsAnonymous, IReadOnlyList<int>? CategoryIds);

public sealed record UpdateIdeaRequest(string? Title, string? Content, bool IsAnonymous, IReadOnlyList<int>? CategoryIds);

public sealed record CreateIdeaCommentRequest(string? Content);

public sealed record IdeaCommentDto(
    int CommentId,
    int AuthorUserId,
    string AuthorName,
    string Content,
    DateTime CreatedAt);

public sealed record IdeaDto(
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
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<IdeaCommentDto> Comments);
