using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IdeaManagementProject.Server.Api.Contracts;
using IdeaManagementProject.Server.Domain.Entities;
using IdeaManagementProject.Server.Infrastructure.Persistence;

namespace IdeaManagementProject.Server.Api.Controllers;

[ApiController]
[Route("api/qa-manager/categories")]
[Authorize(Roles = "QA_MANAGER")]
public class QaManagerCategoriesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public QaManagerCategoriesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _dbContext.Categories
            .AsNoTracking()
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Idea)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(categories.Select(ToDto).ToList());
    }

    [HttpGet("{categoryId:int}")]
    public async Task<IActionResult> GetCategory(int categoryId, CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .AsNoTracking()
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Idea)
            .FirstOrDefaultAsync(x => x.CategoryId == categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        return Ok(ToDto(category));
    }

    [HttpPost]
    public async Task<IActionResult> CreateCategory([FromBody] CreateQaManagerCategoryRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Category name is required." });
        }

        var name = request.Name.Trim();
        var exists = await _dbContext.Categories
            .AsNoTracking()
            .AnyAsync(x => x.Name == name, cancellationToken);

        if (exists)
        {
            return Conflict(new { message = "Category name already exists." });
        }

        var category = new Category
        {
            Name = name,
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(201, new QaManagerCategoryDto(category.CategoryId, category.Name, []));
    }

    [HttpPut("{categoryId:int}")]
    public async Task<IActionResult> UpdateCategory(int categoryId, [FromBody] UpdateQaManagerCategoryRequest? request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { message = "Category name is required." });
        }

        var category = await _dbContext.Categories
            .Include(x => x.IdeaCategories)
                .ThenInclude(x => x.Idea)
            .FirstOrDefaultAsync(x => x.CategoryId == categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        var name = request.Name.Trim();
        var nameExists = await _dbContext.Categories
            .AsNoTracking()
            .AnyAsync(x => x.CategoryId != categoryId && x.Name == name, cancellationToken);

        if (nameExists)
        {
            return Conflict(new { message = "Category name already exists." });
        }

        category.Name = name;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToDto(category));
    }

    [HttpDelete("{categoryId:int}")]
    public async Task<IActionResult> DeleteCategory(int categoryId, CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(x => x.CategoryId == categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        var isUsed = await _dbContext.IdeaCategories
            .AsNoTracking()
            .AnyAsync(x => x.CategoryId == categoryId, cancellationToken);

        if (isUsed)
        {
            return Conflict(new { message = "Category is assigned to ideas and cannot be deleted." });
        }

        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private static QaManagerCategoryDto ToDto(Category category)
    {
        return new QaManagerCategoryDto(
            category.CategoryId,
            category.Name,
            category.IdeaCategories
                .Select(x => new QaManagerCategoryIdeaDto(x.IdeaId, x.Idea.Title))
                .OrderBy(x => x.Title)
                .ToList());
    }
}
