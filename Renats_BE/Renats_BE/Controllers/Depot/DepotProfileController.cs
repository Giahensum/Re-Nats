using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Depot;

/// <summary>
/// Quản lý hồ sơ điểm thu gom (DEPOT) bao gồm tọa độ GPS
/// </summary>
[ApiController]
[Route("api/depot/profile")]
[Authorize(Roles = "DEPOT")]
public class DepotProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    public DepotProfileController(AppDbContext db) => _db = db;

    // GET /api/depot/profile
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
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

        return Ok(new
        {
            id = depot.Id,
            userId = depot.UserId,
            companyName = depot.CompanyName,
            contactPerson = depot.ContactPerson,
            contactPhone = depot.ContactPhone,
            address = depot.Address,
            city = depot.City,
            province = depot.Province,
            taxCode = depot.TaxCode,
            latitude = depot.Latitude,
            longitude = depot.Longitude,
            reputationScore = depot.ReputationScore,
            totalTransactions = depot.TotalTransactions,
            createdAt = depot.CreatedAt
        });
    }

    // PUT /api/depot/profile
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateDepotProfileDto dto)
    {
        var userIdClaim = User.FindFirst("sub")?.Value
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var depot = await _db.Depots.FirstOrDefaultAsync(d => d.UserId == userId);
        if (depot is null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                depot = new Renats_BE.Models.Depot
                {
                    UserId = user.Id,
                    CompanyName = dto.CompanyName ?? user.FullName ?? "Điểm thu gom Re-Nats",
                    ContactPerson = dto.ContactPerson ?? user.FullName ?? "Người đại diện",
                    ContactPhone = dto.ContactPhone ?? user.Phone ?? "0987654321",
                    Address = dto.Address,
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

        depot.CompanyName = dto.CompanyName ?? depot.CompanyName;
        depot.ContactPerson = dto.ContactPerson ?? depot.ContactPerson;
        depot.ContactPhone = dto.ContactPhone ?? depot.ContactPhone;
        depot.Address = dto.Address ?? depot.Address;
        depot.City = dto.City ?? depot.City;
        depot.Province = dto.Province ?? depot.Province;
        depot.TaxCode = dto.TaxCode ?? depot.TaxCode;
        
        depot.Latitude = dto.Latitude;
        depot.Longitude = dto.Longitude;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Cập nhật hồ sơ kho thành công", depot });
    }
}

public class UpdateDepotProfileDto
{
    public string? CompanyName { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? TaxCode { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
