import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TransportationWaitingConfirm = () => {
    const [timeLeft, setTimeLeft] = useState(898); // 14:58 in seconds

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen hero-mesh-gradient flex items-center justify-center py-8">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100 flex flex-col h-[85vh] relative text-left">
                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/transport/trip-booking" className="mr-3 p-1 rounded-full hover:bg-slate-50 text-slate-500">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                        <h1 className="text-lg font-bold text-slate-800">Chờ xác nhận</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="material-symbols-outlined text-slate-400">help</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 relative">
                    <div className="min-h-full flex flex-col items-center justify-center py-4">
                        {/* Animated Loading Indicator */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-8 shrink-0">
                            <div className="absolute inset-0 bg-green-50 rounded-full animate-ping-slow opacity-75"></div>
                            <div className="absolute inset-4 bg-green-100 rounded-full animate-pulse-slow opacity-50"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                            <div className="absolute inset-0 rounded-full loading-circle opacity-50"></div>
                            <div className="absolute inset-1 bg-white rounded-full"></div>
                            <div className="relative z-10 text-center flex flex-col items-center">
                                <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-bounce">hourglass_top</span>
                                <div className="text-4xl font-black text-slate-800 tracking-tight font-mono">{formatTime(timeLeft)}</div>
                                <p className="text-xs text-slate-400 font-medium mt-1">Thời gian còn lại</p>
                            </div>
                        </div>

                        <div className="text-center mb-10 max-w-[280px]">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Đang gửi yêu cầu...</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Hệ thống đang gửi mức giá đấu thầu của bạn đến <span className="font-semibold text-primary">Kho Đại Lý</span>.
                            </p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="w-full bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Kho Đại Lý</p>
                                    <h3 className="font-bold text-slate-800 text-lg">Kho Phế Liệu An Khang</h3>
                                </div>
                                <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="material-symbols-outlined text-primary">storefront</span>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Giá đấu thầu của bạn</p>
                                    <p className="text-xl font-bold text-primary">850.000 <span className="text-sm font-semibold text-slate-500">VNĐ</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 mb-1">Khối lượng</p>
                                    <p className="text-sm font-bold text-slate-700">3.5 Tấn</p>
                                </div>
                            </div>
                        </div>

                        <button className="text-slate-400 hover:text-red-500 text-sm font-medium py-2 px-4 rounded-full hover:bg-red-50 transition-colors flex items-center mb-4">
                            <span className="material-symbols-outlined text-lg mr-1.5">close</span>
                            Hủy yêu cầu
                        </button>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <div className="bg-white border-t border-slate-200 px-2 pb-2 pt-2">
                    <div className="flex justify-between items-end relative">
                        <Link to="/transport/market" className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl mb-1">home</span>
                            <span className="text-[10px] font-medium">Trang chủ</span>
                        </Link>
                        <Link to="/transport/market" className="flex-1 flex flex-col items-center justify-center py-2 text-primary">
                            <span className="material-symbols-outlined text-2xl mb-1 font-bold fill-1">local_shipping</span>
                            <span className="text-[10px] font-medium font-bold">Chuyến xe</span>
                        </Link>
                        <div className="relative -top-6 px-2">
                            <button className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-green-900/30 border-4 border-slate-50 qr-shadow transform hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                            </button>
                        </div>
                        <button className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl mb-1">notifications</span>
                            <span className="text-[10px] font-medium">Thông báo</span>
                        </button>
                        <button className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl mb-1">person</span>
                            <span className="text-[10px] font-medium">Tài khoản</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportationWaitingConfirm;
