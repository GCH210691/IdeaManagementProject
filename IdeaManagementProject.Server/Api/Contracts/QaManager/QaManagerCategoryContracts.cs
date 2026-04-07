namespace IdeaManagementProject.Server.Api.Contracts;

public sealed record QaManagerCategoryIdeaDto(int IdeaId, string Title);

public sealed record QaManagerCategoryDto(
    int CategoryId,
    string Name,
    IReadOnlyList<QaManagerCategoryIdeaDto> Ideas);

public sealed record CreateQaManagerCategoryRequest(string? Name);

public sealed record UpdateQaManagerCategoryRequest(string? Name);
