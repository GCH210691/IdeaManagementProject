using Microsoft.AspNetCore.Http;

namespace IdeaManagementProject.Server.Application.Services;

public interface IIdeaAttachmentStorage
{
    Task<StoredIdeaAttachment> SaveAsync(int ideaId, IFormFile file, CancellationToken cancellationToken = default);
    Task<StoredIdeaAttachmentFile?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default);
}

public sealed record StoredIdeaAttachment(string RelativePath, string ContentType);

public sealed record StoredIdeaAttachmentFile(Stream Stream, string ContentType);
