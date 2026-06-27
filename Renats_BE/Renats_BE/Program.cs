using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Renats_BE.Data;
using Renats_BE.Repositories;
using Renats_BE.Repositories.Interfaces;
using Renats_BE.Services;
using Renats_BE.Services.Interfaces;
using System.Text;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

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
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// ── HttpClient (dùng cho xác thực token Social từ Google/Facebook) ──────────
builder.Services.AddHttpClient();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key chưa được cấu hình trong appsettings.json");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer           = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidateAudience         = true,
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        ValidateLifetime         = true,
        ClockSkew                = TimeSpan.Zero,
    };
});

builder.Services.AddAuthorization();

// ── CORS (allow frontend to access API) ───────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Re-Nats API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName?.Replace("+", "."));

    // Thêm hỗ trợ Authorization header trong Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Nhập JWT token theo định dạng: Bearer {token}",
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Seed database ─────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();   // Automatically apply pending migrations to the database
    await DbSeeder.SeedAsync(db);       // Admin account
    await DataSeeder.SeedAsync(db);     // Seller + Factory + Depots + Batches
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

// ── Authentication PHẢI đứng TRƯỚC Authorization ─────────────────────────────
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
