using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models.Enums;
using System;
using System.Linq;
using System.Threading.Tasks;

using ModelUser = Renats_BE.Models.User;
using ModelSeller = Renats_BE.Models.Seller;
using ModelDepot = Renats_BE.Models.Depot;
using ModelFactory = Renats_BE.Models.Factory;
using ModelDriver = Renats_BE.Models.Driver;

namespace Renats_BE.Controllers.Admin
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "ADMIN")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        // ── GET /api/admin/stats ──────────────────────────────────────────────
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _db.Users.CountAsync();
            var activeUsers = await _db.Users.CountAsync(u => u.IsActive);
            var inactiveUsers = totalUsers - activeUsers;

            var rolesCount = await _db.Users
                .GroupBy(u => u.Role)
                .Select(g => new { Role = g.Key.ToString(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Role, x => x.Count);

            // Ensure all roles are present in the dictionary
            foreach (var role in Enum.GetNames(typeof(UserRole)))
            {
                if (!rolesCount.ContainsKey(role))
                {
                    rolesCount[role] = 0;
                }
            }

            var totalFactories = await _db.Factories.CountAsync();
            var totalDepots = await _db.Depots.CountAsync();
            var totalDrivers = await _db.Drivers.CountAsync();
            var totalSellers = await _db.Sellers.CountAsync();

            var premiumFactories = await _db.Factories.CountAsync(f => f.IsPremium);

            return Ok(new
            {
                totalUsers,
                activeUsers,
                inactiveUsers,
                rolesCount,
                totalFactories,
                totalDepots,
                totalDrivers,
                totalSellers,
                premiumFactories
            });
        }

        // ── GET /api/admin/users ──────────────────────────────────────────────
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromQuery] string? role,
            [FromQuery] bool? isActive,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;

            var query = _db.Users.AsQueryable();

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(u => u.Email.ToLower().Contains(s) || 
                                         u.FullName.ToLower().Contains(s) || 
                                         (u.Phone != null && u.Phone.ToLower().Contains(s)));
            }

            // Role filter
            if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role.ToUpper(), out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }

            // Active status filter
            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var totalItems = await query.CountAsync();
            
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Phone = u.Phone,
                    Role = u.Role.ToString(),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                totalItems,
                currentPage = page,
                pageSize,
                items = users
            });
        }

        // ── GET /api/admin/users/{id} ──────────────────────────────────────────
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            var user = await _db.Users
                .Include(u => u.Factory)
                .Include(u => u.Depot)
                .Include(u => u.Driver)
                .Include(u => u.Seller)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            var result = new AdminUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                Role = user.Role.ToString(),
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            switch (user.Role)
            {
                case UserRole.FACTORY:
                    if (user.Factory != null)
                    {
                        result.FactoryProfile = new AdminFactoryProfileDto
                        {
                            Id = user.Factory.Id,
                            CompanyName = user.Factory.CompanyName,
                            TaxCode = user.Factory.TaxCode,
                            Address = user.Factory.Address,
                            City = user.Factory.City,
                            Province = user.Factory.Province,
                            IndustrialZone = user.Factory.IndustrialZone,
                            CapacityPerMonthTon = user.Factory.CapacityPerMonthTon,
                            MinPurityRequired = user.Factory.MinPurityRequired,
                            IsPremium = user.Factory.IsPremium,
                            PremiumExpiresAt = user.Factory.PremiumExpiresAt,
                            IsProfileComplete = user.Factory.IsProfileComplete
                        };
                    }
                    break;

                case UserRole.DEPOT:
                    if (user.Depot != null)
                    {
                        result.DepotProfile = new AdminDepotProfileDto
                        {
                            Id = user.Depot.Id,
                            CompanyName = user.Depot.CompanyName,
                            TaxCode = user.Depot.TaxCode,
                            Address = user.Depot.Address,
                            City = user.Depot.City,
                            Province = user.Depot.Province,
                            ReputationScore = user.Depot.ReputationScore,
                            TotalTransactions = user.Depot.TotalTransactions
                        };
                    }
                    break;

                case UserRole.DRIVER:
                    if (user.Driver != null)
                    {
                        result.DriverProfile = new AdminDriverProfileDto
                        {
                            Id = user.Driver.Id,
                            LicenseNumber = user.Driver.LicenseNumber,
                            VehiclePlate = user.Driver.VehiclePlate,
                            VehicleType = user.Driver.VehicleType,
                            MaxCapacityKg = user.Driver.MaxCapacityKg,
                            IsAvailable = user.Driver.IsAvailable
                        };
                    }
                    break;

                case UserRole.SELLER:
                    if (user.Seller != null)
                    {
                        result.SellerProfile = new AdminSellerProfileDto
                        {
                            Id = user.Seller.Id,
                            DefaultAddress = user.Seller.DefaultAddress,
                            City = user.Seller.City,
                            Province = user.Seller.Province,
                            Bio = user.Seller.Bio,
                            TotalRequests = user.Seller.TotalRequests,
                            CompletedRequests = user.Seller.CompletedRequests,
                            AverageRating = user.Seller.AverageRating
                        };
                    }
                    break;
            }

            return Ok(result);
        }

        // ── POST /api/admin/users ──────────────────────────────────────────────
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminUserCreateUpdateDto req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { message = "Email và mật khẩu không được để trống." });

            if (req.Password.Length < 6)
                return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower()))
                return Conflict(new { message = "Email đã được sử dụng." });

            if (!Enum.TryParse<UserRole>(req.Role.ToUpper(), out var role))
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            var user = new ModelUser
            {
                Email = req.Email.ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                FullName = req.FullName,
                Phone = req.Phone,
                Role = role,
                IsActive = req.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Initialize dynamic profile based on role
            switch (role)
            {
                case UserRole.SELLER:
                    _db.Sellers.Add(new ModelSeller
                    {
                        UserId = user.Id,
                        DefaultAddress = req.SellerProfile?.DefaultAddress,
                        City = req.SellerProfile?.City,
                        Province = req.SellerProfile?.Province,
                        Bio = req.SellerProfile?.Bio,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.DEPOT:
                    _db.Depots.Add(new ModelDepot
                    {
                        UserId = user.Id,
                        CompanyName = req.DepotProfile?.CompanyName ?? req.FullName,
                        TaxCode = req.DepotProfile?.TaxCode,
                        Address = req.DepotProfile?.Address,
                        City = req.DepotProfile?.City,
                        Province = req.DepotProfile?.Province,
                        ContactPerson = req.FullName,
                        ContactPhone = req.Phone ?? "",
                        ReputationScore = req.DepotProfile?.ReputationScore ?? 0,
                        TotalTransactions = req.DepotProfile?.TotalTransactions ?? 0,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.FACTORY:
                    _db.Factories.Add(new ModelFactory
                    {
                        UserId = user.Id,
                        CompanyName = req.FactoryProfile?.CompanyName ?? req.FullName,
                        TaxCode = req.FactoryProfile?.TaxCode,
                        Address = req.FactoryProfile?.Address,
                        City = req.FactoryProfile?.City,
                        Province = req.FactoryProfile?.Province,
                        IndustrialZone = req.FactoryProfile?.IndustrialZone,
                        ContactPerson = req.FullName,
                        ContactPhone = req.Phone ?? "",
                        CapacityPerMonthTon = req.FactoryProfile?.CapacityPerMonthTon,
                        MinPurityRequired = req.FactoryProfile?.MinPurityRequired,
                        IsPremium = req.FactoryProfile?.IsPremium ?? false,
                        PremiumExpiresAt = req.FactoryProfile?.PremiumExpiresAt,
                        IsProfileComplete = req.FactoryProfile?.IsProfileComplete ?? false,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.DRIVER:
                    _db.Drivers.Add(new ModelDriver
                    {
                        UserId = user.Id,
                        LicenseNumber = req.DriverProfile?.LicenseNumber,
                        VehiclePlate = req.DriverProfile?.VehiclePlate,
                        VehicleType = req.DriverProfile?.VehicleType,
                        MaxCapacityKg = req.DriverProfile?.MaxCapacityKg,
                        IsAvailable = req.DriverProfile?.IsAvailable ?? true,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;
            }

            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new { message = "Tạo người dùng thành công.", userId = user.Id });
        }

        // ── PUT /api/admin/users/{id} ──────────────────────────────────────────
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] AdminUserCreateUpdateDto req)
        {
            var user = await _db.Users
                .Include(u => u.Factory)
                .Include(u => u.Depot)
                .Include(u => u.Driver)
                .Include(u => u.Seller)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            if (await _db.Users.AnyAsync(u => u.Email.ToLower() == req.Email.ToLower() && u.Id != id))
                return Conflict(new { message = "Email đã được sử dụng bởi người dùng khác." });

            if (!Enum.TryParse<UserRole>(req.Role.ToUpper(), out var requestedRole))
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            // Update core details
            user.Email = req.Email.ToLower();
            user.FullName = req.FullName;
            user.Phone = req.Phone;
            user.IsActive = req.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.Password))
            {
                if (req.Password.Length < 6)
                    return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự." });
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            }

            // Check if role has changed
            if (user.Role != requestedRole)
            {
                // Delete old profile
                DeleteUserProfileInternal(user);

                // Update Role
                user.Role = requestedRole;

                // Create new profile
                InitializeUserProfileInternal(user, req);
            }
            else
            {
                // Update existing profile details
                switch (user.Role)
                {
                    case UserRole.SELLER:
                        if (user.Seller == null)
                        {
                            user.Seller = new ModelSeller { UserId = user.Id, CreatedAt = DateTime.UtcNow };
                            _db.Sellers.Add(user.Seller);
                        }
                        user.Seller.DefaultAddress = req.SellerProfile?.DefaultAddress ?? user.Seller.DefaultAddress;
                        user.Seller.City = req.SellerProfile?.City ?? user.Seller.City;
                        user.Seller.Province = req.SellerProfile?.Province ?? user.Seller.Province;
                        user.Seller.Bio = req.SellerProfile?.Bio ?? user.Seller.Bio;
                        break;

                    case UserRole.DEPOT:
                        if (user.Depot == null)
                        {
                            user.Depot = new ModelDepot { UserId = user.Id, CreatedAt = DateTime.UtcNow };
                            _db.Depots.Add(user.Depot);
                        }
                        user.Depot.CompanyName = req.DepotProfile?.CompanyName ?? user.Depot.CompanyName;
                        user.Depot.TaxCode = req.DepotProfile?.TaxCode ?? user.Depot.TaxCode;
                        user.Depot.Address = req.DepotProfile?.Address ?? user.Depot.Address;
                        user.Depot.City = req.DepotProfile?.City ?? user.Depot.City;
                        user.Depot.Province = req.DepotProfile?.Province ?? user.Depot.Province;
                        user.Depot.ContactPerson = req.FullName;
                        user.Depot.ContactPhone = req.Phone ?? user.Depot.ContactPhone;
                        user.Depot.ReputationScore = req.DepotProfile?.ReputationScore ?? user.Depot.ReputationScore;
                        user.Depot.TotalTransactions = req.DepotProfile?.TotalTransactions ?? user.Depot.TotalTransactions;
                        break;

                    case UserRole.FACTORY:
                        if (user.Factory == null)
                        {
                            user.Factory = new ModelFactory { UserId = user.Id, CreatedAt = DateTime.UtcNow };
                            _db.Factories.Add(user.Factory);
                        }
                        user.Factory.CompanyName = req.FactoryProfile?.CompanyName ?? user.Factory.CompanyName;
                        user.Factory.TaxCode = req.FactoryProfile?.TaxCode ?? user.Factory.TaxCode;
                        user.Factory.Address = req.FactoryProfile?.Address ?? user.Factory.Address;
                        user.Factory.City = req.FactoryProfile?.City ?? user.Factory.City;
                        user.Factory.Province = req.FactoryProfile?.Province ?? user.Factory.Province;
                        user.Factory.IndustrialZone = req.FactoryProfile?.IndustrialZone ?? user.Factory.IndustrialZone;
                        user.Factory.ContactPerson = req.FullName;
                        user.Factory.ContactPhone = req.Phone ?? user.Factory.ContactPhone;
                        user.Factory.CapacityPerMonthTon = req.FactoryProfile?.CapacityPerMonthTon ?? user.Factory.CapacityPerMonthTon;
                        user.Factory.MinPurityRequired = req.FactoryProfile?.MinPurityRequired ?? user.Factory.MinPurityRequired;
                        user.Factory.IsPremium = req.FactoryProfile?.IsPremium ?? user.Factory.IsPremium;
                        user.Factory.PremiumExpiresAt = req.FactoryProfile?.PremiumExpiresAt ?? user.Factory.PremiumExpiresAt;
                        user.Factory.IsProfileComplete = req.FactoryProfile?.IsProfileComplete ?? user.Factory.IsProfileComplete;
                        break;

                    case UserRole.DRIVER:
                        if (user.Driver == null)
                        {
                            user.Driver = new ModelDriver { UserId = user.Id, CreatedAt = DateTime.UtcNow };
                            _db.Drivers.Add(user.Driver);
                        }
                        user.Driver.LicenseNumber = req.DriverProfile?.LicenseNumber ?? user.Driver.LicenseNumber;
                        user.Driver.VehiclePlate = req.DriverProfile?.VehiclePlate ?? user.Driver.VehiclePlate;
                        user.Driver.VehicleType = req.DriverProfile?.VehicleType ?? user.Driver.VehicleType;
                        user.Driver.MaxCapacityKg = req.DriverProfile?.MaxCapacityKg ?? user.Driver.MaxCapacityKg;
                        user.Driver.IsAvailable = req.DriverProfile?.IsAvailable ?? user.Driver.IsAvailable;
                        break;
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Cập nhật người dùng thành công." });
        }

        // ── DELETE /api/admin/users/{id} ───────────────────────────────────────
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _db.Users
                .Include(u => u.Factory)
                .Include(u => u.Depot)
                .Include(u => u.Driver)
                .Include(u => u.Seller)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            // Safety Checks: Do not delete users with active historical transactions to preserve database referential integrity
            switch (user.Role)
            {
                case UserRole.SELLER:
                    if (user.Seller != null && await _db.PickupRequests.AnyAsync(r => r.SellerId == user.Seller.Id))
                    {
                        return BadRequest(new { message = "Không thể xóa người dùng này vì họ có dữ liệu yêu cầu thu gom (Pickup Requests) lịch sử trong hệ thống. Hãy vô hiệu hóa (Deactivate) tài khoản của họ thay thế." });
                    }
                    break;

                case UserRole.DEPOT:
                    if (user.Depot != null && await _db.InventoryBatches.AnyAsync(b => b.DepotId == user.Depot.Id))
                    {
                        return BadRequest(new { message = "Không thể xóa người dùng này vì họ có dữ liệu lô hàng (Inventory Batches) lịch sử trong hệ thống. Hãy vô hiệu hóa (Deactivate) tài khoản của họ thay thế." });
                    }
                    break;

                case UserRole.FACTORY:
                    if (user.Factory != null && (await _db.BatchBids.AnyAsync(b => b.FactoryId == user.Factory.Id) || await _db.BatchOrders.AnyAsync(o => o.FactoryId == user.Factory.Id)))
                    {
                        return BadRequest(new { message = "Không thể xóa người dùng này vì họ có dữ liệu đấu thầu (Bids) hoặc đơn hàng (Orders) lịch sử trong hệ thống. Hãy vô hiệu hóa (Deactivate) tài khoản của họ thay thế." });
                    }
                    break;

                case UserRole.DRIVER:
                    if (user.Driver != null && await _db.TransportJobs.AnyAsync(j => j.DriverId == user.Driver.Id))
                    {
                        return BadRequest(new { message = "Không thể xóa người dùng này vì họ có dữ liệu chuyến xe vận chuyển (Transport Jobs) lịch sử trong hệ thống. Hãy vô hiệu hóa (Deactivate) tài khoản của họ thay thế." });
                    }
                    break;
            }

            // Safely delete profile first
            DeleteUserProfileInternal(user);

            // Delete user
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa người dùng thành công." });
        }

        // ── Helper Methods for profile swapping ────────────────────────────────
        private void DeleteUserProfileInternal(ModelUser user)
        {
            if (user.Seller != null) _db.Sellers.Remove(user.Seller);
            if (user.Depot != null) _db.Depots.Remove(user.Depot);
            if (user.Factory != null) _db.Factories.Remove(user.Factory);
            if (user.Driver != null) _db.Drivers.Remove(user.Driver);
        }

        private void InitializeUserProfileInternal(ModelUser user, AdminUserCreateUpdateDto req)
        {
            switch (user.Role)
            {
                case UserRole.SELLER:
                    _db.Sellers.Add(new ModelSeller
                    {
                        UserId = user.Id,
                        DefaultAddress = req.SellerProfile?.DefaultAddress,
                        City = req.SellerProfile?.City,
                        Province = req.SellerProfile?.Province,
                        Bio = req.SellerProfile?.Bio,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.DEPOT:
                    _db.Depots.Add(new ModelDepot
                    {
                        UserId = user.Id,
                        CompanyName = req.DepotProfile?.CompanyName ?? user.FullName,
                        TaxCode = req.DepotProfile?.TaxCode,
                        Address = req.DepotProfile?.Address,
                        City = req.DepotProfile?.City,
                        Province = req.DepotProfile?.Province,
                        ContactPerson = user.FullName,
                        ContactPhone = user.Phone ?? "",
                        ReputationScore = req.DepotProfile?.ReputationScore ?? 0,
                        TotalTransactions = req.DepotProfile?.TotalTransactions ?? 0,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.FACTORY:
                    _db.Factories.Add(new ModelFactory
                    {
                        UserId = user.Id,
                        CompanyName = req.FactoryProfile?.CompanyName ?? user.FullName,
                        TaxCode = req.FactoryProfile?.TaxCode,
                        Address = req.FactoryProfile?.Address,
                        City = req.FactoryProfile?.City,
                        Province = req.FactoryProfile?.Province,
                        IndustrialZone = req.FactoryProfile?.IndustrialZone,
                        ContactPerson = user.FullName,
                        ContactPhone = user.Phone ?? "",
                        CapacityPerMonthTon = req.FactoryProfile?.CapacityPerMonthTon,
                        MinPurityRequired = req.FactoryProfile?.MinPurityRequired,
                        IsPremium = req.FactoryProfile?.IsPremium ?? false,
                        PremiumExpiresAt = req.FactoryProfile?.PremiumExpiresAt,
                        IsProfileComplete = req.FactoryProfile?.IsProfileComplete ?? false,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;

                case UserRole.DRIVER:
                    _db.Drivers.Add(new ModelDriver
                    {
                        UserId = user.Id,
                        LicenseNumber = req.DriverProfile?.LicenseNumber,
                        VehiclePlate = req.DriverProfile?.VehiclePlate,
                        VehicleType = req.DriverProfile?.VehicleType,
                        MaxCapacityKg = req.DriverProfile?.MaxCapacityKg,
                        IsAvailable = req.DriverProfile?.IsAvailable ?? true,
                        CreatedAt = DateTime.UtcNow
                    });
                    break;
            }
        }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public class AdminUserListDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminUserDetailDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public AdminFactoryProfileDto? FactoryProfile { get; set; }
        public AdminDepotProfileDto? DepotProfile { get; set; }
        public AdminDriverProfileDto? DriverProfile { get; set; }
        public AdminSellerProfileDto? SellerProfile { get; set; }
    }

    public class AdminFactoryProfileDto
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? TaxCode { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? IndustrialZone { get; set; }
        public decimal? CapacityPerMonthTon { get; set; }
        public decimal? MinPurityRequired { get; set; }
        public bool IsPremium { get; set; }
        public DateTime? PremiumExpiresAt { get; set; }
        public bool IsProfileComplete { get; set; }
    }

    public class AdminDepotProfileDto
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? TaxCode { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public int ReputationScore { get; set; }
        public int TotalTransactions { get; set; }
    }

    public class AdminDriverProfileDto
    {
        public Guid Id { get; set; }
        public string? LicenseNumber { get; set; }
        public string? VehiclePlate { get; set; }
        public string? VehicleType { get; set; }
        public decimal? MaxCapacityKg { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class AdminSellerProfileDto
    {
        public Guid Id { get; set; }
        public string? DefaultAddress { get; set; }
        public string? City { get; set; }
        public string? Province { get; set; }
        public string? Bio { get; set; }
        public int TotalRequests { get; set; }
        public int CompletedRequests { get; set; }
        public decimal? AverageRating { get; set; }
    }

    public class AdminUserCreateUpdateDto
    {
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        public AdminFactoryProfileDto? FactoryProfile { get; set; }
        public AdminDepotProfileDto? DepotProfile { get; set; }
        public AdminDriverProfileDto? DriverProfile { get; set; }
        public AdminSellerProfileDto? SellerProfile { get; set; }
    }
}
