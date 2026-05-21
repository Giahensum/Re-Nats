using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Renats_BE.Data;
using Renats_BE.Models;
using Renats_BE.Models.Enums;

namespace Renats_BE.Controllers.Factory;

[ApiController]
[Route("api/factory/orders")]
[Authorize(Roles = "FACTORY")]
public class FactoryOrderController : ControllerBase
{
    private readonly AppDbContext _db;
    public FactoryOrderController(AppDbContext db) => _db = db;

    // POST /api/factory/orders/bid  – Đặt giá thầu
    [HttpPost("bid")]
    public async Task<IActionResult> PlaceBid([FromBody] PlaceBidDto dto)
    {
        var batch = await _db.InventoryBatches.FindAsync(dto.BatchId);
        if (batch is null) return NotFound("Batch not found");
        if (batch.Status != BatchStatus.LISTED && batch.Status != BatchStatus.BIDDING)
            return BadRequest("Batch is not available for bidding");

        var factory = await _db.Factories.FindAsync(dto.FactoryId);
        if (factory is null) return NotFound("Factory not found");

        // Kiểm tra đã bid chưa
        var existing = await _db.BatchBids
            .AnyAsync(b => b.BatchId == dto.BatchId && b.FactoryId == dto.FactoryId && b.Status == BidStatus.PENDING);
        if (existing) return BadRequest("Already placed a bid on this batch");

        var bid = new BatchBid
        {
            BatchId = dto.BatchId,
            FactoryId = dto.FactoryId,
            BidPrice = dto.BidPrice,
            Note = dto.Note,
            Status = BidStatus.PENDING
        };

        // Chuyển batch sang BIDDING
        batch.Status = BatchStatus.BIDDING;
        batch.UpdatedAt = DateTime.UtcNow;

        _db.BatchBids.Add(bid);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrders), new { factoryId = dto.FactoryId }, new { bidId = bid.Id });
    }

    // POST /api/factory/orders/confirm  – Xác nhận đơn (sau khi bid được chấp nhận)
    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmOrder([FromBody] ConfirmOrderDto dto)
    {
        var bid = await _db.BatchBids
            .Include(b => b.Batch)
            .FirstOrDefaultAsync(b => b.Id == dto.BidId);

        if (bid is null) return NotFound("Bid not found");
        if (bid.Status != BidStatus.ACCEPTED) return BadRequest("Bid has not been accepted");

        var order = new BatchOrder
        {
            BatchId = bid.BatchId,
            FactoryId = bid.FactoryId,
            AcceptedBidId = bid.Id,
            AgreedPrice = bid.BidPrice,
            Status = BatchStatus.ACCEPTED
        };

        bid.Batch.Status = BatchStatus.ACCEPTED;
        bid.Batch.AcceptedAt = DateTime.UtcNow;

        _db.BatchOrders.Add(order);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrderDetail), new { id = order.Id }, new { orderId = order.Id });
    }

    // GET /api/factory/orders?factoryId=&status=
    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] Guid factoryId, [FromQuery] string? status)
    {
        var query = _db.BatchOrders
            .Where(o => o.FactoryId == factoryId)
            .Include(o => o.Batch).ThenInclude(b => b.Depot)
            .Include(o => o.TransportJob)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) &&
            Enum.TryParse<BatchStatus>(status, ignoreCase: true, out var s))
            query = query.Where(o => o.Status == s);

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                id = o.Id,
                batchCode = o.Batch.BatchCode,
                materialType = o.Batch.MaterialType.ToString(),
                depotName = o.Batch.Depot.CompanyName,
                agreedPrice = o.AgreedPrice,
                totalAmount = o.TotalAmount,
                status = o.Status.ToString(),
                transportStatus = o.TransportJob != null ? o.TransportJob.Status.ToString() : null,
                createdAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    // GET /api/factory/orders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrderDetail(Guid id)
    {
        var order = await _db.BatchOrders
            .Where(o => o.Id == id)
            .Include(o => o.Batch).ThenInclude(b => b.Depot)
            .Include(o => o.Batch).ThenInclude(b => b.Images)
            .Include(o => o.TransportJob).ThenInclude(t => t!.Driver)
            .Include(o => o.WeightTicket)
            .Include(o => o.WeightVerification)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync();

        if (order is null) return NotFound();

        return Ok(new
        {
            id = order.Id,
            status = order.Status.ToString(),
            agreedPrice = order.AgreedPrice,
            totalAmount = order.TotalAmount,
            createdAt = order.CreatedAt,
            batch = new
            {
                id = order.Batch.Id,
                batchCode = order.Batch.BatchCode,
                materialType = order.Batch.MaterialType.ToString(),
                estimatedWeightKg = order.Batch.EstimatedWeightKg,
                actualWeightKg = order.Batch.ActualWeightKg,
                unitPrice = order.Batch.UnitPrice,
                description = order.Batch.Description,
                thumbnailImageUrl = order.Batch.ThumbnailImageUrl,
                images = order.Batch.Images.Select(i => i.ImageUrl).ToList(),
                depot = new
                {
                    id = order.Batch.Depot.Id,
                    companyName = order.Batch.Depot.CompanyName,
                    address = order.Batch.Depot.Address,
                    city = order.Batch.Depot.City,
                    reputationScore = order.Batch.Depot.ReputationScore
                }
            },
            transport = order.TransportJob is null ? null : new
            {
                id = order.TransportJob.Id,
                status = order.TransportJob.Status.ToString(),
                pickupAddress = order.TransportJob.PickupAddress,
                deliveryAddress = order.TransportJob.DeliveryAddress,
                vehiclePlate = order.TransportJob.Driver?.VehiclePlate,
                driverName = order.TransportJob.Driver?.User?.FullName
            },
            weightTicket = order.WeightTicket is null ? null : new
            {
                grossWeightKg = order.WeightTicket.GrossWeightKg,
                tareWeightKg = order.WeightTicket.TareWeightKg,
                netWeightKg = order.WeightTicket.NetWeightKg,
                ticketNumber = order.WeightTicket.TicketNumber
            },
            weightVerification = order.WeightVerification is null ? null : new
            {
                depotWeightKg = order.WeightVerification.DepotWeightKg,
                factoryWeightKg = order.WeightVerification.FactoryWeightKg,
                differenceKg = order.WeightVerification.DifferenceKg,
                differencePercentage = order.WeightVerification.DifferencePercentage,
                isVerified = order.WeightVerification.IsVerified
            }
        });
    }

    public class PlaceBidDto
    {
        public Guid BatchId { get; set; }
        public Guid FactoryId { get; set; }
        public decimal BidPrice { get; set; }
        public string? Note { get; set; }
    }

    public class ConfirmOrderDto
    {
        public Guid BidId { get; set; }
    }
}
