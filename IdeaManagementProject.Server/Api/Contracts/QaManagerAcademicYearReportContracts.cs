namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record QaManagerAcademicYearOptionDto(
    int AcademicYearId,
    string YearName);

public sealed record QaManagerIdeaReportDto(
    int IdeaId,
    string Title,
    string AuthorName,
    string DepartmentName,
    string ClosurePeriodTitle,
    bool IsAnonymous,
    int ViewCount,
    int CommentCount,
    int UpvoteCount,
    int DownvoteCount,
    DateTime CreatedAt);

public sealed record QaManagerCommentReportDto(
    int CommentId,
    int IdeaId,
    string IdeaTitle,
    string AuthorName,
    string AuthorRole,
    string DepartmentName,
    string ClosurePeriodTitle,
    string Content,
    DateTime CreatedAt);

public sealed record QaManagerAcademicYearReportDto(
    int AcademicYearId,
    string AcademicYearName,
    IReadOnlyList<QaManagerIdeaReportDto> Ideas,
    IReadOnlyList<QaManagerCommentReportDto> Comments);
