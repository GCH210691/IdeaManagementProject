namespace IdeaManagementProject.Server.Domain.Entities;

public class Attachment
{
    public int AttachmentId { get; set; }
    public int IdeaId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public DateTime UploadedAt { get; set; }

    public Idea Idea { get; set; } = null!;
}
