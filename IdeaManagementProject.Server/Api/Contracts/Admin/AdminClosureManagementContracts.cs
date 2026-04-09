namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record AdminAcademicYearDto(
    int AcademicYearId,
    string YearName,
    int ClosurePeriodCount);

public sealed record AdminClosurePeriodDto(
    int ClosurePeriodId,
    int AcademicYearId,
    string AcademicYearName,
    string Title,
    DateTime IdeaStartAt,
    DateTime IdeaEndAt,
    DateTime CommentEndAt,
    int IdeaCount);

public sealed record SaveAdminAcademicYearRequest(string? YearName);

public sealed record SaveAdminClosurePeriodRequest(
    int? AcademicYearId,
    string? Title,
    DateTime? IdeaStartAt,
    DateTime? IdeaEndAt,
    DateTime? CommentEndAt);

public sealed record UpdateIdeaCommentEndAtRequest(DateTime? CommentEndAt);
