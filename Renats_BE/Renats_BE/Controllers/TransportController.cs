using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Renats_BE.Controllers.Transport
{
    [ApiController]
    [Route("api/transport")]
    [Authorize]
    public class TransportController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TransportController(AppDbContext db)
        {
            _db = db;
        }

        // GET /api/transport/depots-with-jobs — Driver lấy danh sách kho có đơn cần vận chuyển
        [HttpGet("depots-with-jobs")]
        public async Task<IActionResult> GetDepotsWithJobs([FromQuery] decimal? lat, [FromQuery] decimal? lng)
        {
            // Lấy danh sách các kho của các đơn vận chuyển PENDING và chưa gán Driver
            var depots = await _db.TransportJobs
                .Where(t => t.Status == TransportStatus.PENDING && t.DriverId == null)
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch).ThenInclude(b => b.Depot)
                .Select(t => t.BatchOrder.Batch.Depot)
                .Distinct()
                .ToListAsync();

            var result = depots.Select(d => {
                var pendingCount = _db.TransportJobs
                    .Count(t => t.BatchOrder.Batch.DepotId == d.Id && t.Status == TransportStatus.PENDING && t.DriverId == null);
                
                return new
                {
                    id = d.Id,
                    companyName = d.CompanyName,
                    address = d.Address,
                    city = d.City ?? d.Province ?? "TP.HCM",
                    pendingJobCount = pendingCount,
                    distanceKm = (lat.HasValue && lng.HasValue)
                        ? CalculateDistance(lat, lng, d.Latitude, d.Longitude)
                        : 4.8m // Khoảng cách giả lập
                };
            }).ToList();

            return Ok(result);
        }

        // GET /api/transport/jobs/available — Lấy đơn vận chuyển khả dụng theo kho
        [HttpGet("jobs/available")]
        public async Task<IActionResult> GetAvailableJobs([FromQuery] Guid depotId)
        {
            var jobs = await _db.TransportJobs
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch).ThenInclude(b => b.Depot)
                .Include(t => t.BatchOrder).ThenInclude(o => o.Factory)
                .Where(t => t.BatchOrder.Batch.DepotId == depotId && t.Status == TransportStatus.PENDING && t.DriverId == null)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var result = jobs.Select(t => {
                var dist = t.EstimatedDistanceKm ?? CalculateDistance(
                    t.PickupLatitude ?? t.BatchOrder.Batch.Depot.Latitude,
                    t.PickupLongitude ?? t.BatchOrder.Batch.Depot.Longitude,
                    t.DeliveryLatitude ?? t.BatchOrder.Factory.Latitude,
                    t.DeliveryLongitude ?? t.BatchOrder.Factory.Longitude);

                return new
                {
                    id = t.Id,
                    status = t.Status.ToString(),
                    createdAtFormatted = GetTimeAgo(t.CreatedAt),
                    depotName = t.BatchOrder.Batch.Depot.CompanyName,
                    factoryName = t.BatchOrder.Factory.CompanyName,
                    distanceKm = dist,
                    materialType = t.BatchOrder.Batch.MaterialType.ToString(),
                    totalKg = t.BatchOrder.Batch.ActualWeightKg ?? t.BatchOrder.Batch.EstimatedWeightKg,
                    vehicleType = GetVehicleTypeForWeight(t.BatchOrder.Batch.ActualWeightKg ?? t.BatchOrder.Batch.EstimatedWeightKg),
                    transportFee = t.TransportFee ?? Math.Max(150000m, dist * 15000m)
                };
            }).ToList();

            return Ok(result);
        }

        // POST /api/transport/jobs/{jobId}/accept — Tài xế nhận đơn vận chuyển
        [HttpPost("jobs/{jobId}/accept")]
        public async Task<IActionResult> AcceptJob(Guid jobId)
        {
            var userIdClaim = User.FindFirst("sub")?.Value
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
            if (driver is null)
            {
                // Tự động tạo driver nếu User có role DRIVER nhưng chưa có bản ghi Driver
                var user = await _db.Users.FindAsync(userId);
                if (user != null && user.Role == UserRole.DRIVER)
                {
                    driver = new Driver
                    {
                        UserId = userId,
                        VehiclePlate = "59-X1 999.99",
                        VehicleType = "Xe tải 3.5 Tấn",
                        MaxCapacityKg = 3500,
                        IsAvailable = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Drivers.Add(driver);
                    await _db.SaveChangesAsync();
                }
                else
                {
                    return NotFound("Không tìm thấy thông tin tài xế hoặc vai trò không hợp lệ");
                }
            }

            var job = await _db.TransportJobs
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch)
                .FirstOrDefaultAsync(t => t.Id == jobId);

            if (job is null)
                return NotFound("Không tìm thấy đơn vận chuyển");

            if (job.DriverId != null || job.Status != TransportStatus.PENDING)
                return BadRequest("Đơn vận chuyển đã được nhận bởi tài xế khác");

            job.DriverId = driver.Id;
            job.Status = TransportStatus.ASSIGNED;
            job.BatchOrder.Status = BatchStatus.IN_PROGRESS;
            job.BatchOrder.Batch.Status = BatchStatus.IN_PROGRESS;
            job.BatchOrder.Batch.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Nhận đơn thành công" });
        }

        // GET /api/transport/jobs/my — Lấy danh sách chuyến của tài xế đang đăng nhập
        [HttpGet("jobs/my")]
        public async Task<IActionResult> GetMyJobs()
        {
            var userIdClaim = User.FindFirst("sub")?.Value
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var driver = await _db.Drivers.FirstOrDefaultAsync(d => d.UserId == userId);
            if (driver is null)
                return Ok(new List<object>());

            var jobs = await _db.TransportJobs
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch).ThenInclude(b => b.Depot)
                .Include(t => t.BatchOrder).ThenInclude(o => o.Factory)
                .Include(t => t.TrackingLogs)
                .Where(t => t.DriverId == driver.Id)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var result = jobs.Select(t => {
                var dist = t.EstimatedDistanceKm ?? CalculateDistance(
                    t.PickupLatitude ?? t.BatchOrder.Batch.Depot.Latitude,
                    t.PickupLongitude ?? t.BatchOrder.Batch.Depot.Longitude,
                    t.DeliveryLatitude ?? t.BatchOrder.Factory.Latitude,
                    t.DeliveryLongitude ?? t.BatchOrder.Factory.Longitude);

                return new
                {
                    id = t.Id,
                    status = t.Status.ToString(),
                    createdAtFormatted = GetTimeAgo(t.CreatedAt),
                    depotName = t.BatchOrder.Batch.Depot.CompanyName,
                    factoryName = t.BatchOrder.Factory.CompanyName,
                    distanceKm = dist,
                    materialType = t.BatchOrder.Batch.MaterialType.ToString(),
                    totalKg = t.BatchOrder.Batch.ActualWeightKg ?? t.BatchOrder.Batch.EstimatedWeightKg,
                    vehicleType = GetVehicleTypeForWeight(t.BatchOrder.Batch.ActualWeightKg ?? t.BatchOrder.Batch.EstimatedWeightKg),
                    transportFee = t.TransportFee ?? Math.Max(150000m, dist * 15000m),
                    trackingLogs = t.TrackingLogs.OrderBy(l => l.CreatedAt).Select(l => new {
                        id = l.Id,
                        latitude = l.Latitude,
                        longitude = l.Longitude,
                        note = l.Note,
                        logType = l.LogType,
                        imageUrl = l.ImageUrl,
                        createdAt = l.CreatedAt
                    }).ToList()
                };
            }).ToList();

            return Ok(result);
        }

        // PUT /api/transport/jobs/{jobId}/status — Cập nhật trạng thái chuyến (đang chạy, đã giao...)
        [HttpPut("jobs/{jobId}/status")]
        public async Task<IActionResult> UpdateJobStatus(Guid jobId, [FromBody] UpdateStatusDto dto)
        {
            var job = await _db.TransportJobs
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch)
                .FirstOrDefaultAsync(t => t.Id == jobId);
            if (job is null)
                return NotFound("Không tìm thấy đơn vận chuyển");

            if (!Enum.TryParse<TransportStatus>(dto.Status, ignoreCase: true, out var ts))
                return BadRequest("Trạng thái không hợp lệ");

            job.Status = ts;

            if (ts == TransportStatus.PICKED_UP || ts == TransportStatus.ON_THE_WAY)
            {
                job.BatchOrder.Status = BatchStatus.IN_PROGRESS;
                job.BatchOrder.Batch.Status = BatchStatus.IN_PROGRESS;
            }
            else if (ts == TransportStatus.DELIVERED)
            {
                job.DeliveredTime = DateTime.UtcNow;
                job.BatchOrder.Status = BatchStatus.DELIVERED;
                job.BatchOrder.Batch.Status = BatchStatus.DELIVERED;
                job.BatchOrder.Batch.DeliveredAt = DateTime.UtcNow;
            }
            else if (ts == TransportStatus.CANCELLED)
            {
                job.BatchOrder.Status = BatchStatus.ACCEPTED;
                job.BatchOrder.Batch.Status = BatchStatus.ACCEPTED;
            }

            job.BatchOrder.Batch.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // POST /api/transport/jobs/{jobId}/checkin — Check-in tại điểm đón/giao
        [HttpPost("jobs/{jobId}/checkin")]
        public async Task<IActionResult> Checkin(Guid jobId, [FromBody] CheckinDto dto)
        {
            var job = await _db.TransportJobs.FindAsync(jobId);
            if (job is null)
                return NotFound("Không tìm thấy đơn vận chuyển");

            var log = new TransportTrackingLog
            {
                Id = Guid.NewGuid(),
                TransportJobId = jobId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                LogType = dto.Type,
                ImageUrl = dto.ImageUrl,
                Note = $"[Checkin {dto.Type}] {dto.Note}",
                CreatedAt = DateTime.UtcNow
            };
            _db.TransportTrackingLogs.Add(log);
            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }

        // POST /api/transport/jobs/{jobId}/reject — Từ chối / huỷ đơn
        [HttpPost("jobs/{jobId}/reject")]
        public async Task<IActionResult> RejectJob(Guid jobId, [FromBody] TransportRejectDto dto)
        {
            var job = await _db.TransportJobs
                .Include(t => t.BatchOrder).ThenInclude(o => o.Batch)
                .FirstOrDefaultAsync(t => t.Id == jobId);
            if (job is null)
                return NotFound("Không tìm thấy đơn vận chuyển");

            job.DriverId = null;
            job.Status = TransportStatus.PENDING;
            job.BatchOrder.Status = BatchStatus.ACCEPTED;
            job.BatchOrder.Batch.Status = BatchStatus.ACCEPTED;
            job.BatchOrder.Batch.UpdatedAt = DateTime.UtcNow;

            var log = new TransportTrackingLog
            {
                Id = Guid.NewGuid(),
                TransportJobId = jobId,
                Note = $"[Huỷ đơn] Lý do: {dto.Reason}",
                CreatedAt = DateTime.UtcNow
            };
            _db.TransportTrackingLogs.Add(log);

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // Helpers
        private static string GetTimeAgo(DateTime dt)
        {
            var span = DateTime.UtcNow - dt.ToUniversalTime();
            if (span.TotalMinutes < 1) return "Vừa xong";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
            return $"{(int)span.TotalDays} ngày trước";
        }

        private static string GetVehicleTypeForWeight(decimal weightKg)
        {
            if (weightKg <= 1000) return "Xe bán tải";
            if (weightKg <= 3500) return "Xe tải 3.5 Tấn";
            if (weightKg <= 5000) return "Xe tải 5 Tấn";
            return "Xe tải 8 Tấn";
        }

        private static decimal CalculateDistance(decimal? lat1, decimal? lng1, decimal? lat2, decimal? lng2)
        {
            if (!lat1.HasValue || !lng1.HasValue || !lat2.HasValue || !lng2.HasValue)
                return 15.2m;

            if (lat1.Value == 0 || lng1.Value == 0 || lat2.Value == 0 || lng2.Value == 0)
                return 15.2m;

            double dLat = (double)(lat2.Value - lat1.Value) * Math.PI / 180.0;
            double dLon = (double)(lng2.Value - lng1.Value) * Math.PI / 180.0;
            double rLat1 = (double)lat1.Value * Math.PI / 180.0;
            double rLat2 = (double)lat2.Value * Math.PI / 180.0;

            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(rLat1) * Math.Cos(rLat2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            decimal distance = (decimal)(6371 * c);
            return Math.Round(distance, 1);
        }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CheckinDto
    {
        public string Type { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Note { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class TransportRejectDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}
