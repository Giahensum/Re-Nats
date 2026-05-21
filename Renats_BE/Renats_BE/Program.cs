using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Repositories;
using Renats_BE.Repositories.Interfaces;
using Renats_BE.Services;
using Renats_BE.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
// NOTE: Các cột enum đã được chuyển sang TEXT (fix_enum_to_text.sql)
// → KHÔNG dùng MapEnum, EF Core dùng HasConversion<string>() để xử lý
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Repositories ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<ISellerRepository, SellerRepository>();
builder.Services.AddScoped<IPickupRequestRepository, PickupRequestRepository>();

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.AddScoped<ISellerService, SellerService>();
builder.Services.AddScoped<IPickupRequestService, PickupRequestService>();

// ── CORS (allow React dev server on any localhost port) ──────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin) || origin == "null") return false;
            try
            {
                var uri = new Uri(origin);
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            }
            catch
            {
                return false;
            }
        })
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Re-Nats API", Version = "v1" });
});

var app = builder.Build();

// ── Seed database ─────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();