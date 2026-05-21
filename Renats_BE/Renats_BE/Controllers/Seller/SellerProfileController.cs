using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Renats_BE.DTOs.Seller;
using Renats_BE.Services.Interfaces;

namespace Renats_BE.Controllers.Seller;

[ApiController]
[Route("api/seller/profile")]
[Authorize(Roles = "SELLER")]
public class SellerProfileController : ControllerBase
{
    private readonly ISellerService _service;
    public SellerProfileController(ISellerService service) => _service = service;

    /// <summary>Lấy hồ sơ seller</summary>
    [HttpGet("{sellerId:guid}")]
    public async Task<IActionResult> GetProfile(Guid sellerId)
    {
        var result = await _service.GetProfileAsync(sellerId);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Cập nhật hồ sơ</summary>
    [HttpPut("{sellerId:guid}")]
    public async Task<IActionResult> UpdateProfile(Guid sellerId, [FromBody] UpdateProfileDto dto)
    {
        var ok = await _service.UpdateProfileAsync(sellerId, dto);
        return ok ? Ok(new { message = "Cập nhật thành công" }) : NotFound();
    }

    /// <summary>Đổi mật khẩu</summary>
    [HttpPatch("{sellerId:guid}/change-password")]
    public async Task<IActionResult> ChangePassword(Guid sellerId, [FromBody] ChangePasswordDto dto)
    {
        if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
            return BadRequest("Mật khẩu mới phải có ít nhất 6 ký tự");

        var ok = await _service.ChangePasswordAsync(sellerId, dto.OldPassword, dto.NewPassword);
        if (!ok) return BadRequest("Mật khẩu hiện tại không đúng hoặc tài khoản không tồn tại");
        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    /// <summary>Lấy thống kê yêu cầu của seller</summary>
    [HttpGet("{sellerId:guid}/stats")]
    public async Task<IActionResult> GetStats(Guid sellerId)
    {
        var result = await _service.GetStatsAsync(sellerId);
        return Ok(result);
    }

    /// <summary>Vô hiệu hóa tài khoản (soft delete)</summary>
    [HttpDelete("{sellerId:guid}")]
    public async Task<IActionResult> DeleteAccount(Guid sellerId)
    {
        var ok = await _service.DeleteAccountAsync(sellerId);
        return ok ? Ok(new { message = "Tài khoản đã bị vô hiệu hóa" }) : NotFound();
    }
}
