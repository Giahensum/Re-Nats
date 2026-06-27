namespace Renats_BE.Models;

public class TransportTrackingLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TransportJobId { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Note { get; set; }
    public string? LogType { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public TransportJob TransportJob { get; set; } = null!;
}
