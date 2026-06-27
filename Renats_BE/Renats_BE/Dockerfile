# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Sao chép file project và khôi phục các package (restore dependencies)
COPY ["Renats_BE.csproj", "./"]
RUN dotnet restore "Renats_BE.csproj"

# Sao chép toàn bộ source code và build
COPY . .
RUN dotnet publish "Renats_BE.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render sử dụng cổng 8080 mặc định cho môi trường Docker hoặc PORT env var.
# Ở đây ta set mặc định chạy ở cổng 8080
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Renats_BE.dll"]
