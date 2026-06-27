using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // ── 0. Đảm bảo các giá trị enum tồn tại trong PostgreSQL ────────────────
        await EnsureEnumValuesAsync(db);

        // ── QUAN TRỌNG: Chỉ seed 1 lần duy nhất khi database chưa có dữ liệu mẫu.
        // Không bao giờ xóa dữ liệu đã tồn tại. Điều này đảm bảo các thay đổi
        // của user (cập nhật profile, tạo request, v.v.) không bị mất khi restart server.
        var seededEmails = new[] { "giango9981@gmail.com", "factory@renats.vn", "depot1@renats.vn", "depot2@renats.vn", "depot3@renats.vn", "driver@renats.vn" };
        var alreadySeeded = await db.Users.AnyAsync(u => seededEmails.Contains(u.Email));
        if (alreadySeeded)
        {
            Console.WriteLine("ℹ️  [Seeder] Dữ liệu mẫu đã tồn tại, bỏ qua seed để giữ nguyên dữ liệu thật.");

            // Chỉ hash lại hoặc cập nhật password nếu chưa được BCrypt hash hoặc mật khẩu không khớp với Renats@2025
            var usersToFix = await db.Users.Where(u => seededEmails.Contains(u.Email)).ToListAsync();
            foreach (var u in usersToFix)
            {
                if (!u.PasswordHash.StartsWith("$2") || !BCrypt.Net.BCrypt.Verify("Renats@2025", u.PasswordHash))
                {
                    u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Renats@2025");
                    db.Entry(u).State = EntityState.Modified;
                }
            }
            if (db.ChangeTracker.HasChanges())
            {
                await db.SaveChangesAsync();
                Console.WriteLine("✅ [Seeder] Đã cập nhật/reset mật khẩu các tài khoản mẫu thành Renats@2025.");
            }
            return; // Thoát sớm, không làm gì thêm
        }

        // Chỉ chạy đến đây nếu database CHƯA có dữ liệu mẫu (lần đầu tiên)
        Console.WriteLine("🌱 [Seeder] Lần đầu khởi động, bắt đầu seed dữ liệu mẫu...");

        // ── 1. Seed Seller ──────────────────────────────────────────────────────
        await SeedSellerAsync(db);

        // ── 2. Seed Factory + Depots + Batches ─────────────────────────────────
        await SeedFactoryAndDepotsAsync(db);

        // Hash password cho các tài khoản mới seed
        var newSeededUsers = await db.Users.Where(u => seededEmails.Contains(u.Email)).ToListAsync();
        foreach (var u in newSeededUsers)
        {
            if (!u.PasswordHash.StartsWith("$2") || !BCrypt.Net.BCrypt.Verify("Renats@2025", u.PasswordHash))
            {
                u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Renats@2025");
                db.Entry(u).State = EntityState.Modified;
            }
        }
        if (db.ChangeTracker.HasChanges())
        {
            await db.SaveChangesAsync();
            Console.WriteLine("✅ [Seeder] Đã BCrypt-hash tất cả tài khoản mẫu.");
        }
    }

    // ── 0. Thêm enum values vào PostgreSQL enum type ─────────────────────────────
    private static async Task EnsureEnumValuesAsync(AppDbContext db)
    {
        var sql = @"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SELLER' AND enumtypid = 'user_role'::regtype) THEN
                    ALTER TYPE user_role ADD VALUE 'SELLER';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FACTORY' AND enumtypid = 'user_role'::regtype) THEN
                    ALTER TYPE user_role ADD VALUE 'FACTORY';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEPOT' AND enumtypid = 'user_role'::regtype) THEN
                    ALTER TYPE user_role ADD VALUE 'DEPOT';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DRIVER' AND enumtypid = 'user_role'::regtype) THEN
                    ALTER TYPE user_role ADD VALUE 'DRIVER';
                END IF;
            END $$;
        ";
        await db.Database.ExecuteSqlRawAsync(sql);

        var conn = (Npgsql.NpgsqlConnection)db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync();
        await conn.ReloadTypesAsync();
    }

    // ── 1. Seed Seller ────────────────────────────────────────────────────────────
    private static async Task SeedSellerAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.Email == "giango9981@gmail.com"))
            return;

        var userId   = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var sellerId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{userId}', 'giango9981@gmail.com', 'Renats@2025',
                'SELLER'::user_role, 'Ngô Sỹ Giá', '0912345678',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var seller = new Seller
        {
            Id = sellerId,
            UserId = userId,
            DefaultAddress = "123 Đường Lê Văn Việt, Quận 9",
            City = "Hồ Chí Minh",
            Province = "TP. Hồ Chí Minh",
            Bio = "Chuyên thu gom phế liệu gia đình khu vực Quận 9",
            TotalRequests = 3,
            CompletedRequests = 1,
            CreatedAt = DateTime.UtcNow
        };

        var req1Id = Guid.NewGuid();
        var req1 = new PickupRequest
        {
            Id = req1Id,
            RequestCode = "YC-001",
            SellerId = sellerId,
            PickupAddress = "123 Đường Lê Văn Việt, Quận 9, TP.HCM",
            PickupDate = DateTime.UtcNow.AddDays(-5),
            PickupSlot = "08:00 – 10:00",
            Description = "Hàng sạch, đã phân loại sẵn",
            Status = PickupRequestStatus.DONE,
            ScheduledAt = DateTime.UtcNow.AddDays(-6),
            WeighedAt = DateTime.UtcNow.AddDays(-5),
            CompletedAt = DateTime.UtcNow.AddDays(-5),
            Note = "Hàng sạch, đã phân loại sẵn",
            CreatedAt = DateTime.UtcNow.AddDays(-7),
            UpdatedAt = DateTime.UtcNow.AddDays(-5)
        };
        req1.Items.Add(new PickupRequestItem { PickupRequestId = req1Id, MaterialId = "dong_cap_1", MaterialLabel = "Đồng cáp", MaterialEmoji = "🔶" });
        req1.Items.Add(new PickupRequestItem { PickupRequestId = req1Id, MaterialId = "sat", MaterialLabel = "Sắt vụn", MaterialEmoji = "⚙️" });
        req1.Results.Add(new PickupResult { PickupRequestId = req1Id, MaterialLabel = "Đồng cáp", WeightKg = 12.5m, PricePerKg = 95000m });
        req1.Results.Add(new PickupResult { PickupRequestId = req1Id, MaterialLabel = "Sắt vụn", WeightKg = 48.0m, PricePerKg = 10000m });

        var req2 = new PickupRequest
        {
            RequestCode = "YC-002",
            SellerId = sellerId,
            PickupAddress = "123 Đường Lê Văn Việt, Quận 9, TP.HCM",
            PickupDate = DateTime.UtcNow.AddDays(1),
            PickupSlot = "13:00 – 15:00",
            Status = PickupRequestStatus.SCHEDULED,
            ScheduledAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };
        req2.Items.Add(new PickupRequestItem { MaterialId = "giay_carton", MaterialLabel = "Giấy Carton", MaterialEmoji = "📦" });

        var req3 = new PickupRequest
        {
            RequestCode = "YC-003",
            SellerId = sellerId,
            PickupAddress = "123 Đường Lê Văn Việt, Quận 9, TP.HCM",
            PickupDate = DateTime.UtcNow.AddDays(3),
            PickupSlot = "09:00 – 11:00",
            Status = PickupRequestStatus.PENDING,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        req3.Items.Add(new PickupRequestItem { MaterialId = "nhua_cung", MaterialLabel = "Nhựa cứng", MaterialEmoji = "🪣" });
        req3.Items.Add(new PickupRequestItem { MaterialId = "nhua_mem", MaterialLabel = "Nhựa mềm", MaterialEmoji = "🛍️" });

        db.Sellers.Add(seller);
        db.PickupRequests.AddRange(req1, req2, req3);
        await db.SaveChangesAsync();

        Console.WriteLine("✅ [Seeder] Đã seed Seller: giango9981@gmail.com");
    }

    // ── 2. Seed Factory + Depots + InventoryBatches ───────────────────────────────
    private static async Task SeedFactoryAndDepotsAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.Email == "factory@renats.vn"))
            return;

        // ─── Factory user + entity ────────────────────────────────────────────
        // factoryId PHẢI khớp với FACTORY_ID trong factoryService.js
        var factoryUserId = Guid.Parse("22222222-0000-0000-0000-000000000001");
        var factoryId     = Guid.Parse("00000000-0000-0000-0000-000000000001");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{factoryUserId}', 'factory@renats.vn', 'Renats@2025',
                'FACTORY'::user_role, 'Công ty Tái Chế Xanh Việt Nam', '0901234567',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var factory = new Factory
        {
            Id             = factoryId,
            UserId         = factoryUserId,
            CompanyName    = "Công Ty TNHH Tái Chế Xanh Việt Nam",
            TaxCode        = "0312345678",
            Address        = "Khu Công Nghiệp Sóng Thần 2, Bình Dương",
            City           = "Bình Dương",
            Province       = "Bình Dương",
            ContactPerson  = "Nguyễn Văn Minh",
            ContactPhone   = "0901234567",
            Latitude       = 10.8812m,
            Longitude      = 106.5123m,
            IsPremium      = false,         // Mặc định không premium (như nhà máy mới đăng ký)
            PremiumExpiresAt = null,
            CreatedAt      = DateTime.UtcNow
        };

        // ─── Depot 1 ─────────────────────────────────────────────────────────
        var depot1UserId = Guid.Parse("22222222-0000-0000-0000-000000000002");
        var depot1Id     = Guid.Parse("33333333-0000-0000-0000-000000000001");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{depot1UserId}', 'depot1@renats.vn', 'Renats@2025',
                'DEPOT'::user_role, 'Vựa Phế Liệu Minh Khôi', '0909111222',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var depot1 = new Depot
        {
            Id             = depot1Id,
            UserId         = depot1UserId,
            CompanyName    = "Vựa Phế Liệu Minh Khôi",
            TaxCode        = "0398765432",
            Address        = "45 Đường Số 9, Phường Long Bình",
            City           = "Quận 9",
            Province       = "TP. Hồ Chí Minh",
            ContactPerson  = "Trần Minh Khôi",
            ContactPhone   = "0909111222",
            Latitude       = 10.8231m,
            Longitude      = 106.6297m,
            ReputationScore = 92,
            TotalTransactions = 48,
            CreatedAt      = DateTime.UtcNow.AddMonths(-6)
        };

        // ─── Depot 2 ─────────────────────────────────────────────────────────
        var depot2UserId = Guid.Parse("22222222-0000-0000-0000-000000000003");
        var depot2Id     = Guid.Parse("33333333-0000-0000-0000-000000000002");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{depot2UserId}', 'depot2@renats.vn', 'Renats@2025',
                'DEPOT'::user_role, 'Đại Lý Thu Gom Thành Đạt', '0909333444',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var depot2 = new Depot
        {
            Id             = depot2Id,
            UserId         = depot2UserId,
            CompanyName    = "Đại Lý Thu Gom Thành Đạt",
            TaxCode        = "0399988877",
            Address        = "12 Linh Đông, TP. Thủ Đức",
            City           = "TP. Thủ Đức",
            Province       = "TP. Hồ Chí Minh",
            ContactPerson  = "Lê Thành Đạt",
            ContactPhone   = "0909333444",
            Latitude       = 10.8495m,
            Longitude      = 106.7355m,
            ReputationScore = 78,
            TotalTransactions = 29,
            CreatedAt      = DateTime.UtcNow.AddMonths(-4)
        };

        // ─── Depot 3 ─────────────────────────────────────────────────────────
        var depot3UserId = Guid.Parse("22222222-0000-0000-0000-000000000004");
        var depot3Id     = Guid.Parse("33333333-0000-0000-0000-000000000003");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{depot3UserId}', 'depot3@renats.vn', 'Renats@2025',
                'DEPOT'::user_role, 'Công Ty Môi Trường Xanh', '0909555666',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var depot3 = new Depot
        {
            Id             = depot3Id,
            UserId         = depot3UserId,
            CompanyName    = "Công Ty Môi Trường Xanh",
            TaxCode        = "0300123456",
            Address        = "88 Xô Viết Nghệ Tĩnh, Phường 25",
            City           = "Bình Thạnh",
            Province       = "TP. Hồ Chí Minh",
            ContactPerson  = "Phạm Văn Xanh",
            ContactPhone   = "0909555666",
            Latitude       = 10.8140m,
            Longitude      = 106.7007m,
            ReputationScore = 85,
            TotalTransactions = 63,
            CreatedAt      = DateTime.UtcNow.AddMonths(-8)
        };

        db.Factories.Add(factory);
        db.Depots.AddRange(depot1, depot2, depot3);
        await db.SaveChangesAsync();

        // ─── InventoryBatches (LISTED – hiển thị trong chợ nguyên liệu) ──────
        var batches = new List<InventoryBatch>
        {
            new InventoryBatch
            {
                Id                = Guid.NewGuid(),
                DepotId           = depot1Id,
                BatchCode         = "BATCH-2601",
                MaterialType      = MaterialType.CARDBOARD,
                EstimatedWeightKg = 12500m,
                UnitPrice         = 3200m,
                MoisturePercentage = 11.5m,
                PurityPercentage  = 96.0m,
                Description       = "Giấy carton hỗn hợp ép kiện chất lượng cao, độ ẩm thấp, sạch tạp chất.",
                ThumbnailImageUrl = "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800",
                Status            = BatchStatus.LISTED,
                TransportType     = TransportType.APP_LOGISTICS,
                ListedAt          = DateTime.UtcNow.AddDays(-2),
                CreatedAt         = DateTime.UtcNow.AddDays(-2),
                UpdatedAt         = DateTime.UtcNow.AddDays(-2)
            },
            new InventoryBatch
            {
                Id                = Guid.NewGuid(),
                DepotId           = depot2Id,
                BatchCode         = "BATCH-2602",
                MaterialType      = MaterialType.HDPE,
                EstimatedWeightKg = 8400m,
                UnitPrice         = 15000m,
                MoisturePercentage = 1.2m,
                PurityPercentage  = 95.0m,
                Description       = "Nhựa HDPE ép kiện chuyên dụng cho tái chế, đã phân loại kỹ.",
                ThumbnailImageUrl = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800",
                Status            = BatchStatus.LISTED,
                TransportType     = TransportType.APP_LOGISTICS,
                ListedAt          = DateTime.UtcNow.AddDays(-1),
                CreatedAt         = DateTime.UtcNow.AddDays(-1),
                UpdatedAt         = DateTime.UtcNow.AddDays(-1)
            },
            new InventoryBatch
            {
                Id                = Guid.NewGuid(),
                DepotId           = depot3Id,
                BatchCode         = "BATCH-2603",
                MaterialType      = MaterialType.IRON,
                EstimatedWeightKg = 35000m,
                UnitPrice         = 12000m,
                MoisturePercentage = 0.5m,
                PurityPercentage  = 92.0m,
                Description       = "Sắt vụn tháo dỡ công trình, không dính bê tông, đã cắt nhỏ.",
                ThumbnailImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
                Status            = BatchStatus.LISTED,
                TransportType     = TransportType.APP_LOGISTICS,
                ListedAt          = DateTime.UtcNow.AddDays(-3),
                CreatedAt         = DateTime.UtcNow.AddDays(-3),
                UpdatedAt         = DateTime.UtcNow.AddDays(-3)
            },
            new InventoryBatch
            {
                Id                = Guid.NewGuid(),
                DepotId           = depot1Id,
                BatchCode         = "BATCH-2604",
                MaterialType      = MaterialType.ALUMINUM,
                EstimatedWeightKg = 5200m,
                UnitPrice         = 28000m,
                MoisturePercentage = 0.8m,
                PurityPercentage  = 98.0m,
                Description       = "Nhôm phế liệu loại 1 – lon bia, khung nhôm định hình.",
                ThumbnailImageUrl = "",
                Status            = BatchStatus.LISTED,
                TransportType     = TransportType.APP_LOGISTICS,
                ListedAt          = DateTime.UtcNow,
                CreatedAt         = DateTime.UtcNow,
                UpdatedAt         = DateTime.UtcNow
            }
        };

        // ─── 1 Batch đã VERIFIED (để dashboard có KPI dữ liệu thật) ──────────
        var verifiedBatchId = Guid.NewGuid();
        var verifiedBatch = new InventoryBatch
        {
            Id                = verifiedBatchId,
            DepotId           = depot1Id,
            BatchCode         = "BATCH-2500",
            MaterialType      = MaterialType.PAPER,
            EstimatedWeightKg = 15000m,
            ActualWeightKg    = 14850m,
            UnitPrice         = 2800m,
            MoisturePercentage = 8.0m,
            PurityPercentage  = 97.0m,
            Description       = "Giấy báo, giấy văn phòng hỗn hợp đã ép kiện.",
            ThumbnailImageUrl = "",
            Status            = BatchStatus.VERIFIED,
            TransportType     = TransportType.APP_LOGISTICS,
            ListedAt          = DateTime.UtcNow.AddDays(-10),
            AcceptedAt        = DateTime.UtcNow.AddDays(-9),
            VerifiedAt        = DateTime.UtcNow.AddDays(-8),
            CreatedAt         = DateTime.UtcNow.AddDays(-10),
            UpdatedAt         = DateTime.UtcNow.AddDays(-8)
        };

        db.InventoryBatches.AddRange(batches);
        db.InventoryBatches.Add(verifiedBatch);
        await db.SaveChangesAsync();

        // ─── BatchOrder VERIFIED (liên kết factory + verifiedBatch) ──────────
        var batchOrder = new BatchOrder
        {
            Id           = Guid.NewGuid(),
            BatchId      = verifiedBatchId,
            FactoryId    = factoryId,
            AgreedPrice  = 2800m,
            TotalAmount  = 14850m * 2800m,
            Status       = BatchStatus.VERIFIED,
            CreatedAt    = DateTime.UtcNow.AddDays(-9)
        };

        db.BatchOrders.Add(batchOrder);
        await db.SaveChangesAsync();

        // ─── 3. Seed Driver ───────────────────────────────────────────────────
        var driverUserId = Guid.Parse("22222222-0000-0000-0000-000000000005");
        var driverId     = Guid.Parse("44444444-0000-0000-0000-000000000001");

        await db.Database.ExecuteSqlRawAsync($@"
            INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
            VALUES (
                '{driverUserId}', 'driver@renats.vn', 'Renats@2025',
                'DRIVER'::user_role, 'Tài xế Nguyễn Văn Minh', '0988777666',
                true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
        ");

        var driver = new Driver
        {
            Id = driverId,
            UserId = driverUserId,
            LicenseNumber = "GX-88291-2026",
            VehiclePlate = "51C-882.91",
            VehicleType = "Xe tải 2.5 Tấn",
            MaxCapacityKg = 2500m,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Drivers.Add(driver);
        await db.SaveChangesAsync();

        // ─── TransportJob for verified batchOrder ────────────────────────────
        var transportJobId = Guid.NewGuid();
        var transportJob = new TransportJob
        {
            Id = transportJobId,
            BatchOrderId = batchOrder.Id,
            DriverId = driverId,
            PickupAddress = "Điểm tập kết phế liệu Quận 9, TP.HCM",
            DeliveryAddress = depot1.Address,
            PickupLatitude = 10.7876m,
            PickupLongitude = 106.6346m,
            DeliveryLatitude = depot1.Latitude,
            DeliveryLongitude = depot1.Longitude,
            EstimatedDistanceKm = 15.2m,
            TransportFee = 250000m,
            Status = TransportStatus.DELIVERED,
            PickupTime = DateTime.UtcNow.AddDays(-9),
            DeliveredTime = DateTime.UtcNow.AddDays(-8),
            CreatedAt = DateTime.UtcNow.AddDays(-9)
        };

        db.TransportJobs.Add(transportJob);
        await db.SaveChangesAsync();

        // ─── TrackingLogs for verified order ─────────────────────────────────
        db.TransportTrackingLogs.AddRange(
            new TransportTrackingLog { TransportJobId = transportJobId, Latitude = 10.7876m, Longitude = 106.6346m, Note = "[Check-in Nguồn] Tài xế check-in cổng Điểm tập kết phế liệu", CreatedAt = DateTime.UtcNow.AddDays(-9).AddHours(1) },
            new TransportTrackingLog { TransportJobId = transportJobId, Latitude = 10.7876m, Longitude = 106.6346m, Note = "[Check-out Nguồn] Xác thực hồ sơ thu gom thành công", CreatedAt = DateTime.UtcNow.AddDays(-9).AddHours(2) },
            new TransportTrackingLog { TransportJobId = transportJobId, Latitude = 10.8231m, Longitude = 106.6297m, Note = "[Check-in Vựa] Check-in tại Vựa Phế Liệu Minh Khôi", CreatedAt = DateTime.UtcNow.AddDays(-9).AddHours(3) },
            new TransportTrackingLog { TransportJobId = transportJobId, Latitude = 10.8231m, Longitude = 106.6297m, Note = "[Check-out Vựa] Chốt xuất kho vựa. Vận chuyển về nhà máy tái chế", CreatedAt = DateTime.UtcNow.AddDays(-9).AddHours(4) },
            new TransportTrackingLog { TransportJobId = transportJobId, Latitude = 10.8812m, Longitude = 106.5123m, Note = "[Check-in Nhà Máy] Xe tải cập bến cổng bảo vệ nhà máy Re-Nats Long An", CreatedAt = DateTime.UtcNow.AddDays(-9).AddHours(5) }
        );
        await db.SaveChangesAsync();

        // ─── Active Order (ACCEPTED) for BATCH-2601 so user can test simulator ─
        var listedBatch1 = batches.First(b => b.BatchCode == "BATCH-2601");
        listedBatch1.Status = BatchStatus.ACCEPTED;
        listedBatch1.AcceptedAt = DateTime.UtcNow.AddHours(-2);
        listedBatch1.UpdatedAt = DateTime.UtcNow;

        var activeOrder = new BatchOrder
        {
            Id = Guid.NewGuid(),
            BatchId = listedBatch1.Id,
            FactoryId = factoryId,
            AgreedPrice = listedBatch1.UnitPrice ?? 3200m,
            TotalAmount = listedBatch1.EstimatedWeightKg * (listedBatch1.UnitPrice ?? 3200m),
            Status = BatchStatus.ACCEPTED,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        db.BatchOrders.Add(activeOrder);
        await db.SaveChangesAsync();

        var activeTransport = new TransportJob
        {
            Id = Guid.NewGuid(),
            BatchOrderId = activeOrder.Id,
            DriverId = driverId,
            PickupAddress = "Điểm tập kết phế liệu Quận 9, TP.HCM",
            DeliveryAddress = depot1.Address,
            PickupLatitude = 10.7876m,
            PickupLongitude = 106.6346m,
            DeliveryLatitude = depot1.Latitude,
            DeliveryLongitude = depot1.Longitude,
            EstimatedDistanceKm = 15.2m,
            TransportFee = 250000m,
            Status = TransportStatus.ASSIGNED,
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };
        db.TransportJobs.Add(activeTransport);
        await db.SaveChangesAsync();

        // ─── Pending Order & Transport Job (chưa gán tài xế để hiển thị trên chợ đơn) ───
        var listedBatch2 = batches.First(b => b.BatchCode == "BATCH-2602");
        listedBatch2.Status = BatchStatus.ACCEPTED;
        listedBatch2.AcceptedAt = DateTime.UtcNow.AddHours(-1);
        listedBatch2.UpdatedAt = DateTime.UtcNow;

        var pendingOrder = new BatchOrder
        {
            Id = Guid.NewGuid(),
            BatchId = listedBatch2.Id,
            FactoryId = factoryId,
            AgreedPrice = listedBatch2.UnitPrice ?? 15000m,
            TotalAmount = listedBatch2.EstimatedWeightKg * (listedBatch2.UnitPrice ?? 15000m),
            Status = BatchStatus.ACCEPTED,
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        db.BatchOrders.Add(pendingOrder);
        await db.SaveChangesAsync();

        var pendingTransport = new TransportJob
        {
            Id = Guid.NewGuid(),
            BatchOrderId = pendingOrder.Id,
            DriverId = null, // Chưa có tài xế nhận
            PickupAddress = depot2.Address ?? "Kho Re-Nats",
            DeliveryAddress = factory.Address ?? "Nhà máy tái chế",
            PickupLatitude = depot2.Latitude,
            PickupLongitude = depot2.Longitude,
            DeliveryLatitude = factory.Latitude,
            DeliveryLongitude = factory.Longitude,
            EstimatedDistanceKm = 12.5m,
            TransportFee = 320000m,
            Status = TransportStatus.PENDING, // PENDING để xuất hiện trên chợ đơn
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };
        db.TransportJobs.Add(pendingTransport);
        await db.SaveChangesAsync();

        Console.WriteLine("✅ [Seeder] Đã seed Factory, 3 Depots, 5 InventoryBatches cùng 1 đơn hàng PENDING cho vận tải.");
        Console.WriteLine("   📧 factory@renats.vn  |  🔑 Renats@2025");
        Console.WriteLine("   📧 depot1@renats.vn   |  🔑 Renats@2025");
        Console.WriteLine("   📧 driver@renats.vn   |  🔑 Renats@2025");
    }
}

