using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;

namespace Renats_BE.Controllers.Factory;

[ApiController]
[Route("api/factory/partners")]
[Authorize(Roles = "FACTORY")]
public class FactoryPartnerController : ControllerBase
{
    private readonly AppDbContext _db;
    public FactoryPartnerController(AppDbContext db) => _db = db;

    // GET /api/factory/partners?factoryId=
    [HttpGet]
    public async Task<IActionResult> GetPartners([FromQuery] Guid factoryId)
    {
        var factory = await _db.Factories.FindAsync(factoryId);
        bool isPremium = factory?.IsPremium == true && factory.PremiumExpiresAt > DateTime.UtcNow;

        var depots = await _db.Depots
            .Include(d => d.User)
            .OrderByDescending(d => d.ReputationScore)
            .Select(d => new
            {
                id = d.Id,
                companyName = d.CompanyName,
                address = d.Address,
                city = d.City,
                province = d.Province,
                contactPerson = isPremium ? d.ContactPerson : null,
                contactPhone = isPremium ? d.ContactPhone : null,
                reputationScore = isPremium ? (int?)d.ReputationScore : null,
                totalTransactions = d.TotalTransactions,
                latitude = d.Latitude,
                longitude = d.Longitude,
                isPremiumLocked = !isPremium
            })
            .ToListAsync();

        return Ok(new { isPremium, data = depots });
    }

    // GET /api/factory/partners/{id}?factoryId=
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPartnerDetail(Guid id, [FromQuery] Guid factoryId)
    {
        var factory = await _db.Factories.FindAsync(factoryId);
        bool isPremium = factory?.IsPremium == true && factory.PremiumExpiresAt > DateTime.UtcNow;

        var depot = await _db.Depots
            .Where(d => d.Id == id)
            .Include(d => d.Batches)
            .FirstOrDefaultAsync();

        if (depot is null) return NotFound();

        // Lịch sử giao dịch chỉ cho premium
        List<object>? history = null;
        if (isPremium)
        {
            history = await _db.BatchOrders
                .Where(o => o.Batch.DepotId == id)
                .Include(o => o.Batch)
                .OrderByDescending(o => o.CreatedAt)
                .Take(20)
                .Select(o => (object)new
                {
                    date = o.CreatedAt,
                    materialType = o.Batch.MaterialType.ToString(),
                    weightKg = o.Batch.ActualWeightKg,
                    totalAmount = o.TotalAmount,
                    status = o.Status.ToString()
                })
                .ToListAsync();
        }

        return Ok(new
        {
            id = depot.Id,
            companyName = depot.CompanyName,
            address = depot.Address,
            city = depot.City,
            province = depot.Province,
            contactPerson = isPremium ? depot.ContactPerson : null,
            contactPhone = isPremium ? depot.ContactPhone : null,
            reputationScore = isPremium ? (int?)depot.ReputationScore : null,
            totalTransactions = depot.TotalTransactions,
            latitude = depot.Latitude,
            longitude = depot.Longitude,
            activeBatches = depot.Batches.Count(b => b.Status == Models.Enums.BatchStatus.LISTED),
            isPremium,
            history
        });
    }
}
