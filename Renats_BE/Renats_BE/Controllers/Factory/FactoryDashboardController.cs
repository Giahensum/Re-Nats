using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Factory;

[ApiController]
[Route("api/factory/dashboard")]
[Authorize(Roles = "FACTORY")]
public class FactoryDashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public FactoryDashboardController(AppDbContext db) => _db = db;

    // GET /api/factory/dashboard/kpis?factoryId=...
    [HttpGet("kpis")]
    public async Task<IActionResult> GetKpis([FromQuery] Guid factoryId)
    {
        // Tổng KL thực tế đã nhập kho (đơn hàng VERIFIED)
        var totalInboundKg = await _db.BatchOrders
            .Where(o => o.FactoryId == factoryId && o.Status == BatchStatus.VERIFIED)
            .Include(o => o.Batch)
            .SumAsync(o => (decimal?)(o.Batch.ActualWeightKg ?? o.Batch.EstimatedWeightKg)) ?? 0;

        // Tỷ lệ tạp chất trung bình
        var avgImpurity = await _db.WeightVerifications
            .Where(v => v.BatchOrder.FactoryId == factoryId && v.DifferencePercentage.HasValue)
            .AverageAsync(v => (decimal?)v.DifferencePercentage) ?? 0;

        // Số xe đang trên đường
        var inTransitCount = await _db.TransportJobs
            .Where(t => t.BatchOrder.FactoryId == factoryId &&
                        (t.Status == TransportStatus.PICKED_UP || t.Status == TransportStatus.ON_THE_WAY))
            .CountAsync();

        return Ok(new
        {
            totalInboundKg = Math.Round(totalInboundKg / 1000, 1), // convert to tons
            avgImpurityRate = Math.Round(avgImpurity, 1),
            inTransitCount
        });
    }

    // GET /api/factory/dashboard/transactions?factoryId=...
    [HttpGet("transactions")]
    public async Task<IActionResult> GetRecentTransactions([FromQuery] Guid factoryId)
    {
        var transactions = await _db.BatchOrders
            .Where(o => o.FactoryId == factoryId)
            .Include(o => o.Batch).ThenInclude(b => b.Depot)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new
            {
                id = o.Id,
                batchCode = o.Batch.BatchCode,
                supplierName = o.Batch.Depot.CompanyName,
                materialType = o.Batch.MaterialType.ToString(),
                weightKg = o.Batch.ActualWeightKg ?? o.Batch.EstimatedWeightKg,
                date = o.CreatedAt,
                status = o.Status.ToString()
            })
            .ToListAsync();

        return Ok(transactions);
    }

    // GET /api/factory/dashboard/material-breakdown?factoryId=...
    [HttpGet("material-breakdown")]
    public async Task<IActionResult> GetMaterialBreakdown([FromQuery] Guid factoryId)
    {
        var breakdown = await _db.BatchOrders
            .Where(o => o.FactoryId == factoryId)
            .Include(o => o.Batch)
            .GroupBy(o => o.Batch.MaterialType)
            .Select(g => new
            {
                materialType = g.Key.ToString(),
                totalKg = g.Sum(o => o.Batch.ActualWeightKg ?? o.Batch.EstimatedWeightKg)
            })
            .ToListAsync();

        return Ok(breakdown);
    }

    // GET /api/factory/dashboard/chart?factoryId=...&range=week
    [HttpGet("chart")]
    public async Task<IActionResult> GetChartData([FromQuery] Guid factoryId, [FromQuery] string range = "week")
    {
        var from = range switch
        {
            "day" => DateTime.UtcNow.AddDays(-1),
            "month" => DateTime.UtcNow.AddMonths(-1),
            _ => DateTime.UtcNow.AddDays(-7)
        };

        var orders = await _db.BatchOrders
            .Where(o => o.FactoryId == factoryId && o.CreatedAt >= from)
            .Include(o => o.Batch)
            .ToListAsync();

        var grouped = orders
            .GroupBy(o => o.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                date = g.Key.ToString("yyyy-MM-dd"),
                totalKg = g.Sum(o => o.Batch.ActualWeightKg ?? o.Batch.EstimatedWeightKg)
            });

        return Ok(grouped);
    }
}
