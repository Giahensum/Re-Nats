using Renats_BE.Models.Enums;

namespace Renats_BE.Models;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BatchOrderId { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? InvoiceFileUrl { get; set; }
    public decimal? Subtotal { get; set; }
    public decimal? VatAmount { get; set; }
    public decimal? CommissionFee { get; set; }
    public decimal? TotalAmount { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.PENDING;
    public Guid? UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public BatchOrder BatchOrder { get; set; } = null!;
    public User? Uploader { get; set; }
}
