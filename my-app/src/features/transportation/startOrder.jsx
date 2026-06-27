import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { transportService } from '../../services/transportService';
import { useToast } from '../../context/ToastContext';

const styles = `
  .mobile-container {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    background-color: #f1f5f9;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .card-shadow {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .active-border {
    border-left: 6px solid #2f7f34;
  }

  .trip-line {
    position: absolute;
    left: 24px;
    top: 24px;
    bottom: 0;
    width: 2px;
    background-color: #e2e8f0;
    z-index: 0;
  }

  .glass-header {
    background: rgba(47, 127, 52, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .text-shadow-sm {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .text-shadow-md {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .qr-btn-container {
    position: relative;
    top: -24px;
  }

  .qr-btn {
    background: linear-gradient(135deg, #2f7f34 0%, #1e4d20 100%);
    box-shadow: 0 4px 12px rgba(47, 127, 52, 0.4);
  }
`;

const MATERIAL_LABEL = {
    STEEL: 'Sắt thép', ALUMINUM: 'Nhôm', COPPER: 'Đồng', LEAD: 'Chì/Ắc quy',
    PET: 'Nhựa PET', HDPE: 'Nhựa HDPE', PP: 'Nhựa PP', PVC: 'Nhựa PVC',
    CARDBOARD: 'Giấy carton', PAPER: 'Giấy thải', BATTERY: 'Pin Lithium',
    ELECTRONIC_WASTE: 'Điện tử', RUBBER: 'Cao su', OIL: 'Dầu nhớt',
    IRON: 'Sắt vụn', OTHER: 'Khác',
};

