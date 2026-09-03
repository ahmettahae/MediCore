# ── 1. Derleme Aşaması (Build Stage) ──
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Bağımlılıkları geri yükle (Cache optimizasyonu)
COPY ["MediCore.API.csproj", "./"]
RUN dotnet restore "MediCore.API.csproj"

# Tüm kaynak kodları kopyala ve yayınla
COPY . .
RUN dotnet publish "MediCore.API.csproj" -c Release -o /app/publish

# ── 2. Çalışma Aşaması (Runtime Stage) ──
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Mevcut hazır veritabanını konteynere dahil et
COPY medicore.db .

# Render'ın beklediği port yapılandırması
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "MediCore.API.dll"]
