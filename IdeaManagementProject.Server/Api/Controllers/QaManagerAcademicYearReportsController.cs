using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/qa-manager/academic-year-reports")]
[Authorize(Roles = "QA_MANAGER")]
public class QaManagerAcademicYearReportsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public QaManagerAcademicYearReportsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("academic-years")]
    public async Task<IActionResult> GetAcademicYears(CancellationToken cancellationToken)
    {
        var academicYears = await _dbContext.AcademicYears
            .AsNoTracking()
            .OrderByDescending(x => x.AcademicYearId)
            .Select(x => new QaManagerAcademicYearOptionDto(x.AcademicYearId, x.YearName))
            .ToListAsync(cancellationToken);

        return Ok(academicYears);
    }

    [HttpGet("{academicYearId:int}")]
    public async Task<IActionResult> GetReport(int academicYearId, CancellationToken cancellationToken)
    {
        var academicYear = await _dbContext.AcademicYears
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.AcademicYearId == academicYearId, cancellationToken);

        if (academicYear is null)
        {
            return NotFound(new { message = "Academic year not found." });
        }

        var ideas = await _dbContext.Ideas
            .AsNoTracking()
            .Include(x => x.AuthorUser)
            .Include(x => x.Department)
            .Include(x => x.ClosurePeriod)
            .Include(x => x.Comments)
            .Include(x => x.Votes)
            .Where(x => x.ClosurePeriod.AcademicYearId == academicYearId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new QaManagerIdeaReportDto(
                x.IdeaId,
                x.Title,
                x.IsAnonymous ? "Anonymous" : x.AuthorUser.Name,
                x.Department.Name,
                x.ClosurePeriod.Title,
                x.IsAnonymous,
                x.ViewCount,
                x.Comments.Count,
                x.Votes.Count(v => v.Value > 0),
                x.Votes.Count(v => v.Value < 0),
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        var comments = await _dbContext.Comments
            .AsNoTracking()
            .Include(x => x.AuthorUser)
                .ThenInclude(x => x.Role)
            .Include(x => x.Idea)
                .ThenInclude(x => x.Department)
            .Include(x => x.Idea)
                .ThenInclude(x => x.ClosurePeriod)
            .Where(x => x.Idea.ClosurePeriod.AcademicYearId == academicYearId)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.CommentId)
            .Select(x => new QaManagerCommentReportDto(
                x.CommentId,
                x.IdeaId,
                x.Idea.Title,
                x.AuthorUser.Name,
                x.AuthorUser.Role.RoleName,
                x.Idea.Department.Name,
                x.Idea.ClosurePeriod.Title,
                x.Content,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new QaManagerAcademicYearReportDto(
            academicYear.AcademicYearId,
            academicYear.YearName,
            ideas,
            comments));
    }
}
