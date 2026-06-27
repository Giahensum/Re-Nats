import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';

const PremiumMarket = () => {
    const navigate = useNavigate();
    return (
        <div className="font-sans text-slate-900 overflow-x-hidden bg-slate-50 min-h-screen flex flex-col">
            {/* Header dùng chung */}
            <HeaderDoanhNghiep activeTab="market" />

            {/* ── MAIN CONTENT ── */}
            <section className="py-10 flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Marketplace Controls */}
                    <div
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <h1 className="text-2xl font-extrabold text-slate-800 whitespace-nowrap mr-4">Sàn Nguyên Liệu</h1>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 flex items-center gap-2 whitespace-nowrap">
                                    <span className="material-symbols-outlined text-lg">filter_list</span> Bộ lọc
                                </button>
                                <div className="h-9 w-px bg-slate-200 mx-1"></div>
                                <button
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2 whitespace-nowrap">
                                    <span className="material-symbols-outlined text-lg">recycling</span> Tất cả
                                </button>
                                <button
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary flex items-center gap-2 whitespace-nowrap transition-colors">
                                    <span className="material-symbols-outlined text-lg">description</span> Giấy
                                </button>
                                <button
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary flex items-center gap-2 whitespace-nowrap transition-colors">
                                    <span className="material-symbols-outlined text-lg">water_drop</span> Nhựa
                                </button>
                                <button
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:border-primary hover:text-primary flex items-center gap-2 whitespace-nowrap transition-colors">
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
                                className="px-4 py-2 text-slate-500 hover:text-slate-800 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                                <span className="material-symbols-outlined text-lg">map</span> Bản đồ
                            </Link>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">description</span> Giấy Carton
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 5.2 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Vựa Phế Liệu Minh Khôi</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Quận 9, TP.HCM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">12.5 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-700 font-medium uppercase mb-1">Độ tinh khiết</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-green-700">98</span>
                                            <span className="text-xs font-bold text-green-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>10/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>08/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">water_drop</span> Nhựa HDPE
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 12.8 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Đại Lý Thu Gom Thành Đạt</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Thủ Đức, TP.HCM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">8.4 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-700 font-medium uppercase mb-1">Độ tinh khiết</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-yellow-600">75</span>
                                            <span className="text-xs font-bold text-yellow-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>...</span> <span>...</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">build</span> Sắt Vụn
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 2.1 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Công Ty Môi Trường Xanh</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Bình Thạnh, TP.HCM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">45.0 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-700 font-medium uppercase mb-1">Độ tinh khiết</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-green-700">92</span>
                                            <span className="text-xs font-bold text-green-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>...</span> <span>...</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">description</span> Giấy Tạp
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 8.5 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Vựa Thu Gom Bình An</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Quận 7, TP.HCM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">5.0 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-700 font-medium uppercase mb-1">Độ tinh khiết</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-red-600">45</span>
                                            <span className="text-xs font-bold text-red-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>...</span> <span>...</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>

                        {/* Card 5 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">build</span> Nhôm Cán
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 15 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Cơ Sở Phế Liệu Phương Nam</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Bình Dương</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">18.2 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-700 font-medium uppercase mb-1">Độ tinh khiết</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-green-700">95</span>
                                            <span className="text-xs font-bold text-green-600">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>...</span> <span>...</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>

                        {/* Card 6 */}
                        <div
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">water_drop</span> Nhựa PET
                                    </div>
                                    <div className="text-slate-400 text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">near_me</span> 3.4 km
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Vựa Ve Chai Cô Tư</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-slate-500 text-sm">Gò Vấp, TP.HCM</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium uppercase mb-1">Khối lượng</p>
                                        <p className="text-2xl font-extrabold text-slate-800">2.5 <span
                                            className="text-sm font-semibold text-slate-500">Tấn</span></p>
                                    </div>
                                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-700 font-medium uppercase mb-1">Điểm uy tín</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-extrabold text-yellow-600">68</span>
                                            <span className="text-xs font-bold text-yellow-600">/100</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative bg-slate-50 border-t border-slate-100 flex-grow">
                                <div className="p-4 opacity-40 filter blur-[2px] select-none pointer-events-none">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Lịch sử 10 chuyến gần nhất</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm"><span>12/05/2024</span> <span
                                            className="text-green-600 font-bold">Thành công</span></div>
                                        <div className="flex justify-between text-sm"><span>...</span> <span>...</span></div>
                                    </div>
                                </div>
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10 p-4 text-center">
                                    <div className="bg-white p-3 rounded-full shadow-md mb-2">
                                        <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Xem lịch sử giao dịch chi tiết</p>
                                    <button
                                        onClick={() => navigate('/nha-may/premium')}
                                        className="bg-primary hover:bg-secondary text-white text-sm font-bold py-2 px-6 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">verified</span> Nâng cấp Premium
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white z-20">
                                <Link
                                    to="/recycle/order-confirm"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                    Chốt đơn / Đặt mua
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PremiumMarket;
