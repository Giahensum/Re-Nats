using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Seller;

/// <summary>
/// Endpoints dành cho phía DEPOT: xử lý yêu cầu thu gom từ seller
/// </summary>
[ApiController]
[Route("api/seller/pickup-management")]
[Authorize(Roles = "DEPOT")]
public class SellerPickupManagementController : ControllerBase
{
    private readonly AppDbContext _db;
    public SellerPickupManagementController(AppDbContext db) => _db = db;

    // GET /api/seller/pickup-management/pending?depotId=  – Depot xem danh sách yêu cầu đang chờ
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingRequests([FromQuery] Guid? depotId)
    {
        var query = _db.PickupRequests
            .Where(r => r.Status == PickupRequestStatus.PENDING ||
                        r.Status == PickupRequestStatus.SCHEDULED)
            .Include(r => r.Seller).ThenInclude(s => s.User)
            .Include(r => r.Items)
            .AsQueryable();

        if (depotId.HasValue)
            query = query.Where(r => r.AssignedDepotId == depotId.Value ||
                                     r.AssignedDepotId == null);

        var result = await query
            .OrderBy(r => r.PickupDate)
            .Select(r => new
            {
                id = r.Id,
                requestCode = r.RequestCode,
                sellerName = r.Seller.User.FullName,
                sellerPhone = r.Seller.User.Phone,
                pickupAddress = r.PickupAddress,
                pickupDate = r.PickupDate,
                pickupSlot = r.PickupSlot,
                status = r.Status.ToString(),
                types = r.Items.Select(i => new { i.MaterialLabel, i.MaterialEmoji }).ToList()
            })
            .ToListAsync();

        return Ok(result);
    }

    // PATCH /api/seller/pickup-management/{id}/schedule – Depot xác nhận lịch
    [HttpPatch("{id}/schedule")]
    public async Task<IActionResult> SchedulePickup(Guid id, [FromBody] ScheduleDto dto)
    {
        var request = await _db.PickupRequests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.Status != PickupRequestStatus.PENDING)
            return BadRequest("Yêu cầu không ở trạng thái chờ xác nhận");

        // Tìm Depot tương ứng với UserId (hoặc DepotId thực tế) để gán đúng AssignedDepotId
        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == dto.DepotId || d.Id == dto.DepotId);
        if (depot == null) 
        {
            // Tự động tạo bản ghi Depot cho User để phục vụ test và vận hành mượt mà
            var user = await _db.Users.FindAsync(dto.DepotId);
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
                return BadRequest("Không tìm thấy thông tin tài khoản hợp lệ");
            }
        }

        request.Status = PickupRequestStatus.SCHEDULED;
        request.AssignedDepotId = depot.Id;
        request.ScheduledAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xác nhận lịch thu gom" });
    }

    // POST /api/seller/pickup-management/{id}/weigh – Depot nhập kết quả cân
    [HttpPost("{id}/weigh")]
    public async Task<IActionResult> RecordWeighResult(Guid id, [FromBody] WeighResultDto dto)
    {
        var request = await _db.PickupRequests
            .Include(r => r.Seller)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request is null) return NotFound();
        if (request.Status != PickupRequestStatus.SCHEDULED)
            return BadRequest("Yêu cầu chưa được lên lịch");

        // Thêm kết quả cân từng loại
        foreach (var item in dto.Results)
        {
            _db.PickupResults.Add(new PickupResult
            {
                PickupRequestId = id,
                MaterialLabel = item.MaterialLabel,
                WeightKg = item.WeightKg,
                PricePerKg = item.PricePerKg
            });
        }

        request.Status = PickupRequestStatus.WEIGHED;
        request.Note = dto.Note;
        request.WeighedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        // Cập nhật stats seller
        request.Seller.CompletedRequests++;

        await _db.SaveChangesAsync();

        var total = dto.Results.Sum(r => r.WeightKg * r.PricePerKg);
        return Ok(new { message = "Đã ghi nhận kết quả cân", totalAmount = total });
    }

    // PATCH /api/seller/pickup-management/{id}/complete – Hoàn tất (sau khi thanh toán)
    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> CompleteRequest(Guid id)
    {
        var request = await _db.PickupRequests.FindAsync(id);
        if (request is null) return NotFound();
        if (request.Status != PickupRequestStatus.WEIGHED)
            return BadRequest("Yêu cầu chưa được cân");

        request.Status = PickupRequestStatus.DONE;
        request.CompletedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Yêu cầu đã hoàn tất" });
    }

    public class ScheduleDto
    {
        public Guid DepotId { get; set; }
    }

    public class WeighResultDto
    {
        public string? Note { get; set; }
        public List<ResultItem> Results { get; set; } = [];

        public class ResultItem
        {
            public string MaterialLabel { get; set; } = string.Empty;
            public decimal WeightKg { get; set; }
            public decimal PricePerKg { get; set; }
        }
    }
}
