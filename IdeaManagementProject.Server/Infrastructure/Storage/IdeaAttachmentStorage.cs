using Microsoft.AspNetCore.Http;
using IdeaManagementProject.Server.Application.Services;

namespace IdeaManagementProject.Server.Infrastructure.Storage;

public class IdeaAttachmentStorage : IIdeaAttachmentStorage
{
    private readonly string _rootPath;

    public IdeaAttachmentStorage(IHostEnvironment hostEnvironment)
    {
        _rootPath = Path.Combine(hostEnvironment.ContentRootPath, "App_Data", "idea-attachments");
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<StoredIdeaAttachment> SaveAsync(int ideaId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var ideaFolder = Path.Combine(_rootPath, $"idea-{ideaId}");
        Directory.CreateDirectory(ideaFolder);

        var extension = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(ideaFolder, storedFileName);

        await using (var stream = File.Create(absolutePath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativePath = Path.Combine($"idea-{ideaId}", storedFileName);
        var contentType = string.IsNullOrWhiteSpace(file.ContentType)
            ? "application/octet-stream"
            : file.ContentType;

        return new StoredIdeaAttachment(relativePath, contentType);
    }

    public Task<StoredIdeaAttachmentFile?> OpenReadAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var sanitizedRelativePath = relativePath.Replace('/', Path.DirectorySeparatorChar);
        var absolutePath = Path.GetFullPath(Path.Combine(_rootPath, sanitizedRelativePath));
        var fullRootPath = Path.GetFullPath(_rootPath);

        if (!absolutePath.StartsWith(fullRootPath, StringComparison.OrdinalIgnoreCase) || !File.Exists(absolutePath))
        {
            return Task.FromResult<StoredIdeaAttachmentFile?>(null);
        }

        Stream stream = File.OpenRead(absolutePath);
        return Task.FromResult<StoredIdeaAttachmentFile?>(new StoredIdeaAttachmentFile(stream, "application/octet-stream"));
    }
}
