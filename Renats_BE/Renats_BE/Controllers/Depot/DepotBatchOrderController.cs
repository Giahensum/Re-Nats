using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Depot;

/// <summary>
/// Tạo và quản lý lô xuất hàng của DEPOT
/// </summary>
[ApiController]
[Route("api/depot/batch-orders")]
[Authorize(Roles = "DEPOT")]
public class DepotBatchOrderController : ControllerBase
{
    private readonly AppDbContext _db;
    public DepotBatchOrderController(AppDbContext db) => _db = db;

    // GET /api/depot/batch-orders — Lịch sử lô xuất
    [HttpGet]
    public async Task<IActionResult> GetBatchOrders()
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

        var batches = await _db.InventoryBatches
            .Where(b => b.DepotId == depot.Id)
            .Include(b => b.Order).ThenInclude(o => o != null ? o.Factory : null)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                id            = b.Id,
                batchCode     = b.BatchCode,
                materialType  = b.MaterialType.ToString(),
                estimatedKg   = b.EstimatedWeightKg,
                actualKg      = b.ActualWeightKg,
                status        = b.Status.ToString(),
                createdAt     = b.CreatedAt,
                deliveredAt   = b.DeliveredAt,
                buyer         = b.Order != null ? b.Order.Factory.CompanyName : null,
                totalAmount   = b.Order != null ? b.Order.TotalAmount : null,
                unitPrice     = b.UnitPrice,
            })
            .ToListAsync();

        return Ok(batches);
    }

    // POST /api/depot/batch-orders — Tạo lô xuất mới
    [HttpPost]
    public async Task<IActionResult> CreateBatchOrder([FromBody] CreateBatchDto dto)
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

        // Parse MaterialType từ label
        if (!Enum.TryParse<MaterialType>(dto.MaterialTypeKey ?? "OTHER", ignoreCase: true, out var materialType))
            materialType = MaterialType.OTHER;

        // Tạo batch code tự động
        var count = await _db.InventoryBatches.CountAsync(b => b.DepotId == depot.Id);
        var batchCode = $"LO-{DateTime.UtcNow:yyMM}-{(count + 1):D3}";

        Guid factoryId = Guid.Empty;
        var isDirectSale = !string.IsNullOrEmpty(dto.Buyer) && Guid.TryParse(dto.Buyer, out factoryId);


        var batch = new InventoryBatch
        {
            DepotId             = depot.Id,
            BatchCode           = batchCode,
            MaterialType        = materialType,
            EstimatedWeightKg   = dto.TotalKg,
            Description         = dto.Note,
            Status              = isDirectSale ? BatchStatus.ACCEPTED : BatchStatus.LISTED,
            ListedAt            = DateTime.UtcNow,
            AcceptedAt          = isDirectSale ? DateTime.UtcNow : null,
            UnitPrice           = dto.UnitPrice,
            TransportType       = dto.TransportType != null
                ? Enum.TryParse<TransportType>(dto.TransportType, ignoreCase: true, out var tt) ? tt : (TransportType?)null
                : null,
        };

        _db.InventoryBatches.Add(batch);
        await _db.SaveChangesAsync();

        if (isDirectSale)
        {
            // 1. Tạo thầu được chấp nhận luôn (ACCEPTED)
            var bid = new BatchBid
            {
                BatchId = batch.Id,
                FactoryId = factoryId,
                BidPrice = dto.UnitPrice ?? 0,
                Note = "Chỉ định trực tiếp từ kho vựa",
                Status = BidStatus.ACCEPTED
            };
            _db.BatchBids.Add(bid);
            await _db.SaveChangesAsync();

            // 2. Tạo Đơn hàng chính thức luôn (ACCEPTED)
            var order = new BatchOrder
            {
                Id = Guid.NewGuid(),
                BatchId = batch.Id,
                FactoryId = factoryId,
                AcceptedBidId = bid.Id,
                AgreedPrice = dto.UnitPrice ?? 0,
                TotalAmount = batch.EstimatedWeightKg * (dto.UnitPrice ?? 0),
                Status = BatchStatus.ACCEPTED,
                CreatedAt = DateTime.UtcNow
            };
            _db.BatchOrders.Add(order);
            await _db.SaveChangesAsync();

            // 3. Tạo TransportJob tự động để đưa lên chợ đơn
            var factoryObj = await _db.Factories.FindAsync(factoryId);
            
            decimal distance = 15.2m;
            var pLat = depot.Latitude ?? 10.8231m;
            var pLng = depot.Longitude ?? 106.6297m;
            var dLatVal = factoryObj?.Latitude ?? 10.7876m;
            var dLngVal = factoryObj?.Longitude ?? 106.6346m;

            if (pLat != 0 && pLng != 0 && dLatVal != 0 && dLngVal != 0)
            {
                double dLat = (double)(dLatVal - pLat) * Math.PI / 180.0;
                double dLon = (double)(dLngVal - pLng) * Math.PI / 180.0;
                double lat1 = (double)pLat * Math.PI / 180.0;
                double lat2 = (double)dLatVal * Math.PI / 180.0;

                double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                           Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(lat1) * Math.Cos(lat2);
                double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
                distance = (decimal)(6371 * c);
                distance = Math.Round(distance, 1);
            }
            decimal fee = Math.Max(150000m, distance * 15000m);

            var transport = new TransportJob
            {
                Id = Guid.NewGuid(),
                BatchOrderId = order.Id,
                DriverId = null,
                PickupAddress = depot.Address ?? "Kho trung chuyển Re-Nats",
                DeliveryAddress = factoryObj?.Address ?? "Nhà máy tái chế",
                PickupLatitude = pLat,
                PickupLongitude = pLng,
                DeliveryLatitude = dLatVal,
                DeliveryLongitude = dLngVal,
                EstimatedDistanceKm = distance,
                TransportFee = fee,
                Status = TransportStatus.PENDING,
                CreatedAt = DateTime.UtcNow
            };
            _db.TransportJobs.Add(transport);
            await _db.SaveChangesAsync();

            // 4. Gửi thông báo chỉ định trực tiếp
            if (factoryObj != null)
            {
                var notification = new Notification
                {
                    UserId = factoryObj.UserId,
                    Title = "Đơn hàng mới được chỉ định",
                    Message = $"Kho vựa '{depot.CompanyName}' đã tạo lô hàng '{batchCode}' ({MaterialTypeHelper.ToVietnamese(materialType)}) và chỉ định bán trực tiếp cho bạn (Giá thu mua do nhà máy đề xuất).",

                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Notifications.Add(notification);
                await _db.SaveChangesAsync();
            }
        }
        else
        {
            // Đăng công khai: Thông báo cho tất cả nhà máy có nhu cầu nhận loại vật liệu này
            var targetLabel = MaterialTypeHelper.ToVietnamese(materialType);
            var matchingFactories = await _db.Factories
                .Where(f => f.IsProfileComplete && (
                    f.PrimaryMaterialType == materialType
                    || (f.AcceptedMaterialTypes != null && (
                        f.AcceptedMaterialTypes.Contains(dto.MaterialTypeKey ?? "")
                        || f.AcceptedMaterialTypes.Contains(targetLabel)
                    ))
                ))
                .ToListAsync();

            foreach (var f in matchingFactories)
            {
                var notification = new Notification
                {
                    UserId = f.UserId,
                    Title = "Lô hàng mới trên thị trường",
                    Message = $"Kho vựa '{depot.CompanyName}' vừa đăng bán lô hàng mới '{batchCode}' ({MaterialTypeHelper.ToVietnamese(materialType)}) với khối lượng {dto.TotalKg} kg. Hãy vào xem và đấu giá ngay!",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Notifications.Add(notification);
            }
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            message   = "Tạo lô hàng thành công",
            batchId   = batch.Id,
            batchCode = batch.BatchCode,
        });
    }


    // PATCH /api/depot/batch-orders/{id}/cancel — Hủy lô (chỉ khi chưa có nhà máy xác nhận)
    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> CancelBatch(Guid id)
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null) return NotFound("Không tìm thấy thông tin kho");

        var batch = await _db.InventoryBatches.FirstOrDefaultAsync(b => b.Id == id && b.DepotId == depot.Id);
        if (batch is null) return NotFound("Không tìm thấy lô hàng");

        // Chỉ hủy được khi chưa có nhà máy xác nhận (DRAFT, LISTED, BIDDING)
        if (batch.Status == BatchStatus.ACCEPTED || batch.Status == BatchStatus.READY_FOR_PICKUP
            || batch.Status == BatchStatus.IN_PROGRESS || batch.Status == BatchStatus.DELIVERED
            || batch.Status == BatchStatus.VERIFIED)
            return BadRequest("Không thể hủy lô đã được nhà máy xác nhận hoặc đang vận chuyển");

        batch.Status = BatchStatus.CANCELLED;
        batch.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã hủy lô hàng thành công" });
    }

    // PATCH /api/depot/batch-orders/{id}/transport — Chọn vận chuyển sau khi nhà máy xác nhận
    [HttpPatch("{id}/transport")]
    public async Task<IActionResult> SetTransport(Guid id, [FromBody] SetTransportDto dto)
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null) return NotFound("Không tìm thấy thông tin kho");

        var batch = await _db.InventoryBatches.FirstOrDefaultAsync(b => b.Id == id && b.DepotId == depot.Id);
        if (batch is null) return NotFound("Không tìm thấy lô hàng");

        // Chỉ được chọn vận chuyển khi nhà máy đã xác nhận
        if (batch.Status != BatchStatus.ACCEPTED)
            return BadRequest("Chỉ được chọn vận chuyển sau khi nhà máy xác nhận lô hàng");

        TransportType tt;
        if (dto.TransportType.Equals("RENATS_DRIVER", StringComparison.OrdinalIgnoreCase) ||
            dto.TransportType.Equals("FACTORY_PICKUP", StringComparison.OrdinalIgnoreCase) ||
            dto.TransportType.Equals("APP_LOGISTICS", StringComparison.OrdinalIgnoreCase))
        {
            tt = TransportType.APP_LOGISTICS;
        }
        else if (dto.TransportType.Equals("DEPOT_SELF", StringComparison.OrdinalIgnoreCase) ||
                 dto.TransportType.Equals("DEPOT_SHIPPED", StringComparison.OrdinalIgnoreCase) ||
                 dto.TransportType.Equals("SELF_DELIVERY", StringComparison.OrdinalIgnoreCase))
        {
            tt = TransportType.SELF_DELIVERY;
        }
        else
        {
            if (!Enum.TryParse<TransportType>(dto.TransportType, ignoreCase: true, out tt))
                return BadRequest("Phương thức vận chuyển không hợp lệ");
        }

        batch.TransportType = tt;
        batch.Status = BatchStatus.READY_FOR_PICKUP;
        batch.UpdatedAt = DateTime.UtcNow;

        // Tự động tạo TransportJob nếu chọn Tài xế Re-Nats (APP_LOGISTICS) hoặc Kho tự vận tải (SELF_DELIVERY)
        if (tt == TransportType.APP_LOGISTICS || tt == TransportType.SELF_DELIVERY)
        {
            var order = await _db.BatchOrders.FirstOrDefaultAsync(o => o.BatchId == batch.Id);
            if (order != null)
            {
                var jobExists = await _db.TransportJobs.AnyAsync(j => j.BatchOrderId == order.Id);
                if (!jobExists)
                {
                    var factory = await _db.Factories.FindAsync(order.FactoryId);
                    
                    // Tính toán khoảng cách (nếu có GPS)
                    decimal distance = 15.2m;
                    if (depot.Latitude.HasValue && depot.Longitude.HasValue && factory != null && factory.Latitude.HasValue && factory.Longitude.HasValue)
                    {
                        double dLat = (double)(factory.Latitude.Value - depot.Latitude.Value) * Math.PI / 180.0;
                        double dLon = (double)(factory.Longitude.Value - depot.Longitude.Value) * Math.PI / 180.0;
                        double lat1 = (double)depot.Latitude.Value * Math.PI / 180.0;
                        double lat2 = (double)factory.Latitude.Value * Math.PI / 180.0;

                        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(lat1) * Math.Cos(lat2);
                        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
                        distance = (decimal)(6371 * c);
                        distance = Math.Round(distance, 1);
                    }

                    // Tính cước phí (Ví dụ: 15,000đ/km, tối thiểu 150,000đ)
                    decimal fee = Math.Max(150000m, distance * 15000m);

                    var transport = new TransportJob
                    {
                        Id = Guid.NewGuid(),
                        BatchOrderId = order.Id,
                        DriverId = null, // Chưa gán tài xế
                        PickupAddress = depot.Address ?? "Kho Re-Nats",
                        DeliveryAddress = factory?.Address ?? "Nhà máy tái chế",
                        PickupLatitude = depot.Latitude,
                        PickupLongitude = depot.Longitude,
                        DeliveryLatitude = factory?.Latitude,
                        DeliveryLongitude = factory?.Longitude,
                        EstimatedDistanceKm = distance,
                        TransportFee = fee,
                        Status = TransportStatus.PENDING, // Trạng thái PENDING để xuất hiện trên chợ đơn
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.TransportJobs.Add(transport);
                }
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Đã cập nhật phương thức vận chuyển và tạo đơn vận chuyển thành công" });
    }

    public class SetTransportDto
    {
        public string TransportType { get; set; } = string.Empty; // DEPOT_SHIPPED | FACTORY_PICKUP
    }

    // GET /api/depot/batch-orders/active-material-types — Lấy danh sách loại vật liệu đang có lô hoạt động
    [HttpGet("active-material-types")]
    public async Task<IActionResult> GetActiveMaterialTypes()
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId)) return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null) return Ok(new List<string>());

        // Những trạng thái đang hoạt động (chưa bị hủy/chưa xong)
        var activeStatuses = new[] { BatchStatus.DRAFT, BatchStatus.LISTED, BatchStatus.BIDDING, BatchStatus.ACCEPTED, BatchStatus.READY_FOR_PICKUP, BatchStatus.IN_PROGRESS };
        var activeTypes = await _db.InventoryBatches
            .Where(b => b.DepotId == depot.Id && activeStatuses.Contains(b.Status))
            .Select(b => b.MaterialType.ToString())
            .Distinct()
            .ToListAsync();

        return Ok(activeTypes);
    }

    public class CreateBatchDto
    {
        public string WasteType       { get; set; } = string.Empty;
        public string? MaterialTypeKey { get; set; }   // Enum key: IRON, COPPER...
        public decimal TotalKg        { get; set; }
        public string Unit            { get; set; } = "kg";
        public string? Location       { get; set; }
        public string? Note           { get; set; }
        public string? CarrierId      { get; set; }
        public string? Buyer          { get; set; }
        public string? DeliveryDate   { get; set; }
        public string? TransportType  { get; set; }
        public decimal? UnitPrice     { get; set; }
        // nguồn gốc
        public Dictionary<string, decimal>? SourceRatio { get; set; }
    }
}
