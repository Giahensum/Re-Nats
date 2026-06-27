using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Depot;

/// <summary>
/// Tồn kho của DEPOT — tính real-time từ PickupResults đã hoàn tất
/// </summary>
[ApiController]
[Route("api/depot/inventory")]
[Authorize(Roles = "DEPOT")]
public class DepotInventoryController : ControllerBase
{
    private readonly AppDbContext _db;
    public DepotInventoryController(AppDbContext db) => _db = db;

    // GET /api/depot/inventory — Danh sách tồn kho theo loại vật liệu
    [HttpGet]
    public async Task<IActionResult> GetInventory()
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

        // Tổng nhập theo loại (từ PickupResults đã DONE)
        var inbound = await _db.PickupResults
            .Where(r => r.PickupRequest.AssignedDepotId == depot.Id
                     && r.PickupRequest.Status == PickupRequestStatus.DONE)
            .GroupBy(r => r.MaterialLabel)
            .Select(g => new
            {
                MaterialLabel = g.Key,
                TotalKg       = g.Sum(r => r.WeightKg),
            })
            .ToListAsync();

        // Tổng xuất theo loại (tất cả các lô hàng trừ các lô đã HỦY)
        var exportedBatches = await _db.InventoryBatches
            .Where(b => b.DepotId == depot.Id
                     && b.Status != BatchStatus.CANCELLED)
            .Select(b => new
            {
                MaterialType = b.MaterialType.ToString(),
                WeightKg     = b.ActualWeightKg ?? b.EstimatedWeightKg,
            })
            .ToListAsync();


        // Map MaterialType → label (dùng tên đơn giản)
        static string TypeToLabel(string t) => t switch
        {
            "IRON"             => "Sắt vụn",
            "STEEL"            => "Thép phế liệu",
            "COPPER"           => "Đồng cáp",
            "ALUMINUM"         => "Nhôm phế liệu",
            "CARDBOARD"        => "Giấy Carton",
            "PAPER"            => "Giấy thải báo",
            "PET"              => "Nhựa PET",
            "HDPE"             => "Nhựa HDPE",
            "PVC"              => "Nhựa cứng (PP/PE)",
            "ELECTRONIC_WASTE" => "Pin / Acquy cũ",
            _                  => "Khác",
        };

        static string LabelToType(string label) => label switch
        {
            "Sắt vụn"          => "IRON",
            "Thép phế liệu"    => "STEEL",
            "Đồng cáp"         => "COPPER",
            "Nhôm phế liệu"    => "ALUMINUM",
            "Giấy Carton"      => "CARDBOARD",  // Giấy Carton → dùng CARDBOARD, không phải PAPER
            "Giấy thải báo"    => "PAPER",
            "Nhựa PET"         => "PET",
            "Nhựa HDPE"        => "HDPE",
            "Nhựa cứng (PP/PE)"=> "PVC",
            "Pin / Acquy cũ"   => "ELECTRONIC_WASTE",
            _                  => "OTHER",
        };

        // Nhóm inbound theo label
        var inventory = inbound.Select(i =>
        {
            var exported = exportedBatches
                .Where(e => TypeToLabel(e.MaterialType) == i.MaterialLabel)
                .Sum(e => e.WeightKg);

            var current = i.TotalKg - exported;
            return new
            {
                type    = i.MaterialLabel,
                key     = LabelToType(i.MaterialLabel),
                current = Math.Max(0, current),
                unit    = "kg",
            };
        })
        .Where(i => i.current > 0)
        .OrderByDescending(i => i.current)
        .ToList();

        return Ok(inventory);
    }
}
