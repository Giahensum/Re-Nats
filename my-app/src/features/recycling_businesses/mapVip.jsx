import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';

// ── Fix Leaflet default icon bị mất khi dùng Webpack/Vite ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom icon cho depot Premium ──
const premiumIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// ── Custom icon cho depot thường ──
const normalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// ── Custom icon cho Nhà máy tái chế ──
const factoryIcon = new L.Icon({
    iconUrl: 'https://img.icons8.com/color/48/factory.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// ── Helper: fit map bounds khi depots thay đổi ──
const FitBounds = ({ depots, factoryLocation }) => {
    const map = useMap();
    useEffect(() => {
        const valid = depots.filter(d => d.latitude && d.longitude);
        if (valid.length === 0) return;
        const coords = valid.map(d => [d.latitude, d.longitude]);
        if (factoryLocation) {
            coords.push(factoryLocation);
        }
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
    }, [depots, factoryLocation, map]);
    return null;
};

// ── Helper: map controller điều phối bay màn hình bản đồ ──
const MapController = ({ selectedDepot, flyToLocation }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedDepot && selectedDepot.latitude && selectedDepot.longitude) {
            map.setView([selectedDepot.latitude, selectedDepot.longitude], 14, { animate: true });
        }
    }, [selectedDepot, map]);

    useEffect(() => {
        if (flyToLocation) {
            map.setView(flyToLocation, 13, { animate: true });
        }
    }, [flyToLocation, map]);

    return null;
};

