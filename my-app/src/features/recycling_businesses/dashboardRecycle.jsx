import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService, getFactoryProfile } from '../../services/factoryService';

const inlineStyle = `
  .sidebar-active {
    background-color: rgba(47, 127, 52, 0.1);
    color: #2f7f34;
    border-right: 3px solid #2f7f34;
  }
`;

const DashboardRecycle = () => {
    const [kpis, setKpis] = useState({
        totalInboundKg: 0,
        avgImpurityRate: 0,
        inTransitCount: 0
    });
    const [transactions, setTransactions] = useState([]);
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch premium status
            try {
                const premiumStatus = await factoryService.getPremiumStatus();
                setIsPremium(premiumStatus?.isPremium || false);
            } catch { setIsPremium(false); }

            // Fetch KPIs
            const kpiData = await factoryService.getKpis();
            if (kpiData) {
                setKpis({
                    totalInboundKg: kpiData.totalInboundKg || 0,
                    avgImpurityRate: kpiData.avgImpurityRate || 0,
                    inTransitCount: kpiData.inTransitCount || 0
                });
            }

            // Fetch Recent Transactions
            const txData = await factoryService.getRecentTransactions();
            if (txData && txData.length > 0) {
                setTransactions(txData);
            } else {
                setTransactions([]);
            }

            // Fetch Material Breakdown
            const breakdownData = await factoryService.getMaterialBreakdown();
            if (breakdownData && breakdownData.length > 0) {
                setBreakdown(breakdownData);
            } else {
                setBreakdown([]);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setTransactions([]);
            setBreakdown([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Format helpers
    const formatMaterial = (type) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('cardboard') || lower.includes('paper')) return 'Giấy Carton';
        if (lower.includes('hdpe') || lower.includes('plastic')) return 'Nhựa các loại';
        if (lower.includes('iron') || lower.includes('metal') || lower.includes('steel')) return 'Kim loại phế liệu';
        if (lower.includes('copper')) return 'Đồng đỏ phế liệu';
        return 'Nguyên liệu thô';
    };

    const getMaterialColor = (type) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('cardboard') || lower.includes('paper')) return '#7dd3fc';
        if (lower.includes('hdpe') || lower.includes('plastic')) return '#2f7f34';
        if (lower.includes('iron') || lower.includes('metal') || lower.includes('steel')) return '#0ea5e9';
        return '#86efac';
    };

    const renderStatusBadge = (status, orderId) => {
        switch (status) {
            case 'VERIFIED':
            case 'COMPLETED':
                return (
                    <Link to={`/recycle/order-settlement?orderId=${orderId}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all shadow-sm">
                        Đã cân &amp; Chốt (Xem HĐ)
                    </Link>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        Từ chối nhận xe
                    </span>
                );
            case 'ON_THE_WAY':
            case 'PICKED_UP':
                return (
                    <Link to="/recycle/order-tracking" className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all shadow-sm animate-pulse">
                        Đang đến (Theo dõi xe)
                    </Link>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Chờ duyệt thầu
                    </span>
                );
        }
    };

    const totalKg = breakdown.reduce((sum, item) => sum + item.totalKg, 0);
    const profile = getFactoryProfile();
    const isProfileIncomplete = !profile || !profile.isProfileComplete;

    return (
        <div className="font-sans text-slate-900 bg-slate-50 overflow-x-hidden min-h-screen flex flex-col">
            <style>{inlineStyle}</style>

            {/* Premium Unified Header */}
            <HeaderDoanhNghiep activeTab="dashboard" />

            {/* MAIN */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

                {/* Page title + controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Tổng Quan Báo Cáo</h1>
                        <p className="text-slate-500 text-sm mt-1">Số liệu trực quan thời gian thực từ trạm cân</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm flex items-center gap-2 h-10 select-none">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
                        </span>
                        <Link to="/recycle/order-process" className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors h-10">
                            <span className="material-symbols-outlined text-xl">scale</span>
                            Trạm Cân
                        </Link>
                    </div>
                </div>

                {/* ── Factory Profile Warning Banner (chỉ hiện khi chưa hoàn thành hồ sơ) ── */}
                {isProfileIncomplete && (
                    <div className="mb-8 bg-gradient-to-r from-red-600 to-amber-700 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5">
                            <span className="material-symbols-outlined text-[300px] text-white absolute -right-10 -top-10" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md shrink-0">
                                <span className="material-symbols-outlined text-2xl text-red-700" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-base">Hồ sơ nhà máy chưa hoàn thiện!</p>
                                <p className="text-red-100 text-sm mt-0.5">
                                    Vui lòng <strong className="text-white">chọn loại vật liệu tái chế chính</strong> và <strong className="text-white">tải lên giấy phép kinh doanh</strong> để bắt đầu giao dịch trên sàn, xem bản đồ VIP, và sử dụng đầy đủ tính năng.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/nha-may/setup-profile"
                            className="shrink-0 bg-white hover:bg-slate-100 text-red-700 font-extrabold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 relative z-10 text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">edit_document</span>
                            Hoàn thiện hồ sơ ngay
                        </Link>
                    </div>
                )}

                {/* ── Premium Upsell Banner (chỉ hiện khi chưa Premium) ── */}
                {!isPremium && (
                    <div className="mb-8 bg-gradient-to-r from-green-700 to-green-900 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5">
                            <span className="material-symbols-outlined text-[300px] text-white absolute -right-10 -top-10" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-md shrink-0">
                                <span className="material-symbols-outlined text-2xl text-yellow-900" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                            </div>
                            <div>
                                <p className="text-white font-bold text-base">Nâng cấp lên Re-Nats Premium</p>
                                <p className="text-green-200 text-sm mt-0.5">
                                    Mở khóa: <strong className="text-white">Bản đồ VIP</strong>, <strong className="text-white">Danh bạ đại lý</strong>, <strong className="text-white">Phân tích chất lượng nâng cao</strong> và nhiều hơn nữa.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/nha-may/premium"
                            className="shrink-0 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-extrabold px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 relative z-10 text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">star</span>
                            Mua gói Premium
                        </Link>
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Card 1 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-0 top-0 h-full w-1 bg-green-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Tổng sản lượng thực tế nhập kho</p>
                                <h3 className="text-3xl font-bold text-slate-800">
                                    {kpis.totalInboundKg.toLocaleString('vi-VN')} <span className="text-lg text-slate-400 font-normal">tấn</span>
                                </h3>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">scale</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">trending_up</span>
                                +12.5%
                            </span>
                            <span className="text-slate-400 ml-2">so với tuần trước</span>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Tỷ lệ Tạp Chất TB</p>
                                <h3 className="text-3xl font-bold text-slate-800">
                                    {kpis.avgImpurityRate.toFixed(1)} <span className="text-lg text-slate-400 font-normal">%</span>
                                </h3>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">speed</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">remove</span>
                                -0.8%
                            </span>
                            <span className="text-slate-400 ml-2">cải thiện tạp chất sạch</span>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute right-0 top-0 h-full w-1 bg-orange-400"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Xe đang di chuyển đến</p>
                                <h3 className="text-3xl font-bold text-slate-800">
                                    {kpis.inTransitCount} <span className="text-lg text-slate-400 font-normal">xe tải</span>
                                </h3>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                            </div>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="text-slate-500">Đang xếp nốt hàng chờ: <span className="font-bold text-slate-700">{kpis.inTransitCount} xe</span></span>
                            <Link to="/recycle/order-tracking" className="ml-auto text-primary text-xs font-bold hover:underline">Theo dõi lộ trình</Link>
                        </div>
                    </div>
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Xu Hướng Nhập Hàng</h3>
                                <p className="text-sm text-slate-500">Khối lượng hàng ngày vs. Chỉ số chất lượng</p>
                            </div>
                            <select className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-primary focus:border-primary">
                                <option>7 Ngày Qua</option>
                                <option>30 Ngày Qua</option>
                            </select>
                        </div>
                        <div className="relative h-64 w-full flex items-end justify-between px-4 pb-8 border-b border-l border-slate-200 gap-2">
                            <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-xs text-slate-400">
                                <span>100 tấn</span>
                                <span>75 tấn</span>
                                <span>50 tấn</span>
                                <span>25 tấn</span>
                                <span>0 tấn</span>
                            </div>
                            {/* Mon */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[40%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[40%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green/20 h-full rounded-t-sm"></div>
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[85%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">T2</span>
                            </div>
                            {/* Tue */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[55%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[60%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[90%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">T3</span>
                            </div>
                            {/* Wed */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[35%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[45%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[70%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">T4</span>
                            </div>
                            {/* Thu */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[65%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[75%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[95%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">T5</span>
                            </div>
                            {/* Fri */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[45%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[50%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[80%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">T6</span>
                            </div>
                            {/* Sat */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[80%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20 shadow-sm"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[85%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[100%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-bold text-primary">T7</span>
                            </div>
                            {/* Sun */}
                            <div className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="relative w-full flex justify-center items-end h-64">
                                    <div className="absolute bottom-[30%] w-3 h-3 bg-white border-2 border-renats-blue rounded-full z-20"></div>
                                    <div className="w-full max-w-[40px] bg-green-50 rounded-t-sm h-[30%] group-hover:bg-green-100 transition-colors relative">
                                        <div className="absolute bottom-0 w-full bg-renats-green h-[60%] rounded-t-sm"></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">CN</span>
                            </div>
                            {/* SVG trend line */}
                            <svg
                                className="absolute bottom-0 left-0 w-full h-64 pointer-events-none z-10"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M 30 160 L 100 110 L 170 170 L 240 80 L 310 140 L 380 40 L 450 180"
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-renats-green rounded-sm"></span>
                                <span className="text-xs text-slate-500">Sản Lượng Nhập</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-renats-blue rounded-full border border-white shadow-sm"></span>
                                <span className="text-xs text-slate-500">Chỉ Số Chất Lượng</span>
                            </div>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Phân Tích Nguyên Liệu</h3>
                                <p className="text-sm text-slate-500">Phân bổ theo phân loại thực tế</p>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f1f5f9" strokeWidth="12"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#0ea5e9" strokeDasharray="113.1 251.2" strokeDashoffset="0" strokeWidth="12"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2f7f34" strokeDasharray="62.8 251.2" strokeDashoffset="-113.1" strokeWidth="12"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#7dd3fc" strokeDasharray="50.2 251.2" strokeDashoffset="-175.9" strokeWidth="12"></circle>
                                    <circle cx="50" cy="50" fill="transparent" r="40" stroke="#86efac" strokeDasharray="25.1 251.2" strokeDashoffset="-226.1" strokeWidth="12"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-slate-800">100%</span>
                                    <span className="text-xs text-slate-400">Tổng Nguyên Liệu</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 mt-2">
                            {breakdown.map((item, idx) => {
                                const rate = totalKg > 0 ? Math.round((item.totalKg / totalKg) * 100) : 25;
                                return (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getMaterialColor(item.materialType) }}></span>
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{formatMaterial(item.materialType)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{rate}%</span>
                                            <span className="text-xs text-slate-400">{item.totalKg.toLocaleString('vi-VN')} kg</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Giao Dịch Gần Đây</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-medium rounded-tl-lg">Mã Lô Hàng</th>
                                        <th className="px-4 py-3 font-medium">Đại Lý Vựa</th>
                                        <th className="px-4 py-3 font-medium">Loại Nguyên Liệu</th>
                                        <th className="px-4 py-3 font-medium">Khối Lượng</th>
                                        <th className="px-4 py-3 font-medium">Thời Gian Nhận</th>
                                        <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Trạng Thế Nghiệm Thu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-4 font-semibold text-slate-800">#{tx.batchCode || (tx.id || '').substring(0, 8)}</td>
                                            <td className="px-4 py-4 text-slate-600 font-medium">{tx.supplierName}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getMaterialColor(tx.materialType) }}></span>
                                                    <span className="text-slate-600">{formatMaterial(tx.materialType)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-medium text-slate-700">{tx.weightKg.toLocaleString('vi-VN')} kg</td>
                                            <td className="px-4 py-4 text-slate-500">{new Date(tx.date).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-4 py-4 text-right">
                                                {renderStatusBadge(tx.status, tx.id)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Mini Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3 select-none">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Chi Trả Trong Ngày</p>
                            <p className="font-bold text-slate-800">45.2 Tr VND</p>
                        </div>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex items-center gap-3 select-none">
                        <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Cảnh Báo Chất Lượng</p>
                            <p className="font-bold text-slate-800">0 Cảnh Báo</p>
                        </div>
                    </div>
                    <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-4 flex items-center gap-3 select-none">
                        <div className="bg-cyan-100 p-2 rounded-lg text-cyan-600">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Nhân Viên Trực Ca</p>
                            <p className="font-bold text-slate-800">14 Nhân Sự</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center gap-3 select-none">
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Sức Chứa Kho</p>
                            <p className="font-bold text-slate-800">82% Đã Đầy</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Redesigned Premium Footer */}
            <footer className="bg-white border-t border-slate-100 mt-auto py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Re-Nats Logo" className="h-6 w-auto rounded" />
                        <span className="text-slate-400 text-xs font-bold">© 2026 Re-Nats Platform. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DashboardRecycle;
