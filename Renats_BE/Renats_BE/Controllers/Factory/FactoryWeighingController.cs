using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Factory;

[ApiController]
[Route("api/factory/weighing")]
[Authorize(Roles = "FACTORY")]
public class FactoryWeighingController : ControllerBase
{
    private readonly AppDbContext _db;
    public FactoryWeighingController(AppDbContext db) => _db = db;

    // GET /api/factory/weighing/queue?factoryId=
    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue([FromQuery] Guid factoryId)
    {
        var queue = await _db.TransportJobs
            .Where(t => t.BatchOrder.FactoryId == factoryId &&
                        (t.Status == TransportStatus.PICKED_UP || t.Status == TransportStatus.ON_THE_WAY))
            .Include(t => t.Driver)
            .Include(t => t.BatchOrder).ThenInclude(o => o.Batch).ThenInclude(b => b.Depot)
            .OrderBy(t => t.PickupTime)
            .Select(t => new
            {
                transportJobId = t.Id,
                orderId = t.BatchOrderId,
                status = t.Status.ToString(),
                vehiclePlate = t.Driver != null ? t.Driver.VehiclePlate : null,
                driverName = t.Driver != null ? t.Driver.User.FullName : null,
                materialType = t.BatchOrder.Batch.MaterialType.ToString(),
                depotName = t.BatchOrder.Batch.Depot.CompanyName,
                estimatedWeightKg = t.BatchOrder.Batch.EstimatedWeightKg,
                pickupTime = t.PickupTime
            })
            .ToListAsync();

        return Ok(queue);
    }

    // POST /api/factory/weighing/{orderId}/complete
    [HttpPost("{orderId}/complete")]
    public async Task<IActionResult> CompleteWeighing(Guid orderId, [FromBody] CompleteWeighingDto dto)
    {
        var order = await _db.BatchOrders
            .Include(o => o.Batch)
            .Include(o => o.TransportJob)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null) return NotFound("Order not found");

        var netWeight = dto.MeasuredWeightKg - dto.ImpurityWeightKg;
        var diffPct = dto.MeasuredWeightKg > 0
            ? Math.Round(dto.ImpurityWeightKg / dto.MeasuredWeightKg * 100, 2)
            : 0;

        var ticket = new WeightTicket
        {
            BatchOrderId = orderId,
            TicketNumber = $"TKT-{DateTime.UtcNow:yyyyMMddHHmmss}",
            GrossWeightKg = dto.MeasuredWeightKg,
            TareWeightKg = dto.ImpurityWeightKg,
            NetWeightKg = netWeight,
            WeighingStation = dto.Station ?? "KCS Station"
        };

        var verification = new WeightVerification
        {
            BatchOrderId = orderId,
            DepotWeightKg = order.Batch.EstimatedWeightKg,
            FactoryWeightKg = netWeight,
            DifferenceKg = order.Batch.EstimatedWeightKg - netWeight,
            DifferencePercentage = diffPct,
            IsVerified = true,
            VerificationNote = dto.Note
        };

        order.Batch.ActualWeightKg = netWeight;
        order.Batch.UpdatedAt = DateTime.UtcNow;
        order.TotalAmount = netWeight * order.AgreedPrice;
        order.Status = BatchStatus.VERIFIED;
        order.Batch.VerifiedAt = DateTime.UtcNow;

        if (order.TransportJob != null)
        {
            order.TransportJob.Status = TransportStatus.DELIVERED;
            order.TransportJob.DeliveredTime = DateTime.UtcNow;
        }

        var depot = await _db.Depots.FindAsync(order.Batch.DepotId);
        if (depot != null)
        {
            depot.TotalTransactions++;
            depot.ReputationScore = diffPct < 5
                ? Math.Min(100, depot.ReputationScore + 1)
                : Math.Max(0, depot.ReputationScore - 2);
        }

        _db.WeightTickets.Add(ticket);
        _db.WeightVerifications.Add(verification);
        await _db.SaveChangesAsync();

        return Ok(new { ticketId = ticket.Id, netWeightKg = netWeight, impurityRate = diffPct, totalAmount = order.TotalAmount });
    }

    // POST /api/factory/weighing/{orderId}/reject
    [HttpPost("{orderId}/reject")]
    public async Task<IActionResult> RejectTruck(Guid orderId, [FromBody] RejectDto dto)
    {
        var order = await _db.BatchOrders
            .Include(o => o.TransportJob)
            .Include(o => o.Batch)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null) return NotFound();

        order.Status = BatchStatus.REJECTED;
        order.Batch.Status = BatchStatus.REJECTED;
        order.Batch.UpdatedAt = DateTime.UtcNow;
        if (order.TransportJob != null)
            order.TransportJob.Status = TransportStatus.CANCELLED;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Truck rejected", reason = dto.Reason });
    }

    public class CompleteWeighingDto
    {
        public decimal MeasuredWeightKg { get; set; }
        public decimal ImpurityWeightKg { get; set; }
        public string? Station { get; set; }
        public string? Note { get; set; }
    }

    public class RejectDto { public string? Reason { get; set; } }
}
