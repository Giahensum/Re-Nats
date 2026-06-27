import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

const MaterialsMarket = () => {
    const toast = useToast();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [premiumInfo, setPremiumInfo] = useState({ isPremium: false, expiresAt: null });
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch listed batches
                const batchRes = await factoryService.getBatches();
                setBatches(batchRes.data || []);

                // Fetch premium status
                const premiumRes = await factoryService.getPremiumStatus();
                setPremiumInfo(premiumRes);
            } catch (err) {
                console.error('Error fetching market data:', err);
                toast.error('Không thể kết nối máy chủ để tải danh sách lô hàng!');
                setBatches([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [toast]);

    // Local filter function
    const getFilteredBatches = () => {
        if (activeFilter === 'ALL') return batches;
        return batches.filter(b => {
            const mat = b.materialType.toUpperCase();
            if (activeFilter === 'PAPER') {
                return mat === 'PAPER' || mat === 'CARDBOARD';
            }
            if (activeFilter === 'PLASTIC') {
                return mat === 'PET' || mat === 'HDPE' || mat === 'PVC';
            }
            if (activeFilter === 'METAL') {
                return mat === 'ALUMINUM' || mat === 'IRON' || mat === 'STEEL' || mat === 'COPPER';
            }
            return true;
        });
    };

    const filteredBatches = getFilteredBatches();

    return (
        <div className="font-sans text-slate-900 overflow-x-hidden bg-slate-50 min-h-screen flex flex-col">
            {/* Header dùng chung */}
            <HeaderDoanhNghiep activeTab="market" />

            {/* ── MAIN CONTENT ── */}
            <section className="py-10 flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Marketplace Controls */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <h1 className="text-2xl font-extrabold text-slate-800 whitespace-nowrap mr-4">Chợ Nguyên Liệu</h1>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveFilter('ALL')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                                        activeFilter === 'ALL'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">recycling</span> Tất cả
                                </button>
                                <button
                                    onClick={() => setActiveFilter('PAPER')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all border ${
                                        activeFilter === 'PAPER'
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">description</span> Giấy
                                </button>
                                <button
                                    onClick={() => setActiveFilter('PLASTIC')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all border ${
                                        activeFilter === 'PLASTIC'
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">water_drop</span> Nhựa
                                </button>
                                <button
                                    onClick={() => setActiveFilter('METAL')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all border ${
                                        activeFilter === 'METAL'
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg">build</span> Kim loại
                                </button>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                className="px-4 py-2 bg-white text-slate-800 rounded-md shadow-sm text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">grid_view</span> Danh sách
                            </button>
                            <Link
                                to="/nha-may/map"
                                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                                <span className="material-symbols-outlined text-lg">map</span> Bản đồ
                            </Link>
                        </div>
                    </div>

                    {/* Active Premium Tag */}
                    {premiumInfo.isPremium && (
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600 text-2xl">workspace_premium</span>
                            <div>
                                <p className="text-sm font-extrabold text-emerald-800">Đã kích hoạt Chế độ Premium</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Tự động mở khóa toàn bộ lịch sử giao dịch và kết quả kiểm nghiệm chất lượng của đối tác vựa.</p>
                            </div>
                        </div>
                    )}

                    {/* Cards Grid */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                            <p className="text-slate-500 font-medium">Đang tải dữ liệu chợ nguyên liệu...</p>
                        </div>
                    ) : filteredBatches.length === 0 ? (
                        <div className="text-center bg-white rounded-2xl p-16 border border-slate-100 shadow-sm">
                            <p className="text-5xl mb-4">📦</p>
                            <p className="font-extrabold text-slate-700 text-lg">Không tìm thấy lô hàng nào</p>
                            <p className="text-sm text-slate-400 mt-1">Chưa có vựa nào đăng tin xuất hàng thuộc bộ lọc này.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBatches.map((b) => {
                                const isPremium = premiumInfo.isPremium;
                                const formattedWeight = (b.estimatedWeightKg / 1000).toFixed(1);
                                
                                // Material badges HSL
                                let badgeClass = "bg-orange-50 text-orange-700";
                                let badgeIcon = "description";
                                let label = "Giấy";

                                const mType = b.materialType.toUpperCase();
                                if (mType.includes('PET') || mType.includes('HDPE') || mType.includes('PVC') || mType.includes('PLASTIC')) {
                                    badgeClass = "bg-blue-50 text-blue-700";
                                    badgeIcon = "water_drop";
                                    label = `Nhựa ${b.materialType}`;
                                } else if (mType.includes('ALUMINUM') || mType.includes('IRON') || mType.includes('STEEL') || mType.includes('COPPER') || mType.includes('METAL')) {
                                    badgeClass = "bg-purple-50 text-purple-700";
                                    badgeIcon = "build";
                                    label = `Kim loại ${b.materialType}`;
                                } else {
                                    label = `Giấy ${b.materialType}`;
                                }

                                return (
                                    <div
                                        key={b.id}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                                        <div className="p-6 pb-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div
                                                    className={`${badgeClass} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1`}>
                                                    <span className="material-symbols-outlined text-sm">{badgeIcon}</span> {label}
                                                </div>
                                                <div className="text-slate-400 text-sm flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">schedule</span> #{b.batchCode}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{b.depot.companyName}</h3>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-slate-500 text-sm">{b.depot.city || 'Việt Nam'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-slate-50 p-3 rounded-xl">
                                                    <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                                    <p className="text-2xl font-extrabold text-slate-800">{formattedWeight} <span
                                                        className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-xl border border-green-100 relative group">
                                                    <p className="text-xs text-green-700 font-medium uppercase mb-1">Đơn giá đề xuất</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-lg font-extrabold text-green-700">{b.unitPrice?.toLocaleString('vi-VN')}</span>
                                                        <span className="text-xs font-bold text-green-600"> ₫/kg</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Premium History Check */}
                                        <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                            <div className={`p-4 transition-all duration-300 ${!isPremium ? 'opacity-40 filter blur-[2px] select-none pointer-events-none' : ''}`}>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 3 chuyến gần nhất</p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>20/05/2026</span> 
                                                        <span className="text-green-600 font-bold">Thành công (Tạp chất 2.1%)</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>18/05/2026</span> 
                                                        <span className="text-green-600 font-bold">Thành công (Tạp chất 1.8%)</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>15/05/2026</span> 
                                                        <span className="text-green-600 font-bold">Thành công (Tạp chất 3.0%)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {!isPremium && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch & KCS chi tiết</p>
                                                    <Link
                                                        to="/nha-may/premium"
                                                        className="bg-primary hover:bg-secondary text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-sm">verified</span> Nâng cấp Premium
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 border-t border-slate-100 bg-white z-20">
                                            <Link
                                                to={`/recycle/order-confirm?batchId=${b.id}`}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                                Chốt đơn / Đặt mua
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MaterialsMarket;

