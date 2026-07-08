using System;
using System.IO;
using System.Text.Json;
using Npgsql;

var appSettingsPath = @"d:\Kỳ 8\EXE201\ga4\Re-Nats\Renats_BE\Renats_BE\appsettings.json";

if (!File.Exists(appSettingsPath))
{
    Console.WriteLine($"Error: Could not find appsettings.json at {appSettingsPath}");
    return;
}

string connStr;
try
{
    var json = File.ReadAllText(appSettingsPath);
    using var doc = JsonDocument.Parse(json);
    connStr = doc.RootElement
        .GetProperty("ConnectionStrings")
        .GetProperty("DefaultConnection")
        .GetString() ?? throw new Exception("ConnectionString is null");
}
catch (Exception ex)
{
    Console.WriteLine($"Error parsing appsettings.json: {ex.Message}");
    return;
}

Console.WriteLine("Connecting to database...");

try
{
    using var conn = new NpgsqlConnection(connStr);
    await conn.OpenAsync();
    Console.WriteLine("Connection successful!");

    Console.WriteLine("Adding missing image_url column to transport_tracking_logs...");
    using (var cmd = new NpgsqlCommand(
        "ALTER TABLE transport_tracking_logs ADD COLUMN IF NOT EXISTS image_url TEXT;", 
        conn))
    {
        await cmd.ExecuteNonQueryAsync();
    }
    Console.WriteLine("Column added successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to add column: {ex.Message}");
}
