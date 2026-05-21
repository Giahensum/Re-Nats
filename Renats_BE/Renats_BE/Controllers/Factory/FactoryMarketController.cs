using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Factory;

[ApiController]
[Route("api/factory/market")]
[Authorize(Roles = "FACTORY")]
public class FactoryMarketController : ControllerBase
{
    private readonly AppDbContext _db;
    public FactoryMarketController(AppDbContext db) => _db = db;

    // GET /api/factory/market/batches?material=&page=1&pageSize=12
    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches(
        [FromQuery] string? material,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = _db.InventoryBatches
            .Where(b => b.Status == BatchStatus.LISTED || b.Status == BatchStatus.BIDDING)
            .Include(b => b.Depot)
            .Include(b => b.Images)
            .AsQueryable();

        if (!string.IsNullOrEmpty(material) &&
            Enum.TryParse<MaterialType>(material, ignoreCase: true, out var mat))
        {
            query = query.Where(b => b.MaterialType == mat);
        }

        var total = await query.CountAsync();

        var batches = await query
            .OrderByDescending(b => b.ListedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new
            {
                id = b.Id,
                batchCode = b.BatchCode,
                materialType = b.MaterialType.ToString(),
                estimatedWeightKg = b.EstimatedWeightKg,
                unitPrice = b.UnitPrice,
                moisturePercentage = b.MoisturePercentage,
                purityPercentage = b.PurityPercentage,
                description = b.Description,
                thumbnailImageUrl = b.ThumbnailImageUrl,
                status = b.Status.ToString(),
                listedAt = b.ListedAt,
                depot = new
                {
                    id = b.Depot.Id,
                    companyName = b.Depot.CompanyName,
                    address = b.Depot.Address,
                    city = b.Depot.City,
                    province = b.Depot.Province,
                    reputationScore = b.Depot.ReputationScore,
                    totalTransactions = b.Depot.TotalTransactions,
                    latitude = b.Depot.Latitude,
                    longitude = b.Depot.Longitude
                },
                imageCount = b.Images.Count
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, data = batches });
    }

    // GET /api/factory/market/batches/{id}?factoryId=... (factoryId dùng để check premium)
    [HttpGet("batches/{id}")]
    public async Task<IActionResult> GetBatchDetail(Guid id, [FromQuery] Guid? factoryId)
    {
        var batch = await _db.InventoryBatches
            .Where(b => b.Id == id)
            .Include(b => b.Depot)
            .Include(b => b.Images)
            .FirstOrDefaultAsync();

        if (batch is null) return NotFound();

        // Kiểm tra xem factory có premium không để unlock lịch sử
        bool isPremium = false;
        if (factoryId.HasValue)
        {
            var factory = await _db.Factories.FindAsync(factoryId.Value);
            isPremium = factory?.IsPremium == true &&
                        factory.PremiumExpiresAt > DateTime.UtcNow;
        }

        // Lịch sử giao dịch của depot (chỉ cho premium)
        List<object>? depotHistory = null;
        if (isPremium)
        {
            depotHistory = await _db.BatchOrders
                .Where(o => o.Batch.DepotId == batch.DepotId && o.Status == BatchStatus.VERIFIED)
                .OrderByDescending(o => o.CreatedAt)
                .Take(10)
                .Select(o => (object)new
                {
                    date = o.CreatedAt,
                    materialType = o.Batch.MaterialType.ToString(),
                    weightKg = o.Batch.ActualWeightKg,
                    status = o.Status.ToString()
                })
                .ToListAsync();
        }

        return Ok(new
        {
            id = batch.Id,
            batchCode = batch.BatchCode,
            materialType = batch.MaterialType.ToString(),
            estimatedWeightKg = batch.EstimatedWeightKg,
            actualWeightKg = batch.ActualWeightKg,
            unitPrice = batch.UnitPrice,
            moisturePercentage = batch.MoisturePercentage,
            purityPercentage = batch.PurityPercentage,
            description = batch.Description,
            thumbnailImageUrl = batch.ThumbnailImageUrl,
            status = batch.Status.ToString(),
            listedAt = batch.ListedAt,
            images = batch.Images.Select(i => i.ImageUrl).ToList(),
            depot = new
            {
                id = batch.Depot.Id,
                companyName = batch.Depot.CompanyName,
                address = batch.Depot.Address,
                city = batch.Depot.City,
                province = batch.Depot.Province,
                contactPerson = batch.Depot.ContactPerson,
                contactPhone = batch.Depot.ContactPhone,
                reputationScore = batch.Depot.ReputationScore,
                totalTransactions = batch.Depot.TotalTransactions,
                latitude = batch.Depot.Latitude,
                longitude = batch.Depot.Longitude
            },
            isPremium,
            depotHistory
        });
    }
}
