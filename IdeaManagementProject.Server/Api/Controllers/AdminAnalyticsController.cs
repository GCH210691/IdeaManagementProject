using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize(Roles = "ADMIN")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminAnalyticsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Returns overview stats: total accounts, ideas, departments, categories,
    /// and growth percentages compared to the previous month.
    /// GET /api/admin/analytics/overview
    /// </summary>
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var startOfCurrentMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfCurrentMonth.AddMonths(-1);

        var totalAccounts = await _dbContext.Users.CountAsync(cancellationToken);
        var totalIdeas = await _dbContext.Ideas.CountAsync(cancellationToken);
        var totalDepartments = await _dbContext.Departments.CountAsync(cancellationToken);
        var totalCategories = await _dbContext.Categories.CountAsync(cancellationToken);

        // Accounts created this month vs last month
        var accountsThisMonth = await _dbContext.Users
            .CountAsync(x => x.AcceptedTermsAt >= startOfCurrentMonth, cancellationToken);
        var accountsLastMonth = await _dbContext.Users
            .CountAsync(x => x.AcceptedTermsAt >= startOfLastMonth && x.AcceptedTermsAt < startOfCurrentMonth, cancellationToken);

        // Ideas created this month vs last month
        var ideasThisMonth = await _dbContext.Ideas
            .CountAsync(x => x.CreatedAt >= startOfCurrentMonth, cancellationToken);
        var ideasLastMonth = await _dbContext.Ideas
            .CountAsync(x => x.CreatedAt >= startOfLastMonth && x.CreatedAt < startOfCurrentMonth, cancellationToken);

        var accountsGrowth = accountsLastMonth == 0
            ? (accountsThisMonth > 0 ? 100.0 : 0.0)
            : Math.Round((accountsThisMonth - accountsLastMonth) / (double)accountsLastMonth * 100, 1);

        var ideasGrowth = ideasLastMonth == 0
            ? (ideasThisMonth > 0 ? 100.0 : 0.0)
            : Math.Round((ideasThisMonth - ideasLastMonth) / (double)ideasLastMonth * 100, 1);

        return Ok(new AnalyticsOverviewDto(
            totalAccounts,
            totalIdeas,
            totalDepartments,
            totalCategories,
            accountsGrowth,
            ideasGrowth));
    }

    /// <summary>
    /// Returns user count grouped by role (used for the donut chart).
    /// GET /api/admin/analytics/role-distribution
    /// </summary>
    [HttpGet("role-distribution")]
    public async Task<IActionResult> GetRoleDistribution(CancellationToken cancellationToken)
    {
        var data = await _dbContext.Users
            .AsNoTracking()
            .GroupBy(x => x.Role.RoleName)
            .Select(g => new
            {
                RoleName = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var result = data
            .Select(x => new RoleDistributionItemDto(x.RoleName, x.Count))
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// Returns idea count grouped by category (used for the bar chart).
    /// GET /api/admin/analytics/ideas-by-category
    /// </summary>
    [HttpGet("ideas-by-category")]
    public async Task<IActionResult> GetIdeasByCategory(CancellationToken cancellationToken)
    {
        var data = await _dbContext.IdeaCategories
            .AsNoTracking()
            .GroupBy(x => x.Category.Name)
            .Select(g => new
            {
                CategoryName = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var result = data
            .Select(x => new IdeasByCategoryItemDto(x.CategoryName, x.Count))
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// Returns idea count grouped by department.
    /// GET /api/admin/analytics/ideas-by-department
    /// </summary>
    [HttpGet("ideas-by-department")]    
    public async Task<IActionResult> GetIdeasByDepartment(CancellationToken cancellationToken)
    {
        var data = await _dbContext.Ideas
            .AsNoTracking()
            .Where(x => x.Department != null)
            .GroupBy(x => x.Department.Name)
            .Select(g => new
            {
                DepartmentName = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        // Map sang DTO ở phía client sau khi đã ToListAsync
        var result = data
            .Select(x => new IdeasByDepartmentItemDto(x.DepartmentName, x.Count))
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// Returns monthly idea submission frequency for a given year (used for the line chart).
    /// All 12 months are always returned; months with no ideas default to 0.
    /// GET /api/admin/analytics/post-frequency?year=2026
    /// </summary>
    [HttpGet("post-frequency")]
    public async Task<IActionResult> GetPostFrequency(
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;

        var raw = await _dbContext.Ideas
            .AsNoTracking()
            .Where(x => x.CreatedAt.Year == targetYear)
            .GroupBy(x => x.CreatedAt.Month)
            .Select(g => new { Month = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        // Fill all 12 months; months with no data default to 0
        var items = Enumerable.Range(1, 12)
            .Select(m =>
            {
                var found = raw.FirstOrDefault(x => x.Month == m);
                var label = new DateTime(targetYear, m, 1).ToString("MMM");
                return new PostFrequencyItemDto(label, found?.Count ?? 0);
            })
            .ToList();

        return Ok(new AnalyticsPostFrequencyResponse(items));
    }
}
