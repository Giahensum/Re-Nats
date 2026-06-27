import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Sửa lỗi icon mặc định của Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons cho các địa điểm khác nhau
const originIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/color/48/marker.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const depotIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/color/48/warehouse-fort.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const factoryIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/color/48/factory.png',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42]
});

const truckIcon = new L.Icon({
  iconUrl: 'https://img.icons8.com/color/48/delivery-truck.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19]
});

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [simulating, setSimulating] = useState(false);
  const [factoryLocation, setFactoryLocation] = useState([10.8812, 106.5123]);

  // Vị trí các mốc địa lý để mô phỏng bản đồ
  const locations = {
    origin1: [10.7876, 106.6346], // Điểm thu gom 1
    origin2: [10.8524, 106.7582], // Điểm thu gom 2
    depot1: [10.8231, 106.6297], // Vựa trung chuyển 1
    depot2: [10.8495, 106.7355], // Vựa trung chuyển 2
    factory: factoryLocation // Sử dụng tọa độ động từ DB thay vì hardcode
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await factoryService.getOrders();
      if (data && data.length > 0) {
        setOrders(data);
        loadOrderDetail(data[0].id);
      } else {
        setOrders([]);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetail = async (id, fallbackList = null) => {
    try {
      const detail = await factoryService.getOrderDetail(id);
      if (detail) {
        setSelectedOrder(detail);
      } else {
        setSelectedOrder(null);
      }
    } catch {
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFactoryDetails = async () => {
      try {
        const premiumRes = await factoryService.getPremiumStatus();
        if (premiumRes && premiumRes.latitude && premiumRes.longitude) {
          setFactoryLocation([premiumRes.latitude, premiumRes.longitude]);
        }
      } catch (err) {
        console.error('Error loading factory coordinates:', err);
      }
    };
    loadFactoryDetails();
    loadOrders();
  }, []);

  // Lọc danh sách đơn hàng
  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'IN_PROGRESS') return o.status === 'IN_PROGRESS' || o.status === 'ACCEPTED';
    if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeFilter === 'VERIFIED') return o.status === 'VERIFIED';
    return true;
  });

  const getStatusText = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'Đã nhận thầu';
      case 'IN_PROGRESS': return 'Đang vận chuyển';
      case 'DELIVERED': return 'Chờ cân nghiệm thu';
      case 'VERIFIED': return 'Đã xác thực cân';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'DELIVERED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'VERIFIED': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getMaterialLabel = (type) => {
    if (type === 'CARDBOARD' || type === 'PAPER') return 'Giấy Carton nén';
    return 'Nhựa các loại đóng kiện';
  };

  // Giả lập từng bước check-in check-out
  const handleSimulateStep = async (stepKey) => {
    if (!selectedOrder) return;
    setSimulating(true);

    const isFirst = selectedOrder.batch.batchCode.includes('2601') || selectedOrder.batch.batchCode.includes('2500');
    const startLoc = isFirst ? locations.origin1 : locations.origin2;
    const depotLoc = isFirst ? locations.depot1 : locations.depot2;
    const endLoc = locations.factory;

    let payload = {
      step: stepKey,
      latitude: startLoc[0],
      longitude: startLoc[1],
      note: ''
    };

    switch (stepKey) {
      case 'checkin_shopee':
        payload.note = `[Check-in Nguồn] Tài xế check-in tại ${isFirst ? 'Điểm tập kết phế liệu Quận 9' : 'Kho trung chuyển phế liệu Thủ Đức'}.`;
        payload.latitude = startLoc[0];
        payload.longitude = startLoc[1];
        break;
      case 'checkout_shopee':
        payload.note = `[Check-out Nguồn] Chất hàng hoàn tất. Bắt đầu di chuyển về vựa.`;
        payload.latitude = (startLoc[0] + depotLoc[0]) / 2;
        payload.longitude = (startLoc[1] + depotLoc[1]) / 2;
        break;
      case 'checkin_depot':
        payload.note = `[Check-in Vựa] Xe tải đến cổng ${selectedOrder.batch.depot.companyName}. Tiến hành check-in trạm cân của vựa.`;
        payload.latitude = depotLoc[0];
        payload.longitude = depotLoc[1];
        break;
      case 'checkout_depot':
        payload.note = `[Check-out Vựa] Chốt phiếu cân xuất kho tại Vựa. Bắt đầu vận chuyển về nhà máy Re-Nats.`;
        payload.latitude = (depotLoc[0] + endLoc[0]) / 2;
        payload.longitude = (depotLoc[1] + endLoc[1]) / 2;
        break;
      case 'checkin_factory':
        payload.note = `[Check-in Nhà Máy] Xe cập cổng bảo vệ Nhà máy Re-Nats Long An. Chờ cân nghiệm thu.`;
        payload.latitude = endLoc[0];
        payload.longitude = endLoc[1];
        break;
      default:
        break;
    }

    try {
      // Gọi API thật lên backend
      await factoryService.simulateStep(selectedOrder.id, payload);
      
      // Load lại dữ liệu đơn hàng
      await loadOrders();
      await loadOrderDetail(selectedOrder.id);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Xác định vị trí xe hiện tại trên bản đồ dựa trên tracking logs
  const getTruckPosition = () => {
    if (!selectedOrder || !selectedOrder.transport || !selectedOrder.transport.trackingLogs || selectedOrder.transport.trackingLogs.length === 0) {
      const isFirst = selectedOrder?.batch?.batchCode?.includes('2601') || selectedOrder?.batch?.batchCode?.includes('2500');
      return isFirst ? locations.origin1 : locations.origin2;
    }
    const logs = selectedOrder.transport.trackingLogs;
    const lastLog = logs[logs.length - 1];
    return [lastLog.latitude || 10.7876, lastLog.longitude || 106.6346];
  };

  const getRouteCoordinates = () => {
    if (!selectedOrder) return [];
    const isFirst = selectedOrder.batch.batchCode.includes('2601') || selectedOrder.batch.batchCode.includes('2500');
    const start = isFirst ? locations.origin1 : locations.origin2;
    const depot = isFirst ? locations.depot1 : locations.depot2;
    const end = locations.factory;
    return [start, depot, end];
  };

  const getLogForStep = (stepKey) => {
    if (!selectedOrder?.transport?.trackingLogs) return null;
    return selectedOrder.transport.trackingLogs.find(l => {
      const noteLower = l.note?.toLowerCase() || '';
      const typeLower = l.logType?.toLowerCase() || '';
      
      if (stepKey === 'checkin_shopee') {
        return noteLower.includes('check-in cổng kho') || noteLower.includes('checkin_shopee') || typeLower.includes('shopee') || typeLower.includes('intermediate') && noteLower.includes('checkin') || typeLower.includes('checkin_intermediate');
      }
      if (stepKey === 'checkout_shopee') {
        return noteLower.includes('xác thực') || noteLower.includes('checkout_shopee') || typeLower.includes('shopee') || typeLower.includes('intermediate') && noteLower.includes('checkout') || typeLower.includes('checkout_intermediate');
      }
      if (stepKey === 'checkin_depot') {
        return noteLower.includes('check-in tại vựa') || noteLower.includes('checkin_depot') || typeLower.includes('depot') && noteLower.includes('checkin') || typeLower.includes('checkin_depot');
      }
      if (stepKey === 'checkout_depot') {
        return noteLower.includes('chốt xuất kho vựa') || noteLower.includes('checkout_depot') || typeLower.includes('depot') && noteLower.includes('checkout') || typeLower.includes('checkout_depot');
      }
      if (stepKey === 'checkin_factory') {
        return noteLower.includes('checkin_factory') || typeLower.includes('factory');
      }
      return false;
    });
  };

  const renderEvidencePhoto = (stepKey, defaultImages = []) => {
    const log = getLogForStep(stepKey);
    if (!log) return null;
    
    const imgUrl = log.imageUrl || defaultImages[0];
    
    return (
      <div className="mt-3 flex gap-3 flex-wrap">
        {imgUrl && (
          <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm group/img cursor-pointer" onClick={() => window.open(imgUrl, '_blank')}>
            <img src={imgUrl} alt="Evidence image" className="object-cover w-full h-full hover:scale-105 transition-all" />
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold py-0.5">ẢNH MINH CHỨNG EPR</span>
          </div>
        )}
        {log.imageUrl && defaultImages[1] && (
          <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm group/img cursor-pointer" onClick={() => window.open(defaultImages[1], '_blank')}>
            <img src={defaultImages[1]} alt="Evidence image 2" className="object-cover w-full h-full hover:scale-105 transition-all" />
            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold py-0.5">ẢNH THÙNG XE</span>
          </div>
        )}
        <div className="flex-1 min-w-[200px] text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-between">
          <span className="italic">" {log.note || 'Tài xế đã ghi nhận check-in/check-out phân đoạn này.'} "</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1">📍 GPS: {log.latitude}, {log.longitude} • Lúc: {new Date(log.createdAt).toLocaleTimeString('vi-VN')} {new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col overflow-x-hidden">
      {/* Leaflet CSS Inject */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Unified Premium Header */}
      <HeaderDoanhNghiep activeTab="orders" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR: Order List */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Lịch Sử Mua Hàng</h2>
            
            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/50 mb-4 text-xs font-semibold">
              <button 
                onClick={() => setActiveFilter('ALL')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveFilter('IN_PROGRESS')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'IN_PROGRESS' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Đang đi
              </button>
              <button 
                onClick={() => setActiveFilter('DELIVERED')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'DELIVERED' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Chờ trạm cân
              </button>
              <button 
                onClick={() => setActiveFilter('VERIFIED')}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${activeFilter === 'VERIFIED' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Đã chốt
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-slate-400 font-medium">Đang tải danh sách...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">Không tìm thấy đơn hàng nào.</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredOrders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => loadOrderDetail(o.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2.5 ${
                      selectedOrder?.id === o.id
                        ? 'border-green-600 bg-green-50/30 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-400">#{o.batchCode}</span>
                        <h4 className="font-bold text-slate-800 mt-0.5 group-hover:text-primary transition-colors text-sm">
                          {getMaterialLabel(o.materialType)}
                        </h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(o.status)}`}>
                        {getStatusText(o.status)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">store</span>
                        <span className="truncate max-w-[130px] font-medium">{o.depotName}</span>
                      </div>
                      <span className="font-extrabold text-slate-800">
                        {o.totalAmount?.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium ESG Partner Card */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-15">
              <span className="material-symbols-outlined text-[100px] text-white">shield_with_heart</span>
            </div>
            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold self-start border border-white/10 uppercase tracking-wider">Kinh tế tuần hoàn</span>
              <h3 className="text-base font-extrabold leading-tight">Theo dõi chuỗi cung ứng xanh số hoá</h3>
              <p className="text-xs text-green-50 leading-relaxed mt-1 opacity-90">
                Toàn bộ phế liệu từ vựa đều được dán nhãn định danh, cho phép nhà máy tái chế truy xuất nguồn gốc chính xác 100% qua phân đoạn vận chuyển để xuất báo cáo phát thải EPR.
              </p>
            </div>
          </div>

        </div>

        {/* MAIN DETAIL: Tracking & Interactive Map */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedOrder ? (
            <>
              {/* Header Details */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-400">ĐƠN HÀNG #{selectedOrder.batch.batchCode}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 mt-1">
                    {getMaterialLabel(selectedOrder.batch.materialType)}
                  </h1>
                  <p className="text-slate-400 text-xs mt-1">
                    Ngày tạo: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Khối lượng ước tính</p>
                    <p className="text-lg font-bold text-slate-800">{selectedOrder.batch.estimatedWeightKg?.toLocaleString('vi-VN')} kg</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200"></div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Tổng giá trị thầu</p>
                    <p className="text-lg font-extrabold text-green-700">{(selectedOrder.agreedPrice * selectedOrder.batch.estimatedWeightKg)?.toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>
              </div>

              {/* Map View */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-700">map</span>
                    Bản Đồ Định Vị Phân Đoạn &amp; Hành Trình Vận Chuyển
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse"></span>
                    <span>Đang cập nhật GPS</span>
                  </div>
                </div>

                {/* Leaflet Map Integration */}
                <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200 z-10">
                  <MapContainer 
                    center={getTruckPosition()} 
                    zoom={11} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Điểm xuất phát */}
                    <Marker 
                      position={selectedOrder.batch.batchCode.includes('2601') || selectedOrder.batch.batchCode.includes('2500') ? locations.origin1 : locations.origin2}
                      icon={originIcon}
                    >
                      <Popup>
                        <div className="font-bold text-xs">Điểm tập kết phế liệu</div>
                      </Popup>
                    </Marker>

                    {/* Điểm Vựa */}
                    <Marker 
                      position={selectedOrder.batch.batchCode.includes('2601') || selectedOrder.batch.batchCode.includes('2500') ? locations.depot1 : locations.depot2}
                      icon={depotIcon}
                    >
                      <Popup>
                        <div className="font-bold text-xs">{selectedOrder.batch.depot.companyName}</div>
                      </Popup>
                    </Marker>

                    {/* Điểm Nhà máy */}
                    <Marker position={locations.factory} icon={factoryIcon}>
                      <Popup>
                        <div className="font-bold text-xs">Nhà máy Tái chế Re-Nats Long An</div>
                      </Popup>
                    </Marker>

                    {/* Xe tải tài xế */}
                    {selectedOrder.status !== 'VERIFIED' && (
                      <Marker position={getTruckPosition()} icon={truckIcon}>
                        <Popup>
                          <div className="font-bold text-xs">Xe tải: {selectedOrder.transport?.vehiclePlate} ({selectedOrder.transport?.driverName})</div>
                        </Popup>
                      </Marker>
                    )}

                    <Polyline positions={getRouteCoordinates()} color="#059669" weight={4} dashArray="5, 10" />
                  </MapContainer>
                </div>
              </div>

              {/* Segmented Check-in / Check-out Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-700">playlist_add_check</span>
                    Tiến Độ Check-in &amp; Check-out Từng Phân Đoạn (Hồ Sơ EPR)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Tài xế thực hiện check-in cổng điểm tập kết và check-out chốt sản lượng với vựa trung chuyển trước khi vận chuyển về nhà máy.
                  </p>
                </div>

                {/* Timeline Components */}
                <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 py-2">
                  
                  {/* Step 1: Origin Check-in */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      getLogForStep('checkin_shopee')
                        ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">login</span>
                    </span>
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 1: Check-in Điểm tập kết phế liệu</h4>
                        <span className="text-xs text-slate-400 font-semibold">Bắt buộc</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Xe tải cập bến kho bãi nguồn để bốc xếp phế liệu lên thùng xe.</p>
                      {renderEvidencePhoto('checkin_shopee', [
                        "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=150",
                        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150"
                      ])}
                    </div>
                  </div>

                  {/* Step 2: Origin Check-out */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      getLogForStep('checkout_shopee')
                        ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">logout</span>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 2: Check-out Điểm tập kết phế liệu</h4>
                      <p className="text-xs text-slate-500 mt-1">Xác thực sản lượng và niêm phong thùng xe, xe lăn bánh hướng về vựa gom.</p>
                      {renderEvidencePhoto('checkout_shopee', [
                        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150"
                      ])}
                    </div>
                  </div>

                  {/* Step 3: Depot Check-in */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      getLogForStep('checkin_depot')
                        ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 3: Check-in Vựa đối tác ({selectedOrder.batch.depot.companyName})</h4>
                      <p className="text-xs text-slate-500 mt-1">Hạ tải phế liệu thô xuống trạm cân trung chuyển của vựa để ép kiện chặt tiêu chuẩn.</p>
                      {renderEvidencePhoto('checkin_depot', [
                        "https://images.unsplash.com/photo-1553413077-190dd305871c?w=150"
                      ])}
                    </div>
                  </div>

                  {/* Step 4: Depot Check-out */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      getLogForStep('checkout_depot')
                        ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">scale</span>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 4: Check-out Vựa (Lên kiện nén về Nhà máy)</h4>
                      <p className="text-xs text-slate-500 mt-1">Xuất xưởng kiện nén sạch. Tài xế chụp phiếu cân của vựa đối tác.</p>
                      {renderEvidencePhoto('checkout_depot', [
                        "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=150"
                      ])}
                    </div>
                  </div>

                  {/* Step 5: Factory Check-in */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      selectedOrder.status === 'DELIVERED' || selectedOrder.status === 'VERIFIED' || getLogForStep('checkin_factory')
                        ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">domain</span>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 5: Check-in Cổng Nhà Máy Re-Nats</h4>
                      <p className="text-xs text-slate-500 mt-1">Xe tải dừng tại trạm bảo vệ, quét biển số và đối chiếu mã lô số hóa.</p>
                      {renderEvidencePhoto('checkin_factory', [
                        "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=150"
                      ])}
                    </div>
                  </div>

                  {/* Step 6: Weighing & KCS Complete */}
                  <div className="relative">
                    <span className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                      selectedOrder.status === 'VERIFIED' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Phân đoạn 6: Nghiệm thu &amp; Chốt khối lượng thực tế</h4>
                      <p className="text-xs text-slate-500 mt-1">Hoàn tất kiểm định độ ẩm, độ lẫn tạp chất và chốt hóa đơn thanh toán.</p>
                      
                      {selectedOrder.status === 'VERIFIED' && (
                        <div className="mt-3 bg-green-50/50 border border-green-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Khối lượng cân chốt</p>
                            <p className="text-base font-extrabold text-slate-800">
                              {(selectedOrder.batch.actualWeightKg ?? selectedOrder.batch.estimatedWeightKg)?.toLocaleString('vi-VN')} kg (Thực tế)
                            </p>
                            {selectedOrder.batch.actualWeightKg && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Sai lệch: {(((selectedOrder.batch.actualWeightKg - selectedOrder.batch.estimatedWeightKg) / selectedOrder.batch.estimatedWeightKg) * 100).toFixed(1)}% (Trong ngưỡng cho phép)
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Chất lượng kiểm nghiệm</p>
                            <p className="text-base font-extrabold text-slate-800">Độ ẩm: 8% • Tạp chất: 3.2%</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Hàng loại A đạt chuẩn chất lượng</p>
                          </div>
                          <Link 
                            to={`/hoa-don/${selectedOrder.id}`} 
                            className="bg-green-700 hover:bg-green-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm self-start flex items-center gap-1.5 transition-all"
                          >
                            <span className="material-symbols-outlined text-base">receipt_long</span>
                            Xem Hóa Đơn &amp; Chứng Chỉ
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* FLOATING DRIVER ACTION SIMULATOR CONTROL */}
              {selectedOrder.status !== 'VERIFIED' && (
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 border border-slate-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-base flex items-center gap-2 text-green-400">
                        <span className="material-symbols-outlined text-xl">sports_esports</span>
                        TRÌNH GIẢ LẬP CHECK-IN / CHECK-OUT CHO TÀI XẾ (DRIVER SIMULATOR)
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Do bên đối tác Vận tải chưa hoàn thiện app Tài xế, bạn có thể bấm các nút dưới đây để giả lập tài xế check-in/checkout trên đường đi.
                      </p>
                    </div>
                    {simulating && (
                      <span className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-1">
                    
                    <button
                      onClick={() => handleSimulateStep('checkin_shopee')}
                      disabled={simulating || selectedOrder.status === 'DELIVERED'}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-orange-500 text-xl">login</span>
                      <span>1. Check-in Nguồn</span>
                    </button>

                    <button
                      onClick={() => handleSimulateStep('checkout_shopee')}
                      disabled={simulating || selectedOrder.status === 'DELIVERED'}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-orange-500 text-xl">photo_camera</span>
                      <span>2. Xác thực &amp; Đi</span>
                    </button>

                    <button
                      onClick={() => handleSimulateStep('checkin_depot')}
                      disabled={simulating || selectedOrder.status === 'DELIVERED'}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-blue-400 text-xl">warehouse</span>
                      <span>3. Check-in Vựa</span>
                    </button>

                    <button
                      onClick={() => handleSimulateStep('checkout_depot')}
                      disabled={simulating || selectedOrder.status === 'DELIVERED'}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-blue-400 text-xl">scale</span>
                      <span>4. Xuất Bến Vựa</span>
                    </button>

                    <button
                      onClick={() => handleSimulateStep('checkin_factory')}
                      disabled={simulating || selectedOrder.status === 'DELIVERED'}
                      className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed border border-green-600 p-3 rounded-xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 text-xs font-bold col-span-2 sm:col-span-1"
                    >
                      <span className="material-symbols-outlined text-white text-xl">local_shipping</span>
                      <span>5. Đến Nhà Máy</span>
                    </button>

                  </div>

                  {selectedOrder.status === 'DELIVERED' && (
                    <div className="bg-green-950/50 border border-green-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div>
                        <h5 className="font-extrabold text-sm text-green-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">verified</span>
                          ĐÃ CHECK-IN TẠI CỔNG NHÀ MÁY
                        </h5>
                        <p className="text-xs text-slate-400 mt-0.5">Xe đang chờ tại trạm cân. Bạn có muốn duyệt kiểm nghiệm và chốt hóa đơn ngay lập tức?</p>
                      </div>
                      <Link
                        to={`/recycle/order-process?orderId=${selectedOrder.id}`}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">scale</span>
                        Đi tới Trạm Cân
                      </Link>
                    </div>
                  )}

                </div>
              )}
            </>
          ) : (
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 text-sm gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">local_shipping</span>
              <p>Chọn một đơn hàng để theo dõi chi tiết hành trình phân đoạn và check-in/check-out.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default OrderTracking;
