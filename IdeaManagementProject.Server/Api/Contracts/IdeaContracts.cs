namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record CreateIdeaRequest(string? Title, string? Content, bool IsAnonymous);

public sealed record UpdateIdeaRequest(string? Title, string? Content, bool IsAnonymous);

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
    DateTime CreatedAt);
