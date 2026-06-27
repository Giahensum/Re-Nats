using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Depot;

/// <summary>
/// Giúp kho vựa tìm nhà máy tái chế phù hợp với loại phế liệu cần xuất.
/// </summary>
[ApiController]
[Route("api/depot/factories")]
[Authorize(Roles = "DEPOT")]
public class DepotFactoryFinderController : ControllerBase
{
    private readonly AppDbContext _db;

    public DepotFactoryFinderController(AppDbContext db)
    {
        _db = db;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    // Haversine formula - khoảng cách giữa 2 tọa độ (km)
    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180)
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    // ── GET /api/depot/factories?materialType=IRON&depotLat=10.8&depotLng=106.7 ──
    [HttpGet]
    public async Task<IActionResult> GetMatchingFactories(
        [FromQuery] string? materialType,
        [FromQuery] double? depotLat,
        [FromQuery] double? depotLng)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        // Lấy tất cả nhà máy đã hoàn thiện hồ sơ
        var query = _db.Factories
            .Where(f => f.IsProfileComplete);

        // Lọc theo loại vật liệu nếu có
        if (!string.IsNullOrWhiteSpace(materialType)
            && Enum.TryParse<MaterialType>(materialType, true, out var mat))
        {
            // DB lưu tiếng Việt (ví dụ: "Giấy Carton"), nên so sánh theo tên tiếng Việt
            var vnLabel = MaterialTypeHelper.ToVietnamese(mat);
            query = query.Where(f =>
                f.PrimaryMaterialType == mat                                              // khớp qua converter
                || (f.AcceptedMaterialTypes != null && (
                    f.AcceptedMaterialTypes.Contains(materialType.ToUpper())             // backward compat (CARDBOARD)
                    || f.AcceptedMaterialTypes.Contains(vnLabel)))                        // tiếng Việt mới
            );
        }

        var factories = await query
            .Select(f => new
            {
                f.Id,
                f.CompanyName,
                f.Address,
                f.City,
                f.Province,
                f.IndustrialZone,
                f.Latitude,
                f.Longitude,
                f.ContactPerson,
                f.ContactPhone,
                PrimaryMaterialType = f.PrimaryMaterialType != null ? f.PrimaryMaterialType.ToString() : null,
                AcceptedMaterialTypes = string.IsNullOrEmpty(f.AcceptedMaterialTypes)
                    ? new string[0]
                    : f.AcceptedMaterialTypes.Split(',', StringSplitOptions.RemoveEmptyEntries),
                f.CapacityPerMonthTon,
                f.MinPurityRequired,
                f.IsPremium,
                f.IsProfileComplete
            })
            .ToListAsync();

        // Tính khoảng cách nếu có tọa độ depot
        var result = factories.Select(f =>
        {
            double? distKm = null;
            if (depotLat.HasValue && depotLng.HasValue
                && f.Latitude.HasValue && f.Longitude.HasValue)
            {
                distKm = Math.Round(HaversineKm(
                    depotLat.Value, depotLng.Value,
                    (double)f.Latitude.Value, (double)f.Longitude.Value), 1);
            }
            return new
            {
                f.Id,
                f.CompanyName,
                f.Address,
                f.City,
                f.Province,
                f.IndustrialZone,
                f.Latitude,
                f.Longitude,
                f.ContactPerson,
                f.ContactPhone,
                f.PrimaryMaterialType,
                f.AcceptedMaterialTypes,
                f.CapacityPerMonthTon,
                f.MinPurityRequired,
                f.IsPremium,
                DistanceKm = distKm
            };
        })
        // Sắp xếp: nhà máy có tọa độ gần nhất lên đầu, sau đó nhà máy không có tọa độ
        .OrderBy(f => f.DistanceKm ?? double.MaxValue)
        .ToList();

        return Ok(result);
    }
}
