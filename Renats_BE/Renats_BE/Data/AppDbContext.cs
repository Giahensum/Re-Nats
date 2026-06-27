using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql;
using Renats_BE.Models;
using Renats_BE.Models.Enums;


namespace Renats_BE.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Factory> Factories => Set<Factory>();
    public DbSet<Depot> Depots => Set<Depot>();
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Seller> Sellers => Set<Seller>();
    public DbSet<PickupRequest> PickupRequests => Set<PickupRequest>();
    public DbSet<PickupRequestItem> PickupRequestItems => Set<PickupRequestItem>();
    public DbSet<PickupRequestImage> PickupRequestImages => Set<PickupRequestImage>();
    public DbSet<PickupResult> PickupResults => Set<PickupResult>();
    public DbSet<InventoryBatch> InventoryBatches => Set<InventoryBatch>();
    public DbSet<BatchImage> BatchImages => Set<BatchImage>();
    public DbSet<BatchBid> BatchBids => Set<BatchBid>();
    public DbSet<BatchOrder> BatchOrders => Set<BatchOrder>();
    public DbSet<TransportJob> TransportJobs => Set<TransportJob>();
    public DbSet<TransportTrackingLog> TransportTrackingLogs => Set<TransportTrackingLog>();
    public DbSet<WeightTicket> WeightTickets => Set<WeightTicket>();
    public DbSet<WeightVerification> WeightVerifications => Set<WeightVerification>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // NOTE: DB columns are TEXT (converted via fix_enum_to_text.sql)
        // EF Core dùng HasConversion<string>() để map C# enum ↔ TEXT

        // ── Table names (snake_case to match SQL) ──
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Factory>().ToTable("factories");
        modelBuilder.Entity<Depot>().ToTable("depots");
        modelBuilder.Entity<Driver>().ToTable("drivers");
        modelBuilder.Entity<Seller>().ToTable("sellers");
        modelBuilder.Entity<PickupRequest>().ToTable("pickup_requests");
        modelBuilder.Entity<PickupRequestItem>().ToTable("pickup_request_items");
        modelBuilder.Entity<PickupRequestImage>().ToTable("pickup_request_images");
        modelBuilder.Entity<PickupResult>().ToTable("pickup_results");
        modelBuilder.Entity<InventoryBatch>().ToTable("inventory_batches");
        modelBuilder.Entity<BatchImage>().ToTable("batch_images");
        modelBuilder.Entity<BatchBid>().ToTable("batch_bids");
        modelBuilder.Entity<BatchOrder>().ToTable("batch_orders");
        modelBuilder.Entity<TransportJob>().ToTable("transport_jobs");
        modelBuilder.Entity<TransportTrackingLog>().ToTable("transport_tracking_logs");
        modelBuilder.Entity<WeightTicket>().ToTable("weight_tickets");
        modelBuilder.Entity<WeightVerification>().ToTable("weight_verifications");
        modelBuilder.Entity<Invoice>().ToTable("invoices");
        modelBuilder.Entity<Notification>().ToTable("notifications");

        // ── Column names (snake_case) ──
        modelBuilder.Entity<User>(e =>
        {
            e.Property(u => u.Id).HasColumnName("id");
            e.Property(u => u.Email).HasColumnName("email").HasMaxLength(255);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.PasswordHash).HasColumnName("password_hash");
            e.Property(u => u.Role).HasColumnName("role").HasConversion<string>();
            e.Property(u => u.FullName).HasColumnName("full_name").HasMaxLength(255);
            e.Property(u => u.Phone).HasColumnName("phone").HasMaxLength(20);
            e.Property(u => u.IsActive).HasColumnName("is_active");
            e.Property(u => u.CreatedAt).HasColumnName("created_at");
            e.Property(u => u.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<Factory>(e =>
        {
            e.Property(f => f.Id).HasColumnName("id");
            e.Property(f => f.UserId).HasColumnName("user_id");
            e.Property(f => f.CompanyName).HasColumnName("company_name").HasMaxLength(255);
            e.Property(f => f.TaxCode).HasColumnName("tax_code").HasMaxLength(100);
            e.Property(f => f.Address).HasColumnName("address");
            e.Property(f => f.City).HasColumnName("city").HasMaxLength(100);
            e.Property(f => f.Province).HasColumnName("province").HasMaxLength(100);
            e.Property(f => f.IndustrialZone).HasColumnName("industrial_zone").HasMaxLength(255);
            e.Property(f => f.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            e.Property(f => f.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            e.Property(f => f.ContactPerson).HasColumnName("contact_person").HasMaxLength(255);
            e.Property(f => f.ContactPhone).HasColumnName("contact_phone").HasMaxLength(20);
            // Profile fields
            // Dùng ValueConverter để lưu tiếng Việt vào DB thay vì tên enum tiếng Anh
            var matTypeConverter = new ValueConverter<MaterialType?, string?>(
                v => v.HasValue ? MaterialTypeHelper.ToVietnamese(v.Value) : null,
                v => string.IsNullOrEmpty(v) ? null : MaterialTypeHelper.FromString(v));
            e.Property(f => f.PrimaryMaterialType).HasColumnName("primary_material_type").HasConversion(matTypeConverter);
            e.Property(f => f.AcceptedMaterialTypes).HasColumnName("accepted_material_types");
            e.Property(f => f.CapacityPerMonthTon).HasColumnName("capacity_per_month_ton").HasPrecision(12, 2);
            e.Property(f => f.MinPurityRequired).HasColumnName("min_purity_required").HasPrecision(5, 2);
            e.Property(f => f.BusinessLicenseUrl).HasColumnName("business_license_url");
            e.Property(f => f.EnvironmentLicenseUrl).HasColumnName("environment_license_url");
            e.Property(f => f.IsProfileComplete).HasColumnName("is_profile_complete");
            // Premium
            e.Property(f => f.IsPremium).HasColumnName("is_premium");
            e.Property(f => f.PremiumExpiresAt).HasColumnName("premium_expires_at");
            e.Property(f => f.CreatedAt).HasColumnName("created_at");
            e.HasOne(f => f.User).WithOne(u => u.Factory).HasForeignKey<Factory>(f => f.UserId);
        });


        modelBuilder.Entity<Depot>(e =>
        {
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.UserId).HasColumnName("user_id");
            e.Property(d => d.CompanyName).HasColumnName("company_name").HasMaxLength(255);
            e.Property(d => d.TaxCode).HasColumnName("tax_code").HasMaxLength(100);
            e.Property(d => d.Address).HasColumnName("address");
            e.Property(d => d.City).HasColumnName("city").HasMaxLength(100);
            e.Property(d => d.Province).HasColumnName("province").HasMaxLength(100);
            e.Property(d => d.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            e.Property(d => d.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            e.Property(d => d.ContactPerson).HasColumnName("contact_person").HasMaxLength(255);
            e.Property(d => d.ContactPhone).HasColumnName("contact_phone").HasMaxLength(20);
            e.Property(d => d.ReputationScore).HasColumnName("reputation_score");
            e.Property(d => d.TotalTransactions).HasColumnName("total_transactions");
            e.Property(d => d.CreatedAt).HasColumnName("created_at");
            e.HasOne(d => d.User).WithOne(u => u.Depot).HasForeignKey<Depot>(d => d.UserId);
        });

        // ── Seller ──
        modelBuilder.Entity<Seller>(e =>
        {
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.UserId).HasColumnName("user_id");
            e.Property(s => s.DefaultAddress).HasColumnName("default_address");
            e.Property(s => s.City).HasColumnName("city").HasMaxLength(100);
            e.Property(s => s.Province).HasColumnName("province").HasMaxLength(100);
            e.Property(s => s.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            e.Property(s => s.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            e.Property(s => s.Bio).HasColumnName("bio");
            e.Property(s => s.TotalRequests).HasColumnName("total_requests");
            e.Property(s => s.CompletedRequests).HasColumnName("completed_requests");
            e.Property(s => s.AverageRating).HasColumnName("average_rating").HasPrecision(3, 2);
            e.Property(s => s.CreatedAt).HasColumnName("created_at");
            e.HasOne(s => s.User).WithOne(u => u.Seller).HasForeignKey<Seller>(s => s.UserId);
        });

        // ── PickupRequest ──
        modelBuilder.Entity<PickupRequest>(e =>
        {
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.RequestCode).HasColumnName("request_code").HasMaxLength(50);
            e.HasIndex(p => p.RequestCode).IsUnique();
            e.Property(p => p.SellerId).HasColumnName("seller_id");
            e.Property(p => p.AssignedDepotId).HasColumnName("assigned_depot_id");
            e.Property(p => p.PickupAddress).HasColumnName("pickup_address");
            e.Property(p => p.City).HasColumnName("city").HasMaxLength(100);
            e.Property(p => p.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            e.Property(p => p.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            e.Property(p => p.PickupDate).HasColumnName("pickup_date");
            e.Property(p => p.PickupSlot).HasColumnName("pickup_slot").HasMaxLength(50);
            e.Property(p => p.Description).HasColumnName("description");
            e.Property(p => p.Note).HasColumnName("note");
            e.Property(p => p.Status).HasColumnName("status").HasConversion<string>();
            e.Property(p => p.ScheduledAt).HasColumnName("scheduled_at");
            e.Property(p => p.WeighedAt).HasColumnName("weighed_at");
            e.Property(p => p.CompletedAt).HasColumnName("completed_at");
            e.Property(p => p.CreatedAt).HasColumnName("created_at");
            e.Property(p => p.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(p => p.Seller).WithMany(s => s.PickupRequests).HasForeignKey(p => p.SellerId);
            e.HasOne(p => p.AssignedDepot).WithMany().HasForeignKey(p => p.AssignedDepotId);
            e.HasIndex(p => p.SellerId).HasDatabaseName("idx_pickup_requests_seller");
            e.HasIndex(p => p.Status).HasDatabaseName("idx_pickup_requests_status");
        });

        // ── PickupRequestItem ──
        modelBuilder.Entity<PickupRequestItem>(e =>
        {
            e.Property(i => i.Id).HasColumnName("id");
            e.Property(i => i.PickupRequestId).HasColumnName("pickup_request_id");
            e.Property(i => i.MaterialId).HasColumnName("material_id").HasMaxLength(100);
            e.Property(i => i.MaterialLabel).HasColumnName("material_label").HasMaxLength(255);
            e.Property(i => i.MaterialEmoji).HasColumnName("material_emoji").HasMaxLength(10);
            e.Property(i => i.CreatedAt).HasColumnName("created_at");
            e.HasOne(i => i.PickupRequest).WithMany(p => p.Items).HasForeignKey(i => i.PickupRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── PickupRequestImage ──
        modelBuilder.Entity<PickupRequestImage>(e =>
        {
            e.Property(i => i.Id).HasColumnName("id");
            e.Property(i => i.PickupRequestId).HasColumnName("pickup_request_id");
            e.Property(i => i.ImageUrl).HasColumnName("image_url");
            e.Property(i => i.CreatedAt).HasColumnName("created_at");
            e.HasOne(i => i.PickupRequest).WithMany(p => p.Images).HasForeignKey(i => i.PickupRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── PickupResult ──
        modelBuilder.Entity<PickupResult>(e =>
        {
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.PickupRequestId).HasColumnName("pickup_request_id");
            e.Property(r => r.MaterialLabel).HasColumnName("material_label").HasMaxLength(255);
            e.Property(r => r.WeightKg).HasColumnName("weight_kg").HasPrecision(10, 3);
            e.Property(r => r.PricePerKg).HasColumnName("price_per_kg").HasPrecision(14, 2);
            e.Ignore(r => r.TotalAmount); // computed property
            e.Property(r => r.CreatedAt).HasColumnName("created_at");
            e.HasOne(r => r.PickupRequest).WithMany(p => p.Results).HasForeignKey(r => r.PickupRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Driver>(e =>
        {
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.UserId).HasColumnName("user_id");
            e.Property(d => d.LicenseNumber).HasColumnName("license_number").HasMaxLength(100);
            e.Property(d => d.VehiclePlate).HasColumnName("vehicle_plate").HasMaxLength(50);
            e.Property(d => d.VehicleType).HasColumnName("vehicle_type").HasMaxLength(100);
            e.Property(d => d.MaxCapacityKg).HasColumnName("max_capacity_kg").HasPrecision(12, 2);
            e.Property(d => d.IsAvailable).HasColumnName("is_available");
            e.Property(d => d.CreatedAt).HasColumnName("created_at");
            e.HasOne(d => d.User).WithOne(u => u.Driver).HasForeignKey<Driver>(d => d.UserId);
        });

        modelBuilder.Entity<InventoryBatch>(e =>
        {
            e.Property(b => b.Id).HasColumnName("id");
            e.Property(b => b.DepotId).HasColumnName("depot_id");
            e.Property(b => b.BatchCode).HasColumnName("batch_code").HasMaxLength(100);
            e.HasIndex(b => b.BatchCode).IsUnique();
            // Dùng ValueConverter để lưu tiếng Việt vào DB
            var batchMatConverter = new ValueConverter<MaterialType, string>(
                v => MaterialTypeHelper.ToVietnamese(v),
                v => MaterialTypeHelper.FromString(v));
            e.Property(b => b.MaterialType).HasColumnName("material_type").HasConversion(batchMatConverter);
            e.Property(b => b.EstimatedWeightKg).HasColumnName("estimated_weight_kg").HasPrecision(14, 2);
            e.Property(b => b.ActualWeightKg).HasColumnName("actual_weight_kg").HasPrecision(14, 2);
            e.Property(b => b.MoisturePercentage).HasColumnName("moisture_percentage").HasPrecision(5, 2);
            e.Property(b => b.PurityPercentage).HasColumnName("purity_percentage").HasPrecision(5, 2);
            e.Property(b => b.UnitPrice).HasColumnName("unit_price").HasPrecision(14, 2);
            e.Property(b => b.Description).HasColumnName("description");
            e.Property(b => b.ThumbnailImageUrl).HasColumnName("thumbnail_image_url");
            e.Property(b => b.Status).HasColumnName("status").HasConversion<string>();
            e.Property(b => b.TransportType).HasColumnName("transport_type").HasConversion<string>();
            e.Property(b => b.ListedAt).HasColumnName("listed_at");
            e.Property(b => b.AcceptedAt).HasColumnName("accepted_at");
            e.Property(b => b.DeliveredAt).HasColumnName("delivered_at");
            e.Property(b => b.VerifiedAt).HasColumnName("verified_at");
            e.Property(b => b.CreatedAt).HasColumnName("created_at");
            e.Property(b => b.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(b => b.Depot).WithMany(d => d.Batches).HasForeignKey(b => b.DepotId);
        });

        modelBuilder.Entity<BatchImage>(e =>
        {
            e.Property(i => i.Id).HasColumnName("id");
            e.Property(i => i.BatchId).HasColumnName("batch_id");
            e.Property(i => i.ImageUrl).HasColumnName("image_url");
            e.Property(i => i.CreatedAt).HasColumnName("created_at");
            e.HasOne(i => i.Batch).WithMany(b => b.Images).HasForeignKey(i => i.BatchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BatchBid>(e =>
        {
            e.Property(b => b.Id).HasColumnName("id");
            e.Property(b => b.BatchId).HasColumnName("batch_id");
            e.Property(b => b.FactoryId).HasColumnName("factory_id");
            e.Property(b => b.BidPrice).HasColumnName("bid_price").HasPrecision(14, 2);
            e.Property(b => b.Note).HasColumnName("note");
            e.Property(b => b.Status).HasColumnName("status").HasConversion<string>();
            e.Property(b => b.CreatedAt).HasColumnName("created_at");
            e.HasOne(b => b.Batch).WithMany(ib => ib.Bids).HasForeignKey(b => b.BatchId);
            e.HasOne(b => b.Factory).WithMany(f => f.Bids).HasForeignKey(b => b.FactoryId);
        });

        modelBuilder.Entity<BatchOrder>(e =>
        {
            e.Property(o => o.Id).HasColumnName("id");
            e.Property(o => o.BatchId).HasColumnName("batch_id");
            e.Property(o => o.FactoryId).HasColumnName("factory_id");
            e.Property(o => o.AcceptedBidId).HasColumnName("accepted_bid_id");
            e.Property(o => o.AgreedPrice).HasColumnName("agreed_price").HasPrecision(14, 2);
            e.Property(o => o.TotalAmount).HasColumnName("total_amount").HasPrecision(14, 2);
            e.Property(o => o.Status).HasColumnName("status").HasConversion<string>();
            e.Property(o => o.CreatedAt).HasColumnName("created_at");
            e.HasOne(o => o.Batch).WithOne(b => b.Order).HasForeignKey<BatchOrder>(o => o.BatchId);
            e.HasOne(o => o.Factory).WithMany(f => f.Orders).HasForeignKey(o => o.FactoryId);
            e.HasOne(o => o.AcceptedBid).WithMany().HasForeignKey(o => o.AcceptedBidId);
        });

        modelBuilder.Entity<TransportJob>(e =>
        {
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.BatchOrderId).HasColumnName("batch_order_id");
            e.Property(t => t.DriverId).HasColumnName("driver_id");
            e.Property(t => t.PickupAddress).HasColumnName("pickup_address");
            e.Property(t => t.DeliveryAddress).HasColumnName("delivery_address");
            e.Property(t => t.PickupLatitude).HasColumnName("pickup_latitude").HasPrecision(10, 7);
            e.Property(t => t.PickupLongitude).HasColumnName("pickup_longitude").HasPrecision(10, 7);
            e.Property(t => t.DeliveryLatitude).HasColumnName("delivery_latitude").HasPrecision(10, 7);
            e.Property(t => t.DeliveryLongitude).HasColumnName("delivery_longitude").HasPrecision(10, 7);
            e.Property(t => t.EstimatedDistanceKm).HasColumnName("estimated_distance_km").HasPrecision(10, 2);
            e.Property(t => t.TransportFee).HasColumnName("transport_fee").HasPrecision(14, 2);
            e.Property(t => t.Status).HasColumnName("status").HasConversion<string>();
            e.Property(t => t.PickupTime).HasColumnName("pickup_time");
            e.Property(t => t.DeliveredTime).HasColumnName("delivered_time");
            e.Property(t => t.CreatedAt).HasColumnName("created_at");
            e.HasOne(t => t.BatchOrder).WithOne(o => o.TransportJob).HasForeignKey<TransportJob>(t => t.BatchOrderId);
            e.HasOne(t => t.Driver).WithMany(d => d.TransportJobs).HasForeignKey(t => t.DriverId);
        });

        modelBuilder.Entity<TransportTrackingLog>(e =>
        {
            e.Property(l => l.Id).HasColumnName("id");
            e.Property(l => l.TransportJobId).HasColumnName("transport_job_id");
            e.Property(l => l.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            e.Property(l => l.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            e.Property(l => l.Note).HasColumnName("note");
            e.Property(l => l.LogType).HasColumnName("log_type").HasMaxLength(50);
            e.Property(l => l.ImageUrl).HasColumnName("image_url");
            e.Property(l => l.CreatedAt).HasColumnName("created_at");
            e.HasOne(l => l.TransportJob).WithMany(t => t.TrackingLogs).HasForeignKey(l => l.TransportJobId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WeightTicket>(e =>
        {
            e.Property(w => w.Id).HasColumnName("id");
            e.Property(w => w.BatchOrderId).HasColumnName("batch_order_id");
            e.Property(w => w.TicketNumber).HasColumnName("ticket_number").HasMaxLength(100);
            e.Property(w => w.GrossWeightKg).HasColumnName("gross_weight_kg").HasPrecision(14, 2);
            e.Property(w => w.TareWeightKg).HasColumnName("tare_weight_kg").HasPrecision(14, 2);
            e.Property(w => w.NetWeightKg).HasColumnName("net_weight_kg").HasPrecision(14, 2);
            e.Property(w => w.WeighingStation).HasColumnName("weighing_station").HasMaxLength(255);
            e.Property(w => w.TicketImageUrl).HasColumnName("ticket_image_url");
            e.Property(w => w.UploadedBy).HasColumnName("uploaded_by");
            e.Property(w => w.CreatedAt).HasColumnName("created_at");
            e.HasOne(w => w.BatchOrder).WithOne(o => o.WeightTicket).HasForeignKey<WeightTicket>(w => w.BatchOrderId);
            e.HasOne(w => w.Uploader).WithMany().HasForeignKey(w => w.UploadedBy);
        });

        modelBuilder.Entity<WeightVerification>(e =>
        {
            e.Property(v => v.Id).HasColumnName("id");
            e.Property(v => v.BatchOrderId).HasColumnName("batch_order_id");
            e.Property(v => v.DepotWeightKg).HasColumnName("depot_weight_kg").HasPrecision(14, 2);
            e.Property(v => v.FactoryWeightKg).HasColumnName("factory_weight_kg").HasPrecision(14, 2);
            e.Property(v => v.DifferenceKg).HasColumnName("difference_kg").HasPrecision(14, 2);
            e.Property(v => v.DifferencePercentage).HasColumnName("difference_percentage").HasPrecision(5, 2);
            e.Property(v => v.IsVerified).HasColumnName("is_verified");
            e.Property(v => v.VerificationNote).HasColumnName("verification_note");
            e.Property(v => v.CreatedAt).HasColumnName("created_at");
            e.HasOne(v => v.BatchOrder).WithOne(o => o.WeightVerification).HasForeignKey<WeightVerification>(v => v.BatchOrderId);
        });

        modelBuilder.Entity<Invoice>(e =>
        {
            e.Property(i => i.Id).HasColumnName("id");
            e.Property(i => i.BatchOrderId).HasColumnName("batch_order_id");
            e.Property(i => i.InvoiceNumber).HasColumnName("invoice_number").HasMaxLength(100);
            e.Property(i => i.InvoiceFileUrl).HasColumnName("invoice_file_url");
            e.Property(i => i.Subtotal).HasColumnName("subtotal").HasPrecision(14, 2);
            e.Property(i => i.VatAmount).HasColumnName("vat_amount").HasPrecision(14, 2);
            e.Property(i => i.CommissionFee).HasColumnName("commission_fee").HasPrecision(14, 2);
            e.Property(i => i.TotalAmount).HasColumnName("total_amount").HasPrecision(14, 2);
            e.Property(i => i.Status).HasColumnName("status").HasConversion<string>();
            e.Property(i => i.UploadedBy).HasColumnName("uploaded_by");
            e.Property(i => i.CreatedAt).HasColumnName("created_at");
            e.HasOne(i => i.BatchOrder).WithOne(o => o.Invoice).HasForeignKey<Invoice>(i => i.BatchOrderId);
            e.HasOne(i => i.Uploader).WithMany().HasForeignKey(i => i.UploadedBy);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(n => n.Id).HasColumnName("id");
            e.Property(n => n.UserId).HasColumnName("user_id");
            e.Property(n => n.Title).HasColumnName("title").HasMaxLength(255);
            e.Property(n => n.Message).HasColumnName("message");
            e.Property(n => n.IsRead).HasColumnName("is_read");
            e.Property(n => n.CreatedAt).HasColumnName("created_at");
            e.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId);
            e.HasIndex(n => n.UserId).HasDatabaseName("idx_notifications_user");
        });

        // ── Indexes ──
        modelBuilder.Entity<InventoryBatch>().HasIndex(b => b.Status).HasDatabaseName("idx_batches_status");
        modelBuilder.Entity<InventoryBatch>().HasIndex(b => b.MaterialType).HasDatabaseName("idx_batches_material");
        modelBuilder.Entity<TransportJob>().HasIndex(t => t.Status).HasDatabaseName("idx_transport_status");
    }
}
