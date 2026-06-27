using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;
using Renats_BE.Services.Interfaces;

namespace Renats_BE.Controllers.Factory;

/// <summary>
/// Quản lý hồ sơ nhà máy tái chế: thông tin doanh nghiệp, loại vật liệu, giấy tờ chứng nhận.
/// </summary>
[ApiController]
[Route("api/factory/profile")]
[Authorize(Roles = "FACTORY")]
public class FactoryProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICloudinaryService _cloudinary;

    public FactoryProfileController(AppDbContext db, ICloudinaryService cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    // ── Helper: lấy userId từ JWT ────────────────────────────────────────────
    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value
                 ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    // ── Helper: lấy hoặc tạo mới Factory record ─────────────────────────────
    private async Task<Models.Factory?> GetOrCreateFactory(Guid userId)
    {
        var factory = await _db.Factories.FirstOrDefaultAsync(f => f.UserId == userId);
        if (factory is null)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user is null) return null;

            factory = new Models.Factory
            {
                UserId      = userId,
                CompanyName = user.FullName ?? "Nhà máy tái chế",
                ContactPerson = user.FullName,
                ContactPhone  = user.Phone,
                CreatedAt   = DateTime.UtcNow
            };
            _db.Factories.Add(factory);
            await _db.SaveChangesAsync();
        }
        return factory;
    }

    // ────────────────────────────────────────────────────────────────────────
    // GET /api/factory/profile
    // ────────────────────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var factory = await GetOrCreateFactory(userId.Value);
        if (factory is null) return NotFound("Không tìm thấy tài khoản nhà máy.");

        return Ok(MapToDto(factory));
    }

    // ────────────────────────────────────────────────────────────────────────
    // PUT /api/factory/profile
    // ────────────────────────────────────────────────────────────────────────
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateFactoryProfileDto dto)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var factory = await GetOrCreateFactory(userId.Value);
        if (factory is null) return NotFound("Không tìm thấy tài khoản nhà máy.");

        // Cập nhật thông tin cơ bản
        if (!string.IsNullOrWhiteSpace(dto.CompanyName))       factory.CompanyName    = dto.CompanyName;
        if (!string.IsNullOrWhiteSpace(dto.TaxCode))           factory.TaxCode        = dto.TaxCode;
        if (!string.IsNullOrWhiteSpace(dto.Address))           factory.Address        = dto.Address;
        if (!string.IsNullOrWhiteSpace(dto.City))              factory.City           = dto.City;
        if (!string.IsNullOrWhiteSpace(dto.Province))          factory.Province       = dto.Province;
        if (!string.IsNullOrWhiteSpace(dto.IndustrialZone))    factory.IndustrialZone = dto.IndustrialZone;
        if (!string.IsNullOrWhiteSpace(dto.ContactPerson))     factory.ContactPerson  = dto.ContactPerson;
        if (!string.IsNullOrWhiteSpace(dto.ContactPhone))      factory.ContactPhone   = dto.ContactPhone;
        if (dto.Latitude.HasValue)                              factory.Latitude       = dto.Latitude;
        if (dto.Longitude.HasValue)                            factory.Longitude      = dto.Longitude;

        // Cập nhật vật liệu tái chế
        if (!string.IsNullOrWhiteSpace(dto.PrimaryMaterialType))
        {
            if (!Enum.TryParse<MaterialType>(dto.PrimaryMaterialType, true, out var mat))
                return BadRequest($"Loại vật liệu không hợp lệ: {dto.PrimaryMaterialType}");
            factory.PrimaryMaterialType = mat;
        }
        if (dto.AcceptedMaterialTypes != null)
            factory.AcceptedMaterialTypes = string.Join(",", dto.AcceptedMaterialTypes);
        if (dto.CapacityPerMonthTon.HasValue)
            factory.CapacityPerMonthTon = dto.CapacityPerMonthTon;
        if (dto.MinPurityRequired.HasValue)
            factory.MinPurityRequired = dto.MinPurityRequired;

        // Cập nhật giấy tờ chứng nhận (nếu có URL truyền lên)
        if (!string.IsNullOrWhiteSpace(dto.BusinessLicenseUrl))
            factory.BusinessLicenseUrl = dto.BusinessLicenseUrl;
        if (!string.IsNullOrWhiteSpace(dto.EnvironmentLicenseUrl))
            factory.EnvironmentLicenseUrl = dto.EnvironmentLicenseUrl;

        // Đánh dấu hoàn thiện profile khi:
        // 1) Đã chọn loại vật liệu chính VÀ
        // 2) Đã có ít nhất 1 giấy tờ upload
        bool hasDocument = !string.IsNullOrEmpty(factory.BusinessLicenseUrl)
                        || !string.IsNullOrEmpty(factory.EnvironmentLicenseUrl);
        if (factory.PrimaryMaterialType.HasValue && hasDocument)
            factory.IsProfileComplete = true;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Cập nhật hồ sơ nhà máy thành công.",
            profile = MapToDto(factory)
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/factory/profile/upload-temp
    // Multipart form: field "file"
    // ────────────────────────────────────────────────────────────────────────
    [HttpPost("upload-temp")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadTemp(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File không hợp lệ hoặc rỗng.");

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File vượt quá kích thước cho phép (10 MB).");

        var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExt.Contains(ext))
            return BadRequest("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP) hoặc PDF.");

        try
        {
            var url = await _cloudinary.UploadFileAsync(file, "factory-documents-temp");
            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi upload file: {ex.Message}");
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // POST /api/factory/profile/upload-document
    // Multipart form: field "file" + field "documentType" (business_license | environment_license)
    // ────────────────────────────────────────────────────────────────────────
    [HttpPost("upload-document")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentDto dto)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var file = dto.File;
        var documentType = dto.DocumentType;

        if (file == null || file.Length == 0)
            return BadRequest("File không hợp lệ hoặc rỗng.");

        // Giới hạn 10 MB
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File vượt quá kích thước cho phép (10 MB).");

        // Chỉ cho phép ảnh và PDF
        var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExt.Contains(ext))
            return BadRequest("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP) hoặc PDF.");

        string folder = documentType == "environment_license"
            ? "factory-documents/environment"
            : "factory-documents/business";

        string url;
        try
        {
            url = await _cloudinary.UploadFileAsync(file, folder);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi upload file: {ex.Message}");
        }

        var factory = await GetOrCreateFactory(userId.Value);
        if (factory is null) return NotFound();

        if (documentType == "environment_license")
            factory.EnvironmentLicenseUrl = url;
        else
            factory.BusinessLicenseUrl = url;

        // Tự động mark profile hoàn chỉnh khi có vật liệu chính + ít nhất 1 giấy tờ
        if (factory.PrimaryMaterialType.HasValue)
            factory.IsProfileComplete = true;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message    = "Upload giấy tờ thành công.",
            url,
            isProfileComplete = factory.IsProfileComplete,
            profile    = MapToDto(factory)
        });
    }

    // ── Mapper ───────────────────────────────────────────────────────────────
    private static object MapToDto(Models.Factory f) => new
    {
        id                    = f.Id,
        userId                = f.UserId,
        companyName           = f.CompanyName,
        taxCode               = f.TaxCode,
        address               = f.Address,
        city                  = f.City,
        province              = f.Province,
        industrialZone        = f.IndustrialZone,
        latitude              = f.Latitude,
        longitude             = f.Longitude,
        contactPerson         = f.ContactPerson,
        contactPhone          = f.ContactPhone,
        primaryMaterialType   = f.PrimaryMaterialType?.ToString(),
        acceptedMaterialTypes = string.IsNullOrEmpty(f.AcceptedMaterialTypes)
                                    ? Array.Empty<string>()
                                    : f.AcceptedMaterialTypes.Split(',', StringSplitOptions.RemoveEmptyEntries),
        capacityPerMonthTon   = f.CapacityPerMonthTon,
        minPurityRequired     = f.MinPurityRequired,
        businessLicenseUrl    = f.BusinessLicenseUrl,
        environmentLicenseUrl = f.EnvironmentLicenseUrl,
        isProfileComplete     = f.IsProfileComplete,
        isPremium             = f.IsPremium,
        premiumExpiresAt      = f.PremiumExpiresAt,
        createdAt             = f.CreatedAt
    };
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
public class UpdateFactoryProfileDto
{
    public string? CompanyName           { get; set; }
    public string? TaxCode               { get; set; }
    public string? Address               { get; set; }
    public string? City                  { get; set; }
    public string? Province              { get; set; }
    public string? IndustrialZone        { get; set; }
    public decimal? Latitude             { get; set; }
    public decimal? Longitude            { get; set; }
    public string? ContactPerson         { get; set; }
    public string? ContactPhone          { get; set; }
    // Vật liệu
    public string? PrimaryMaterialType   { get; set; }
    public List<string>? AcceptedMaterialTypes { get; set; }
    public decimal? CapacityPerMonthTon  { get; set; }
    public decimal? MinPurityRequired    { get; set; }
    public string? BusinessLicenseUrl    { get; set; }
    public string? EnvironmentLicenseUrl { get; set; }
}

public class UploadDocumentDto
{
    public IFormFile File { get; set; } = null!;
    public string DocumentType { get; set; } = null!;
}
