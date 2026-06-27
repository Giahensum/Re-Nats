using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;
using System.Security.Cryptography;
using System.Text;

namespace Renats_BE.Data;

public static class DbSeeder
{
    // ── Thông tin tài khoản Admin ──────────────────────────────
    private const string AdminEmail    = "admin@renats.vn";
    private const string AdminPassword = "Admin@123";
    private const string AdminFullName = "Quản trị viên Re-Nats";
    private const string AdminPhone    = "0909000001";
    // ──────────────────────────────────────────────────────────

    public static async Task SeedAsync(AppDbContext db)
    {
        // Chạy migration nếu chưa chạy
        await db.Database.MigrateAsync();

        // Kiểm tra admin đã tồn tại chưa
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == AdminEmail);
        if (admin != null)
        {
            if (!admin.PasswordHash.StartsWith("$2") || !BCrypt.Net.BCrypt.Verify(AdminPassword, admin.PasswordHash))
            {
                admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword);
                await db.SaveChangesAsync();
                Console.WriteLine("✅ [Seeder] Đã cập nhật/reset mật khẩu Admin sang BCrypt.");
            }
            else
            {
                Console.WriteLine("✅ [Seeder] Tài khoản admin đã tồn tại với mật khẩu BCrypt.");
            }
            return;
        }

        var newAdmin = new User
        {
            Email        = AdminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(AdminPassword),
            FullName     = AdminFullName,
            Phone        = AdminPhone,
            Role         = UserRole.ADMIN,
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
        };

        db.Users.Add(newAdmin);
        await db.SaveChangesAsync();

        Console.WriteLine("🌱 [Seeder] Đã tạo tài khoản admin thành công!");
        Console.WriteLine($"   📧 Email   : {AdminEmail}");
        Console.WriteLine($"   🔑 Password: {AdminPassword}");
        Console.WriteLine($"   👤 Tên     : {AdminFullName}");
    }
}
