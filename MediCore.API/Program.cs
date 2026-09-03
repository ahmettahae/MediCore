using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using MediCore.API.Data;
using Serilog;
using MediCore.API.Hubs;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("Logs/medicore_log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("MediCore API Başlatılıyor...");

    var builder = WebApplication.CreateBuilder(args);

    // Serilog'u ana bilgisayar (Host) olarak kaydet
    builder.Host.UseSerilog();

    // SignalR Servisini Ekle
    builder.Services.AddSignalR();

// 1. CORS İzni (React'in API'ye bağlanabilmesi için)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactIzin", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 2. Veritabanı Bağlantısı (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));

// 3. JWT Kimlik Doğrulama Ayarları
var jwtKey = builder.Configuration["Jwt:Key"];
if (builder.Environment.IsProduction() && jwtKey == "MediCoreIcinCokGizliVeUzunBirSifreOlmalidir123!")
{
    throw new InvalidOperationException("Üretim (Production) ortamında varsayılan JWT Anahtarı kullanılamaz! Lütfen çevre değişkeni (Environment Variable) üzerinden güvenli bir anahtar tanımlayın.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Format: Bearer {token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Serilog HTTP istek loglamasını etkinleştir
app.UseSerilogRequestLogging();

// Otomatik Veritabanı Başlatma & Seed Data (Hasta Bakım Merkezi Modeli)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    DbInitializer.Initialize(dbContext);
}

// Configure the HTTP request pipeline (Swagger'ı hem canlıda hem yerelde aktif tut)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MediCore API v1");
    c.RoutePrefix = "swagger";
});

// 4. Middleware Sıralaması (Hayati Önem Taşır)
app.UseCors("ReactIzin");
app.UseAuthentication(); // Kimlik Doğrulama (Kimsin?)
app.UseAuthorization();  // Yetkilendirme (Nereye girebilirsin?)

app.MapControllers();

// Kök Adres Sağlık Kontrolü (Health Check Endpoint)
app.MapGet("/", () => Results.Ok(new
{
    name = "MediCore Klinik & Bakım Bilgi Sistemi API",
    status = "Online",
    version = "1.0.0",
    time = DateTime.UtcNow,
    swagger = "/swagger"
}));

// KlinikHub Endpoint Eşlemesi
app.MapHub<KlinikHub>("/hub/klinik");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Uygulama beklenmedik bir şekilde sonlandırıldı!");
}
finally
{
    Log.CloseAndFlush();
}