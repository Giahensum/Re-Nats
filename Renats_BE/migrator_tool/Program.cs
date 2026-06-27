using Npgsql;
var connStr = "Host=localhost;Port=5432;Database=Renats;Username=postgres;Password=123";
using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();

Console.WriteLine("=== PICKUP RESULTS ===");
using (var cmd = new NpgsqlCommand(
    "SELECT pr.id, pr.pickup_request_id, pr.material_label, pr.weight_kg, r.status FROM pickup_results pr JOIN pickup_requests r ON pr.pickup_request_id = r.id",
    conn))
{
    using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            Console.WriteLine($"MaterialLabel: {reader["material_label"]}, Weight: {reader["weight_kg"]}, Status: {reader["status"]}");
        }
    }
}

Console.WriteLine("\n=== FACTORIES ===");
using (var cmd2 = new NpgsqlCommand(
    "SELECT id, company_name, primary_material_type, accepted_material_types, is_profile_complete FROM factories",
    conn))
{
    using (var reader2 = await cmd2.ExecuteReaderAsync())
    {
        while (await reader2.ReadAsync())
        {
            Console.WriteLine($"Name: {reader2["company_name"]}, Primary: {reader2["primary_material_type"]}, Accepted: {reader2["accepted_material_types"]}, Complete: {reader2["is_profile_complete"]}");
        }
    }
}
