namespace IdeaManagementProject.Server.Application.Services;

public class BcryptPasswordHasher : IPasswordHasher
{
    public string HashPassword(string plainTextPassword)
    {
        return BCrypt.Net.BCrypt.HashPassword(plainTextPassword);
    }

    public bool VerifyPassword(string plainTextPassword, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(plainTextPassword, passwordHash);
    }
}