export default function StartOrder() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabParam = new URLSearchParams(window.location.search).get('tab') || 'active';
    const [activeTab, setActiveTab] = useState(tabParam);

    useEffect(() => {
        if (tabParam === 'active' || tabParam === 'history') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const loadTrips = useCallback(async () => {
        try {
            setLoading(true);
            const data = await transportService.getMyJobs();
            setTrips(data || []);
        } catch (err) {
            toast?.error('Không thể tải danh sách chuyến đi.');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        navigate(`/van-chuyen/chuyen-xe?tab=${tabName}`);
    };

    const activeTripsCount = trips.filter(t => t.status !== 'DELIVERED' && t.status !== 'CANCELLED').length;
    const historyTripsCount = trips.filter(t => t.status === 'DELIVERED' || t.status === 'CANCELLED').length;

    const filteredTrips = trips.filter(trip => 
        activeTab === 'active' 
            ? (trip.status !== 'DELIVERED' && trip.status !== 'CANCELLED')
            : (trip.status === 'DELIVERED' || trip.status === 'CANCELLED')
    );

    return (
        <>
            <style>{styles}</style>
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />

            <div className="font-sans text-slate-900 bg-slate-200 min-h-screen flex justify-center items-start py-8">
                <div className="mobile-container w-full bg-slate-50 overflow-hidden flex flex-col">
                    {/* Header */}
                    <header className="glass-header text-white p-6 pb-6 sticky top-0 z-40 shadow-lg">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-sm">
                                    <img
                                        alt="User Avatar"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCphibhLLieQqFnkOI-mFwzVQiIZdpjdhghOP7flgjx_fcbObKrw29YolHLM2IoKCvetO9Rf0EXTTGSmJMMS_uR5qhMmoowWUZGf2aENAlWXxvtGoHZs22w5iqkDzaduqwe4_M5iApxzUxMrPt_do-eY4xGML6nJcHlcGflSx5cUczRnqUJCRaDm0bcJOZhZWoc-4ovxJYrfCPq1j-ZrA8j-EPUU0rs1SmeIxzxlHWmFjChKDZmhFnwN6e25DS8Q4EyBXSwZun6p0k"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-green-50 font-medium text-shadow-sm">Xin chào,</p>
                                    <h2 className="font-bold text-lg leading-tight text-shadow-md">{user?.name || 'Tài xế'}</h2>
                                </div>
                            </div>
                            <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <span className="material-symbols-outlined text-shadow-sm">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></span>
                            </button>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-shadow-md">Chuyến đi của tôi</h1>
                                <p className="text-green-50 text-sm mt-1 text-shadow-sm opacity-90">
                                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-bold text-shadow-md">{activeTripsCount}</span>
                                <span className="text-xs text-green-50 uppercase font-semibold text-shadow-sm opacity-90">Hoạt động</span>
                            </div>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 p-4 pb-32 space-y-5 relative z-10 -mt-2">
                        {/* Tab Switcher */}
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                            <button
                                onClick={() => handleTabChange('active')}
                                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                                    activeTab === 'active'
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Đang hoạt động ({activeTripsCount})
                            </button>
                            <button
                                onClick={() => handleTabChange('history')}
                                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Lịch sử chuyến đi ({historyTripsCount})
                            </button>
                        </div>

                        {loading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredTrips.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">local_shipping</span>
                                <p className="font-semibold text-slate-505">
                                    {activeTab === 'active' ? 'Chưa nhận chuyến xe nào' : 'Chưa có chuyến đi lịch sử'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeTab === 'active' 
                                        ? 'Vui lòng quay lại màn hình "Chợ đơn" để nhận đơn hàng.'
                                        : 'Các chuyến đi hoàn thành sẽ được lưu trữ tại đây.'}
                                </p>
                                {activeTab === 'active' && (
                                    <button
                                        onClick={() => navigate('/transport/market')}
                                        className="mt-5 bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-green-700 transition"
                                    >
                                        Đến Chợ đơn
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredTrips.map(trip => {
                                const isAssigned = trip.status === 'ASSIGNED';
                                const isPickedUp = trip.status === 'PICKED_UP';
                                const isOnTheWay = trip.status === 'ON_THE_WAY' || isPickedUp;
                                const isDelivered = trip.status === 'DELIVERED';
                                const isCancelled = trip.status === 'CANCELLED';

                                return (
                                    <div key={trip.id} className="bg-white rounded-xl card-shadow overflow-hidden active-border transform transition-all hover:scale-[1.01]">
                                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                isAssigned ? 'bg-blue-100 text-blue-800' :
                                                isOnTheWay ? 'bg-amber-100 text-amber-800' :
                                                isDelivered ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {isOnTheWay && <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>}
                                                {isAssigned ? 'Chờ lấy hàng' :
                                                 isOnTheWay ? 'Đang di chuyển' :
                                                 isDelivered ? 'Đã hoàn thành' : 'Đã huỷ'}
                                            </span>
                                            <span className="text-sm font-bold text-slate-700">#TRIP-{trip.id.substring(0, 8).toUpperCase()}</span>
                                        </div>

                                        <div className="p-5">
                                            <div className="space-y-4 mb-4">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs shrink-0">A</div>
                                                        <div className="w-0.5 h-10 bg-slate-200"></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-medium">Điểm nhận hàng (Vựa)</p>
                                                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{trip.depotName}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">B</div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-medium">Điểm giao hàng (Nhà máy)</p>
                                                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{trip.factoryName}</h4>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">Hàng hoá</p>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">
                                                        {(trip.totalKg / 1000).toFixed(1)} tấn {MATERIAL_LABEL[trip.materialType] || trip.materialType}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase">Khoảng cách</p>
                                                    <p className="text-xs font-bold text-slate-800 leading-tight">
                                                        {trip.distanceKm} km
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {isAssigned && (
                                                <button
                                                    onClick={() => navigate(`/van-chuyen/checkin?jobId=${trip.id}`)}
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">play_circle</span>
                                                    Bắt đầu chuyến đi
                                                </button>
                                            )}
                                            {isOnTheWay && (
                                                <button
                                                    onClick={() => navigate(`/van-chuyen/di-chuyen?jobId=${trip.id}`)}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                                                    Đến Nhà máy &amp; Giao hàng
                                                </button>
                                            )}
                                            {isDelivered && (
                                                <div className="w-full bg-green-50 text-green-700 font-semibold py-2 px-4 rounded-lg text-center text-xs border border-green-200">
                                                    Đã giao hàng thành công
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </main>

                    {/* Bottom Navigation */}
                    <nav className="bg-white border-t border-slate-200 sticky bottom-0 z-50 pb-safe">
                        <div className="flex justify-between items-end h-[72px] px-2 relative">
                            <Link to="/transport/market" className="flex flex-col items-center justify-center w-full h-16 pb-1 text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-2xl mb-0.5">storefront</span>
                                <span className="text-[10px] font-medium">Chợ đơn</span>
                            </Link>
                            <button
                                onClick={() => handleTabChange('active')}
                                className={`flex flex-col items-center justify-center w-full h-16 pb-1 ${
                                    activeTab === 'active' ? 'text-green-600' : 'text-slate-400 hover:text-primary transition-colors'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-2xl mb-0.5 ${activeTab === 'active' ? 'fill-current' : ''}`}>local_shipping</span>
                                <span className="text-[10px] font-bold">Chuyến đi</span>
                            </button>
                            <div className="w-full flex justify-center h-full relative z-10">
                                <Link to="/van-chuyen/checkin" className="qr-btn-container flex flex-col items-center justify-center w-full">
                                    <div className="qr-btn w-14 h-14 rounded-full flex items-center justify-center text-white transform transition-transform active:scale-95 border-4 border-slate-50">
                                        <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-500 mt-1">QR Code</span>
                                </Link>
                            </div>
                            <button
                                onClick={() => handleTabChange('history')}
                                className={`flex flex-col items-center justify-center w-full h-16 pb-1 ${
                                    activeTab === 'history' ? 'text-green-600' : 'text-slate-400 hover:text-primary transition-colors'
                                }`}
                            >
                                <span className="material-symbols-outlined text-2xl mb-0.5">history</span>
                                <span className="text-[10px] font-medium">Lịch sử</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                                        logout();
                                        navigate('/dang-nhap');
                                    }
                                }}
                                className="flex flex-col items-center justify-center w-full h-16 pb-1 text-slate-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-2xl mb-0.5">logout</span>
                                <span className="text-[10px] font-medium">Đăng xuất</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );
}
