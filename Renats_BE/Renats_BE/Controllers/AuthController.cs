using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Renats_BE.Data;
using Renats_BE.Models.Auth;
using Renats_BE.Models.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using ModelUser = Renats_BE.Models.User;
using ModelSeller = Renats_BE.Models.Seller;
using ModelDepot = Renats_BE.Models.Depot;
using ModelFactory = Renats_BE.Models.Factory;
using ModelDriver = Renats_BE.Models.Driver;

namespace Renats_BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(AppDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email và mật khẩu không được để trống." });

        if (req.Password.Length < 6)
            return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { message = "Email đã được sử dụng." });

        if (!Enum.TryParse<UserRole>(req.Role.ToUpper(), out var role))
            return BadRequest(new { message = "Vai trò không hợp lệ. Chọn: ADMIN, DEPOT, FACTORY, DRIVER, SELLER." });

        var user = new ModelUser
        {
            Email        = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FullName     = req.FullName,
            Phone        = req.Phone,
            Role         = role,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Tạo profile theo vai trò
        switch (role)
        {
            case UserRole.SELLER:
                _db.Sellers.Add(new ModelSeller
                {
                    UserId         = user.Id,
                    DefaultAddress = req.DefaultAddress,
                    City           = req.City,
                    Province       = req.Province,
                    Bio            = req.Bio,
                });
                break;

            case UserRole.DEPOT:
                if (string.IsNullOrWhiteSpace(req.CompanyName))
                    return BadRequest(new { message = "Tên công ty là bắt buộc với vai trò DEPOT." });
                _db.Depots.Add(new ModelDepot
                {
                    UserId        = user.Id,
                    CompanyName   = req.CompanyName!,
                    TaxCode       = req.TaxCode,
                    Address       = req.Address,
                    City          = req.City,
                    Province      = req.Province,
                    ContactPerson = req.ContactPerson,
                    ContactPhone  = req.ContactPhone,
                });
                break;

            case UserRole.FACTORY:
                if (string.IsNullOrWhiteSpace(req.CompanyName))
                    return BadRequest(new { message = "Tên công ty là bắt buộc với vai trò FACTORY." });
                _db.Factories.Add(new ModelFactory
                {
                    UserId        = user.Id,
                    CompanyName   = req.CompanyName!,
                    TaxCode       = req.TaxCode,
                    Address       = req.Address,
                    City          = req.City,
                    Province      = req.Province,
                    ContactPerson = req.ContactPerson,
                    ContactPhone  = req.ContactPhone,
                });
                break;

            case UserRole.DRIVER:
                _db.Drivers.Add(new ModelDriver
                {
                    UserId        = user.Id,
                    LicenseNumber = req.LicenseNumber,
                    VehiclePlate  = req.VehiclePlate,
                    VehicleType   = req.VehicleType,
                    MaxCapacityKg = req.MaxCapacityKg,
                });
                break;
        }

        await _db.SaveChangesAsync();

        return Ok(BuildAuthResponse(user));
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email và mật khẩu không được để trống." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());

        // Dùng BCrypt.Verify để so khớp mật khẩu (chống timing attack)
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

        if (!user.IsActive)
            return StatusCode(403, new { message = "Tài khoản đã bị vô hiệu hóa." });

        return Ok(BuildAuthResponse(user));
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    // Lấy thông tin User hiện tại từ JWT đã xác thực bởi Middleware
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Token không hợp lệ." });

        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive) return Unauthorized();

        return Ok(BuildAuthResponse(user));
    }

    // ── POST /api/auth/google-login ──────────────────────────────────────────
    [HttpPost("google-login")]
    public async Task<IActionResult> GoogleLogin([FromBody] SocialLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { message = "Token không hợp lệ." });

        // Xác thực ID Token của Google bằng cách gọi Google Tokeninfo API
        var client   = _httpClientFactory.CreateClient();
        var response = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={req.Token}");

        if (!response.IsSuccessStatusCode)
            return Unauthorized(new { message = "Google Token không hợp lệ hoặc đã hết hạn." });

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        // Kiểm tra Token dành cho đúng Google Client ID của ứng dụng này
        var aud = root.GetProperty("aud").GetString();
        if (aud != _config["SocialAuth:GoogleClientId"])
            return Unauthorized(new { message = "Google Token không phải của ứng dụng này." });

        var email    = root.GetProperty("email").GetString()?.ToLower() ?? "";
        var fullName = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "" : email;
        var picture  = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;

        return await FindOrCreateSocialUser(email, fullName, picture, "GOOGLE", req.Role);
    }

    // ── POST /api/auth/facebook-login ────────────────────────────────────────
    [HttpPost("facebook-login")]
    public async Task<IActionResult> FacebookLogin([FromBody] SocialLoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { message = "Token không hợp lệ." });

        // Xác thực Access Token qua Facebook Graph API
        var appId     = _config["SocialAuth:FacebookAppId"];
        var appSecret = _config["SocialAuth:FacebookAppSecret"];
        var client    = _httpClientFactory.CreateClient();

        // Bước 1: Lấy App Access Token để debug user token
        var appTokenRes  = await client.GetAsync($"https://graph.facebook.com/oauth/access_token?client_id={appId}&client_secret={appSecret}&grant_type=client_credentials");
        var appTokenJson = await appTokenRes.Content.ReadAsStringAsync();
        using var appDoc = JsonDocument.Parse(appTokenJson);
        var appToken     = appDoc.RootElement.GetProperty("access_token").GetString();

        // Bước 2: Kiểm tra tính hợp lệ của User Access Token
        var debugRes  = await client.GetAsync($"https://graph.facebook.com/debug_token?input_token={req.Token}&access_token={appToken}");
        var debugJson = await debugRes.Content.ReadAsStringAsync();
        using var debugDoc = JsonDocument.Parse(debugJson);
        var data       = debugDoc.RootElement.GetProperty("data");
        var isValid    = data.GetProperty("is_valid").GetBoolean();

        if (!isValid)
            return Unauthorized(new { message = "Facebook Token không hợp lệ hoặc đã hết hạn." });

        // Bước 3: Lấy thông tin User từ Graph API
        var userRes  = await client.GetAsync($"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={req.Token}");
        var userJson = await userRes.Content.ReadAsStringAsync();
        using var userDoc = JsonDocument.Parse(userJson);
        var userRoot      = userDoc.RootElement;

        // Facebook đôi khi không trả về email nếu User không cấp quyền
        if (!userRoot.TryGetProperty("email", out var emailProp))
            return BadRequest(new { message = "Tài khoản Facebook chưa liên kết email. Vui lòng dùng cách đăng nhập khác." });

        var email    = emailProp.GetString()?.ToLower() ?? "";
        var fullName = userRoot.TryGetProperty("name", out var nameProp2) ? nameProp2.GetString() ?? "" : email;

        return await FindOrCreateSocialUser(email, fullName, null, "FACEBOOK", req.Role);
    }

    // ────────────────────────── Helpers ──────────────────────────────────────

    /// <summary>
    /// Tìm User theo email. Nếu chưa có thì tự đăng ký mới với role SELLER (hoặc role chỉ định).
    /// </summary>
    private async Task<IActionResult> FindOrCreateSocialUser(
        string email, string fullName, string? avatarUrl, string provider, string? requestedRole)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = $"Không lấy được email từ tài khoản {provider}." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            // Tự động tạo tài khoản mới → mặc định vai trò SELLER
            // Nếu Frontend truyền Role (ví dụ qua bước chọn role UI) thì dùng theo
            if (!Enum.TryParse<UserRole>(requestedRole?.ToUpper() ?? "SELLER", out var role))
                role = UserRole.SELLER;

            user = new ModelUser
            {
                Email        = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Mật khẩu ngẫu nhiên, không dùng trực tiếp
                FullName     = fullName,
                Role         = role,
                IsActive     = true,
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Tạo Seller profile mặc định
            if (role == UserRole.SELLER)
            {
                _db.Sellers.Add(new ModelSeller { UserId = user.Id });
                await _db.SaveChangesAsync();
            }
        }
        else if (!user.IsActive)
        {
            return StatusCode(403, new { message = "Tài khoản đã bị vô hiệu hóa." });
        }

        return Ok(BuildAuthResponse(user));
    }

    /// <summary>
    /// Tạo JWT Token chuẩn có chữ ký (Signed JWT) và đóng gói AuthResponse.
    /// </summary>
    private AuthResponse BuildAuthResponse(ModelUser user)
    {
        var token = GenerateJwtToken(user);
        return new AuthResponse
        {
            Token    = token,
            Role     = user.Role.ToString(),
            UserId   = user.Id,
            FullName = user.FullName,
            Email    = user.Email,
        };
    }

    /// <summary>
    /// Tạo JWT chuẩn RFC 7519 với chữ ký HMAC-SHA256, có thời hạn và Claims đầy đủ.
    /// </summary>
    private string GenerateJwtToken(ModelUser user)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpireMinutes"] ?? "1440"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier,     user.Id.ToString()),
            new Claim(ClaimTypes.Email,              user.Email),
            new Claim(ClaimTypes.Role,               user.Role.ToString()),
            new Claim(ClaimTypes.Name,               user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