// ── Helper tính khoảng cách Haversine lượng giác đường tròn (km) ──
const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính Trái Đất tính bằng km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const MapVip = () => {
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);
    const [checkingPremium, setCheckingPremium] = useState(true);
    const [depots, setDepots] = useState([]);
    const [loadingDepots, setLoadingDepots] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedDepot, setSelectedDepot] = useState(null);

    // Tọa độ đăng ký của nhà máy trong Cơ sở dữ liệu (được load qua profile/premium status API)
    const [registeredLocation, setRegisteredLocation] = useState([10.8812, 106.5123]);
    // Tọa độ định vị gốc đang kích hoạt
    const [factoryLocation, setFactoryLocation] = useState([10.8812, 106.5123]);
    const [gpsMode, setGpsMode] = useState(false);
    const [flyToLocation, setFlyToLocation] = useState(null);

    // Vị trí mặc định bản đồ
    const DEFAULT_CENTER = [10.8812, 106.5123];
    const DEFAULT_ZOOM = 11;

    useEffect(() => {
        const loadAll = async () => {
            try {
                // 1. Check premium status
                const premiumRes = await factoryService.getPremiumStatus();
                const premium = premiumRes?.isPremium || false;
                setIsPremium(premium);

                if (premiumRes) {
                    const lat = premiumRes.latitude || 10.8812;
                    const lng = premiumRes.longitude || 106.5123;
                    setRegisteredLocation([lat, lng]);
                    setFactoryLocation([lat, lng]); // Mặc định điểm gốc là tọa độ nhà máy đăng ký từ DB
                }

                // 2. Fetch danh sách depot (chỉ load khi premium)
                if (premium) {
                    setLoadingDepots(true);
                    const partnerRes = await factoryService.getPartners();
                    const list = partnerRes?.data || partnerRes || [];
                    setDepots(list);
                }
            } catch (err) {
                console.error('Map load error:', err);
                setIsPremium(false);
            } finally {
                setCheckingPremium(false);
                setLoadingDepots(false);
            }
        };
        loadAll();
    }, []);

    // Lấy GPS trình duyệt thực tế
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newCoords = [pos.coords.latitude, pos.coords.longitude];
                setFactoryLocation(newCoords);
                setGpsMode(true);
                setFlyToLocation(newCoords);
            },
            (err) => {
                alert('Không thể truy cập GPS thiết bị. Vui lòng cấp quyền vị trí.');
            }
        );
    };

    // Khôi phục vị trí đăng ký trong CSDL của nhà máy
    const handleResetToDefaultFactory = () => {
        setFactoryLocation(registeredLocation);
        setGpsMode(false);
        setFlyToLocation(registeredLocation);
    };

    // Lọc theo vật liệu
    const getFilteredDepots = () => {
        if (activeFilter === 'ALL') return depots;
        return depots.filter(d => {
            if (!d.materialTypes) return true;
            const mts = d.materialTypes.map(m => m.toLowerCase());
            if (activeFilter === 'PAPER') return mts.some(m => m.includes('paper') || m.includes('cardboard'));
            if (activeFilter === 'PLASTIC') return mts.some(m => m.includes('plastic') || m.includes('hdpe') || m.includes('pet'));
            if (activeFilter === 'METAL') return mts.some(m => m.includes('iron') || m.includes('metal') || m.includes('steel'));
            return true;
        });
    };

    const validDepots = getFilteredDepots().filter(d => d.latitude && d.longitude);
    const depotsMissingCoords = getFilteredDepots().filter(d => !d.latitude || !d.longitude).length;

    // Tính toán cự ly và sắp xếp kho gần nhất
    const depotsWithDistance = validDepots.map(d => {
        const distance = getHaversineDistance(factoryLocation[0], factoryLocation[1], d.latitude, d.longitude);
        return { ...d, distance };
    }).sort((a, b) => a.distance - b.distance);

    // Màn hình Loading
    if (checkingPremium) {
        return (
            <div className="font-sans text-slate-900 overflow-hidden bg-slate-50">
                <HeaderDoanhNghiep activeTab="map" />
                <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
                    <div className="flex flex-col items-center gap-4">
                        <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                        <p className="text-slate-500 font-medium">Đang kiểm tra quyền truy cập...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Màn hình khoá Premium
    if (!isPremium) {
        return (
            <div className="font-sans text-slate-900 overflow-hidden bg-slate-50">
                <style>{`
                    .map-pattern { background-color: #eef2f6; background-image: linear-gradient(#e2e8f0 2px, transparent 2px), linear-gradient(90deg, #e2e8f0 2px, transparent 2px); background-size: 80px 80px; }
                `}</style>
                <HeaderDoanhNghiep activeTab="map" />
                <div className="relative" style={{ height: 'calc(100vh - 80px)' }}>
                    <div className="absolute inset-0 map-pattern opacity-60" style={{ filter: 'blur(4px)' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
                        <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-yellow-400"></div>
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                                <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-yellow-200">
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                Tính năng Premium
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Bản đồ Đại lý VIP</h2>
                            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                                Xem vị trí thực tế các kho vựa uy tín trên bản đồ Việt Nam, xem lịch sử giao dịch và đặt mua trực tiếp.
                            </p>
                            <ul className="text-left max-w-sm mx-auto mb-8 space-y-2.5">
                                {['Xem vị trí thực tế tất cả kho vựa', 'Tự động tính cự ly đến nhà máy của bạn', 'Lọc và phát hiện kho vựa gần nhất', 'Đặt mua ngay từ popup bản đồ'].map((item, i) => (
                                    <li key={i} className="flex items-center text-slate-700">
                                        <span className="material-symbols-outlined text-green-500 mr-3 text-xl">check_circle</span>
                                        <span className="font-medium text-sm">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/nha-may/premium" className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-white font-extrabold py-4 px-10 rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-1">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                Mua gói Premium
                            </Link>
                            <p className="mt-4 text-xs text-slate-400">Thanh toán an toàn • Hủy bất kỳ lúc nào</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans text-slate-900 overflow-hidden bg-slate-50 flex flex-col h-screen">
            {/* CSS override Leaflet popup */}
            <style>{`
                .leaflet-popup-content-wrapper {
                    border-radius: 16px;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                    border: 1px solid #e2e8f0;
                }
                .leaflet-popup-content {
                    margin: 0;
                    width: 300px !important;
                }
                .leaflet-popup-tip-container { display: none; }
                .leaflet-container { font-family: 'Inter', sans-serif; }
            `}</style>

            <HeaderDoanhNghiep activeTab="map" />

            <main className="relative w-full flex-1 flex flex-col md:flex-row" style={{ height: 'calc(100vh - 80px)' }}>

                {/* ── Filter Bar ── */}
                <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-32px)] md:w-auto md:max-w-2xl">
                    <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex items-center gap-2">
                        <button className="px-2 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold whitespace-nowrap">
                            <span className="material-symbols-outlined text-[16px] align-middle">filter_list</span>
                        </button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50vw] sm:max-w-[70vw] pr-2">
                            {[
                                { key: 'ALL', label: 'Tất cả', icon: 'recycling' },
                                { key: 'PLASTIC', label: 'Nhựa', icon: 'water_drop' },
                                { key: 'PAPER', label: 'Giấy', icon: 'description' },
                                { key: 'METAL', label: 'Kim loại', icon: 'build' },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setActiveFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                                        activeFilter === f.key
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── MAP CONTAINER ── */}
                <div className="flex-1 h-full w-full relative">
                    <MapContainer
                        center={DEFAULT_CENTER}
                        zoom={DEFAULT_ZOOM}
                        style={{ width: '100%', height: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Fit bounds bao quát cả nhà máy và các depots */}
                        {validDepots.length > 0 && (
                            <FitBounds depots={validDepots} factoryLocation={factoryLocation} />
                        )}

                        <MapController selectedDepot={selectedDepot} flyToLocation={flyToLocation} />

                        {/* Điểm Marker Nhà máy của tôi */}
                        <Marker position={factoryLocation} icon={factoryIcon}>
                            <Popup minWidth={220}>
                                <div className="p-3 text-center">
                                    <span className="material-symbols-outlined text-green-700 text-3xl">domain</span>
                                    <h4 className="font-extrabold text-sm text-slate-800 mt-1">
                                        {gpsMode ? "Vị trí GPS của bạn" : "Nhà máy Tái chế Re-Nats"}
                                    </h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Tọa độ: {factoryLocation[0].toFixed(4)}, {factoryLocation[1].toFixed(4)}</p>
                                    {gpsMode && (
                                        <button 
                                            onClick={handleResetToDefaultFactory}
                                            className="mt-2 text-[10px] text-green-700 hover:underline font-bold"
                                        >
                                            Đặt lại vị trí mặc định
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>

                        {/* Markers cho từng vựa thu mua */}
                        {validDepots.map(depot => (
                            <Marker
                                key={depot.id}
                                position={[depot.latitude, depot.longitude]}
                                icon={depot.reputationScore >= 80 ? premiumIcon : normalIcon}
                                eventHandlers={{
                                    click: () => setSelectedDepot(depot),
                                }}
                            >
                                <Popup minWidth={300} maxWidth={300}>
                                    <div className="bg-white rounded-2xl overflow-hidden">
                                        {/* Header */}
                                        <div className="bg-gradient-to-r from-primary to-green-600 p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-white font-bold text-base leading-tight">
                                                        {depot.companyName}
                                                    </h3>
                                                    <p className="text-green-100 text-xs mt-0.5 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                                        {depot.city || depot.province || 'Việt Nam'}
                                                    </p>
                                                </div>
                                                {depot.reputationScore != null && (
                                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                                                        VIP
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-slate-50 rounded-xl p-2.5">
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase mb-0.5">Giao dịch</p>
                                                    <p className="text-base font-extrabold text-slate-800">
                                                        {depot.totalTransactions ?? '—'}
                                                        <span className="text-[10px] font-normal text-slate-400 ml-1">lần</span>
                                                    </p>
                                                </div>
                                                <div className="bg-green-50 rounded-xl p-2.5 border border-green-100">
                                                    <p className="text-[10px] text-green-700 font-medium uppercase mb-0.5">Cự ly vận chuyển</p>
                                                    <p className="text-base font-extrabold text-green-700">
                                                        {getHaversineDistance(factoryLocation[0], factoryLocation[1], depot.latitude, depot.longitude).toFixed(1)}
                                                        <span className="text-[10px] font-bold text-green-500 ml-0.5"> km</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Thông tin liên hệ */}
                                            {depot.contactPerson && (
                                                <div className="space-y-1 mb-4 bg-blue-50 rounded-xl p-2.5 border border-blue-100 text-xs">
                                                    <div className="flex items-center gap-1.5 text-blue-800">
                                                        <span className="material-symbols-outlined text-[14px]">person</span>
                                                        <span className="font-semibold">{depot.contactPerson}</span>
                                                    </div>
                                                    {depot.contactPhone && (
                                                        <div className="flex items-center gap-1.5 text-blue-800">
                                                            <span className="material-symbols-outlined text-[14px]">phone</span>
                                                            <a href={`tel:${depot.contactPhone}`} className="font-bold hover:underline">
                                                                {depot.contactPhone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Địa chỉ */}
                                            {depot.address && (
                                                <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-4">
                                                    <span className="material-symbols-outlined text-slate-400 text-[14px] mt-0.5">location_on</span>
                                                    <span>{depot.address}</span>
                                                </div>
                                            )}

                                            {/* Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/nha-may/doi-tac/${depot.id}`)}
                                                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all text-xs cursor-pointer"
                                                >
                                                    Chi tiết
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/recycle/order-confirm?depotId=${depot.id}`)}
                                                    className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 text-xs cursor-pointer"
                                                >
                                                    <span>Đặt mua</span>
                                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* ── DISTANCE ANALYSIS FLOATING SIDE PANEL (VIP PREMIUM FEATURE) ── */}
                <div className="w-full md:w-80 shrink-0 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col gap-4 shadow-2xl relative z-[1000] overflow-y-auto max-h-[40vh] md:max-h-none">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-700 text-2xl font-bold animate-pulse">explore</span>
                            <h3 className="text-base font-extrabold text-slate-800">
                                Phân Tích Cự Ly Vận Chuyển
                            </h3>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">
                            Hệ thống tự động phát hiện kho gần nhất bằng thuật toán lượng giác khoảng cách.
                        </p>
                    </div>

                    {/* Định vị gốc */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 flex flex-col gap-2.5 shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            ĐIỂM ĐỊNH VỊ GỐC:
                        </div>
                        
                        <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-green-700 mt-0.5">domain</span>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-xs">
                                    {gpsMode ? "Vị trí GPS thực tế" : "Vị trí Nhà máy đăng ký"}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {gpsMode ? "Lấy từ GPS thiết bị trình duyệt" : "Lấy từ tọa độ ĐKKD trong database"}
                                </p>
                            </div>
                        </div>
                        
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-200/50 px-2.5 py-1 rounded-md self-start border border-slate-200">
                            [{factoryLocation[0].toFixed(5)}, {factoryLocation[1].toFixed(5)}]
                        </span>

                        {/* Nút Sao để lấy và định vị vị trí nhà máy / GPS */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                                onClick={handleResetToDefaultFactory}
                                className={`py-2 px-2.5 rounded-xl text-[10px] font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                                    !gpsMode 
                                        ? 'bg-green-700 text-white border-green-700' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-600 hover:text-green-700'
                                }`}
                                title="Định vị vị trí nhà máy đã đăng ký trong cơ sở dữ liệu"
                            >
                                <span className="material-symbols-outlined text-[14px]">domain</span>
                                Vị trí Nhà máy
                            </button>
                            <button
                                onClick={handleGetCurrentLocation}
                                className={`py-2 px-2.5 rounded-xl text-[10px] font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                                    gpsMode 
                                        ? 'bg-green-700 text-white border-green-700' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-600 hover:text-green-700'
                                }`}
                                title="Lấy định vị GPS thời gian thực của thiết bị"
                            >
                                <span className="material-symbols-outlined text-[14px]">my_location</span>
                                GPS Thiết bị
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Danh sách sắp xếp theo cự ly */}
                    <div className="flex-1 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Kho vựa sắp xếp theo cự ly gần nhất:
                        </span>

                        {loadingDepots ? (
                            <div className="py-6 flex flex-col items-center justify-center gap-1.5">
                                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                <span className="text-xs text-slate-400">Đang sắp xếp...</span>
                            </div>
                        ) : depotsWithDistance.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">Không tìm thấy vựa nào trong bộ lọc này.</p>
                        ) : (
                            <div className="space-y-2 max-h-[300px] md:max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                                {depotsWithDistance.map((d, index) => (
                                    <div
                                        key={d.id}
                                        onClick={() => {
                                            setSelectedDepot(d);
                                            setFlyToLocation([d.latitude, d.longitude]);
                                        }}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                            selectedDepot?.id === d.id
                                                ? 'border-green-600 bg-green-50/20 shadow-sm'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-extrabold text-slate-800 text-xs truncate max-w-[150px]">
                                                {d.companyName}
                                            </h4>
                                            {index === 0 && (
                                                <span className="bg-green-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm">
                                                    Gần Nhất
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                                            <span className="flex items-center gap-0.5 text-green-700">
                                                <span className="material-symbols-outlined text-[12px] align-middle">local_shipping</span>
                                                Cự ly: <strong>{d.distance.toFixed(1)} km</strong>
                                            </span>
                                            <span className="text-slate-400 font-normal">{d.city}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default MapVip;
