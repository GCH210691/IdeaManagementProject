using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminClosureManagementController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminClosureManagementController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("academic-years")]
    public async Task<IActionResult> GetAcademicYears(CancellationToken cancellationToken)
    {
        var academicYears = await _dbContext.AcademicYears
            .AsNoTracking()
            .OrderByDescending(x => x.AcademicYearId)
            .Select(x => new AdminAcademicYearDto(
                x.AcademicYearId,
                x.YearName,
                x.ClosurePeriods.Count))
            .ToListAsync(cancellationToken);

        return Ok(academicYears);
    }

    [HttpPost("academic-years")]
    public async Task<IActionResult> CreateAcademicYear([FromBody] SaveAdminAcademicYearRequest? request, CancellationToken cancellationToken)
    {
        var yearName = NormalizeName(request?.YearName);
        if (yearName is null)
        {
            return BadRequest(new { message = "Academic year name is required." });
        }

        var duplicateExists = await _dbContext.AcademicYears
            .AsNoTracking()
            .AnyAsync(x => x.YearName == yearName, cancellationToken);

        if (duplicateExists)
        {
            return Conflict(new { message = "Academic year name already exists." });
        }

        var academicYear = new AcademicYear
        {
            YearName = yearName,
        };

        _dbContext.AcademicYears.Add(academicYear);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(201, new AdminAcademicYearDto(academicYear.AcademicYearId, academicYear.YearName, 0));
    }

    [HttpPut("academic-years/{academicYearId:int}")]
    public async Task<IActionResult> UpdateAcademicYear(int academicYearId, [FromBody] SaveAdminAcademicYearRequest? request, CancellationToken cancellationToken)
    {
        var yearName = NormalizeName(request?.YearName);
        if (yearName is null)
        {
            return BadRequest(new { message = "Academic year name is required." });
        }

        var academicYear = await _dbContext.AcademicYears
            .Include(x => x.ClosurePeriods)
            .FirstOrDefaultAsync(x => x.AcademicYearId == academicYearId, cancellationToken);

        if (academicYear is null)
        {
            return NotFound(new { message = "Academic year not found." });
        }

        var duplicateExists = await _dbContext.AcademicYears
            .AsNoTracking()
            .AnyAsync(x => x.AcademicYearId != academicYearId && x.YearName == yearName, cancellationToken);

        if (duplicateExists)
        {
            return Conflict(new { message = "Academic year name already exists." });
        }

        academicYear.YearName = yearName;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AdminAcademicYearDto(
            academicYear.AcademicYearId,
            academicYear.YearName,
            academicYear.ClosurePeriods.Count));
    }

    [HttpDelete("academic-years/{academicYearId:int}")]
    public async Task<IActionResult> DeleteAcademicYear(int academicYearId, CancellationToken cancellationToken)
    {
        var academicYear = await _dbContext.AcademicYears
            .Include(x => x.ClosurePeriods)
            .FirstOrDefaultAsync(x => x.AcademicYearId == academicYearId, cancellationToken);

        if (academicYear is null)
        {
            return NotFound(new { message = "Academic year not found." });
        }

        if (academicYear.ClosurePeriods.Count > 0)
        {
            return Conflict(new { message = "Academic year cannot be deleted while it still has closure periods." });
        }

        _dbContext.AcademicYears.Remove(academicYear);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("closure-periods")]
    public async Task<IActionResult> GetClosurePeriods(CancellationToken cancellationToken)
    {
        var closurePeriods = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Include(x => x.AcademicYear)
            .OrderByDescending(x => x.IdeaStartAt)
            .Select(x => new AdminClosurePeriodDto(
                x.ClosurePeriodId,
                x.AcademicYearId,
                x.AcademicYear.YearName,
                x.Title,
                x.IdeaStartAt,
                x.IdeaEndAt,
                x.CommentEndAt,
                x.Ideas.Count))
            .ToListAsync(cancellationToken);

        return Ok(closurePeriods);
    }

    [HttpPost("closure-periods")]
    public async Task<IActionResult> CreateClosurePeriod([FromBody] SaveAdminClosurePeriodRequest? request, CancellationToken cancellationToken)
    {
        var validationError = await ValidateClosurePeriodRequestAsync(request, null, cancellationToken);
        if (validationError is not null)
        {
            return validationError;
        }

        var closurePeriod = new ClosurePeriod
        {
            AcademicYearId = request!.AcademicYearId!.Value,
            Title = request.Title!.Trim(),
            IdeaStartAt = NormalizeToClosureDateTime(request.IdeaStartAt!.Value),
            IdeaEndAt = NormalizeToClosureDateTime(request.IdeaEndAt!.Value),
            CommentEndAt = NormalizeToClosureDateTime(request.CommentEndAt!.Value),
        };

        _dbContext.ClosurePeriods.Add(closurePeriod);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var created = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Include(x => x.AcademicYear)
            .Where(x => x.ClosurePeriodId == closurePeriod.ClosurePeriodId)
            .Select(x => new AdminClosurePeriodDto(
                x.ClosurePeriodId,
                x.AcademicYearId,
                x.AcademicYear.YearName,
                x.Title,
                x.IdeaStartAt,
                x.IdeaEndAt,
                x.CommentEndAt,
                x.Ideas.Count))
            .SingleAsync(cancellationToken);

        return StatusCode(201, created);
    }

    [HttpPut("closure-periods/{closurePeriodId:int}")]
    public async Task<IActionResult> UpdateClosurePeriod(int closurePeriodId, [FromBody] SaveAdminClosurePeriodRequest? request, CancellationToken cancellationToken)
    {
        var closurePeriod = await _dbContext.ClosurePeriods
            .Include(x => x.AcademicYear)
            .Include(x => x.Ideas)
            .FirstOrDefaultAsync(x => x.ClosurePeriodId == closurePeriodId, cancellationToken);

        if (closurePeriod is null)
        {
            return NotFound(new { message = "Closure period not found." });
        }

        var validationError = await ValidateClosurePeriodRequestAsync(request, closurePeriodId, cancellationToken);
        if (validationError is not null)
        {
            return validationError;
        }

        closurePeriod.AcademicYearId = request!.AcademicYearId!.Value;
        closurePeriod.Title = request.Title!.Trim();
        closurePeriod.IdeaStartAt = NormalizeToClosureDateTime(request.IdeaStartAt!.Value);
        closurePeriod.IdeaEndAt = NormalizeToClosureDateTime(request.IdeaEndAt!.Value);
        closurePeriod.CommentEndAt = NormalizeToClosureDateTime(request.CommentEndAt!.Value);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var updated = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .Include(x => x.AcademicYear)
            .Where(x => x.ClosurePeriodId == closurePeriodId)
            .Select(x => new AdminClosurePeriodDto(
                x.ClosurePeriodId,
                x.AcademicYearId,
                x.AcademicYear.YearName,
                x.Title,
                x.IdeaStartAt,
                x.IdeaEndAt,
                x.CommentEndAt,
                x.Ideas.Count))
            .SingleAsync(cancellationToken);

        return Ok(updated);
    }

    [HttpPatch("ideas/{ideaId:int}/comment-end-at")]
    public async Task<IActionResult> UpdateIdeaCommentEndAt(int ideaId, [FromBody] UpdateIdeaCommentEndAtRequest? request, CancellationToken cancellationToken)
    {
        if (request?.CommentEndAt is null)
            return BadRequest(new { message = "CommentEndAt is required." });

        var idea = await _dbContext.Ideas
            .Include(x => x.ClosurePeriod)
            .FirstOrDefaultAsync(x => x.IdeaId == ideaId, cancellationToken);

        if (idea is null)
            return NotFound(new { message = "Idea not found." });

        if (idea.ClosurePeriod is null)
            return UnprocessableEntity(new { message = "This idea has no associated closure period." });

        idea.ClosurePeriod.CommentEndAt = request.CommentEndAt.Value.ToUniversalTime();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { ideaId, commentEndAt = idea.ClosurePeriod.CommentEndAt });
    }

    [HttpDelete("closure-periods/{closurePeriodId:int}")]
    public async Task<IActionResult> DeleteClosurePeriod(int closurePeriodId, CancellationToken cancellationToken)
    {
        var closurePeriod = await _dbContext.ClosurePeriods
            .Include(x => x.Ideas)
            .FirstOrDefaultAsync(x => x.ClosurePeriodId == closurePeriodId, cancellationToken);

        if (closurePeriod is null)
        {
            return NotFound(new { message = "Closure period not found." });
        }

        if (closurePeriod.Ideas.Count > 0)
        {
            return Conflict(new { message = "Closure period cannot be deleted while ideas are linked to it." });
        }

        _dbContext.ClosurePeriods.Remove(closurePeriod);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<IActionResult?> ValidateClosurePeriodRequestAsync(
        SaveAdminClosurePeriodRequest? request,
        int? currentClosurePeriodId,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest(new { message = "Closure period data is required." });
        }

        var title = NormalizeName(request.Title);
        if (title is null)
        {
            return BadRequest(new { message = "Closure period title is required." });
        }

        if (request.AcademicYearId is null || request.AcademicYearId <= 0)
        {
            return BadRequest(new { message = "Academic year is required." });
        }

        if (request.IdeaStartAt is null || request.IdeaEndAt is null || request.CommentEndAt is null)
        {
            return BadRequest(new { message = "Idea start, idea end, and comment end are required." });
        }

        var ideaStartAt = NormalizeToClosureDateTime(request.IdeaStartAt.Value);
        var ideaEndAt = NormalizeToClosureDateTime(request.IdeaEndAt.Value);
        var commentEndAt = NormalizeToClosureDateTime(request.CommentEndAt.Value);

        if (ideaStartAt >= ideaEndAt)
        {
            return BadRequest(new { message = "Idea start must be before idea end." });
        }

        if (commentEndAt < ideaEndAt)
        {
            return BadRequest(new { message = "Comment end must be after or equal to idea end." });
        }

        var academicYearExists = await _dbContext.AcademicYears
            .AsNoTracking()
            .AnyAsync(x => x.AcademicYearId == request.AcademicYearId.Value, cancellationToken);

        if (!academicYearExists)
        {
            return BadRequest(new { message = "Academic year not found." });
        }

        var overlapExists = await _dbContext.ClosurePeriods
            .AsNoTracking()
            .AnyAsync(
                x => x.ClosurePeriodId != currentClosurePeriodId
                    && ideaStartAt <= x.IdeaEndAt
                    && x.IdeaStartAt <= ideaEndAt,
                cancellationToken);

        if (overlapExists)
        {
            return Conflict(new { message = "Idea submission windows cannot overlap." });
        }

        return null;
    }

    private static string? NormalizeName(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static DateTime NormalizeToClosureDateTime(DateTime value)
    {
        return DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
    }
}
