using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Depot;

/// <summary>
/// Dashboard stats và thông tin tổng quan cho DEPOT
/// </summary>
[ApiController]
[Route("api/depot/dashboard")]
[Authorize(Roles = "DEPOT")]
public class DepotDashboardController : ControllerBase
{
    private readonly AppDbContext _db;
    public DepotDashboardController(AppDbContext db) => _db = db;

    // GET /api/depot/dashboard/stats — Tổng quan kho
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        // Lấy depotId từ claim (userId trong JWT = Depot.UserId)
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null && user.Role == UserRole.DEPOT)
            {
                depot = new Renats_BE.Models.Depot
                {
                    UserId = user.Id,
                    CompanyName = user.FullName ?? "Điểm thu gom Re-Nats",
                    ContactPerson = user.FullName ?? "Người đại diện",
                    ContactPhone = user.Phone ?? "0987654321",
                    Address = null,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Depots.Add(depot);
                await _db.SaveChangesAsync();
            }
            else
            {
                return NotFound("Không tìm thấy thông tin kho hợp lệ");
            }
        }

        // Số đơn mới chờ xác nhận (PENDING)
        var newRequests = await _db.PickupRequests
            .CountAsync(r => (r.AssignedDepotId == depot.Id || r.AssignedDepotId == null)
                          && r.Status == PickupRequestStatus.PENDING);

        // Tổng tồn kho (từ PickupResults DONE, trừ BatchOrders đã giao)
        var totalInKg = await _db.PickupResults
            .Where(r => r.PickupRequest.AssignedDepotId == depot.Id
                     && r.PickupRequest.Status == PickupRequestStatus.DONE)
            .SumAsync(r => r.WeightKg);

        var totalOutKg = await _db.InventoryBatches
            .Where(b => b.DepotId == depot.Id
                     && (b.Status == BatchStatus.DELIVERED || b.Status == BatchStatus.VERIFIED))
            .SumAsync(b => b.ActualWeightKg ?? b.EstimatedWeightKg);

        // Số lô chưa đủ ngưỡng xuất (DRAFT / LISTED)
        var draftBatches = await _db.InventoryBatches
            .CountAsync(b => b.DepotId == depot.Id
                          && (b.Status == BatchStatus.DRAFT || b.Status == BatchStatus.LISTED));

        // Doanh thu tháng này (BatchOrders DELIVERED)
        var firstOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthRevenue = await _db.BatchOrders
            .Where(o => o.Batch.DepotId == depot.Id
                     && o.Status == BatchStatus.DELIVERED
                     && o.CreatedAt >= firstOfMonth)
            .SumAsync(o => o.TotalAmount ?? 0);

        return Ok(new
        {
            newRequests,
            totalInventoryKg   = totalInKg - totalOutKg,
            draftBatches,
            monthRevenue,
        });
    }

    // GET /api/depot/pickup-requests/{id} — Chi tiết một pickup request
    [HttpGet("/api/depot/pickup-requests/{id}")]
    [Authorize(Roles = "DEPOT,SELLER,FACTORY,DRIVER,ADMIN")]
    public async Task<IActionResult> GetPickupRequestDetail(Guid id)
    {
        var request = await _db.PickupRequests
            .Include(r => r.Seller).ThenInclude(s => s.User)
            .Include(r => r.Items)
            .Include(r => r.Results)
            .Include(r => r.AssignedDepot)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request is null) return NotFound();

        return Ok(new
        {
            id             = request.Id,
            requestCode    = request.RequestCode,
            sellerName     = request.Seller.User.FullName,
            sellerPhone    = request.Seller.User.Phone,
            pickupAddress  = request.PickupAddress,
            pickupDate     = request.PickupDate.ToString("dd/MM/yyyy"),
            pickupSlot     = request.PickupSlot,
            description    = request.Description,
            note           = request.Note,
            status         = request.Status.ToString(),
            depotName      = request.AssignedDepot?.CompanyName ?? "Kho Re-Nats",
            depotPhone     = request.AssignedDepot?.ContactPhone ?? "028 1234 5678",
            depotAddress   = request.AssignedDepot?.Address ?? "45 Đường Số 12, Bình Chánh, TP. Hồ Chí Minh",
            types = request.Items.Select(i => new
            {
                id          = i.MaterialId,
                label       = i.MaterialLabel,
                emoji       = i.MaterialEmoji,
                pricePerKg  = 0, // FE tự map giá theo loại
            }).ToList(),
            results = request.Results.Select(r => new
            {
                materialLabel = r.MaterialLabel,
                weightKg      = r.WeightKg,
                pricePerKg    = r.PricePerKg,
                totalAmount   = r.WeightKg * r.PricePerKg,
            }).ToList(),
        });
    }

    // GET /api/depot/pickup-requests — Tất cả pickup requests
    [HttpGet("/api/depot/pickup-requests")]
    public async Task<IActionResult> GetAllPickupRequests([FromQuery] string? status)
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null && user.Role == UserRole.DEPOT)
            {
                depot = new Renats_BE.Models.Depot
                {
                    UserId = user.Id,
                    CompanyName = user.FullName ?? "Điểm thu gom Re-Nats",
                    ContactPerson = user.FullName ?? "Người đại diện",
                    ContactPhone = user.Phone ?? "0987654321",
                    Address = null,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Depots.Add(depot);
                await _db.SaveChangesAsync();
            }
            else
            {
                return NotFound("Không tìm thấy thông tin kho hợp lệ");
            }
        }

        var query = _db.PickupRequests
            .Where(r => r.AssignedDepotId == depot.Id)
            .Include(r => r.Seller).ThenInclude(s => s.User)
            .Include(r => r.Items)
            .Include(r => r.Results)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<PickupRequestStatus>(status.ToUpper(), out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        var result = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                id           = r.Id,
                requestCode  = r.RequestCode,
                sellerName   = r.Seller.User.FullName,
                sellerPhone  = r.Seller.User.Phone,
                pickupAddress= r.PickupAddress,
                pickupDate   = r.PickupDate.ToString("dd/MM/yyyy"),
                pickupSlot   = r.PickupSlot,
                status       = r.Status.ToString(),
                completedAt  = r.CompletedAt,
                types = r.Items.Select(i => new { i.MaterialLabel, i.MaterialEmoji }).ToList(),
                results = r.Results.Select(res => new
                {
                    res.MaterialLabel, res.WeightKg, res.PricePerKg
                }).ToList(),
            })
            .ToListAsync();

        return Ok(result);
    }
}
