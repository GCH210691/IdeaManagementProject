using IdeaManagementProject.Server.Domain.Entities;

namespace IdeaManagementProject.Server.Application.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
