namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record AnalyticsOverviewDto(
    int TotalAccounts,
    int TotalIdeas,
    int TotalDepartments,
    int TotalCategories,
    double AccountsGrowthPercent,
    double IdeasGrowthPercent);

public sealed record RoleDistributionItemDto(
    string RoleName,
    int Count);

public sealed record IdeasByCategoryItemDto(
    string CategoryName,
    int Count);

public sealed record IdeasByDepartmentItemDto(
    string DepartmentName,
    int Count);

public sealed record PostFrequencyItemDto(
    string Period,
    int IdeasCount);

public sealed record AnalyticsPostFrequencyResponse(
    IReadOnlyList<PostFrequencyItemDto> Items);
