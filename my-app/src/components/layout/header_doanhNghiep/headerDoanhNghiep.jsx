import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/AuthContext';
import { getFactoryProfile } from '../../../services/factoryService';
import { notificationService } from '../../../services/notificationService';

// Icons matching SellerDashboard style
const IconBell = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const IconChevron = ({ open }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const IconLogout = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

const IconHome = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const IconPremium = () => (
    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

/**
 * HeaderDoanhNghiep - Header dùng chung cho các trang của Nhà máy / Doanh nghiệp tái chế.
 * Matches the high-premium seller design language.
 */
const HeaderDoanhNghiep = ({ activeTab = '' }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const displayName = user?.fullName || 'Nhà máy Tái Chế A';
    const displayRole = 'Nhà máy';

    // Lấy thông tin vật liệu chính từ profile đã lưu
    const profile = getFactoryProfile();
    const MATERIAL_ICONS = {
        STEEL: { label: 'Sắt thép',  icon: '⚙️' }, ALUMINUM: { label: 'Nhôm',      icon: '🔩' },
        COPPER: { label: 'Đồng',     icon: '🔶' }, LEAD:     { label: 'Chì/Ắc quy',icon: '🔋' },
        PET:    { label: 'Nhựa PET', icon: '♻️' }, HDPE:     { label: 'Nhựa HDPE', icon: '🪣' },
        PP:     { label: 'Nhựa PP',  icon: '🛒' }, PVC:      { label: 'Nhựa PVC',  icon: '🧱' },
        CARDBOARD: { label: 'Giấy carton', icon: '📦' }, PAPER: { label: 'Giấy thải', icon: '📄' },
        BATTERY: { label: 'Pin Lithium', icon: '⚡' }, ELECTRONIC_WASTE: { label: 'Điện tử', icon: '💻' },
        RUBBER: { label: 'Cao su', icon: '🛞' }, OIL: { label: 'Dầu nhớt', icon: '🛢️' },
    };
    const matInfo = profile?.primaryMaterialType ? MATERIAL_ICONS[profile.primaryMaterialType] : null;

    const fetchNotifications = () => {
        notificationService.getNotifications()
            .then(data => setNotifications(data || []))
            .catch(err => console.error('Lỗi tải thông báo:', err));
    };

    useEffect(() => {
        fetchNotifications();
        // Tự động reload thông báo sau mỗi 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        setDropdownOpen(false);
        if (logout) {
            logout();
        }
        navigate('/dang-nhap', { replace: true });
    };

    const navItems = [
        { key: 'dashboard', label: 'Tổng Quan', to: '/recycle/dashboard' },
        { key: 'market', label: 'Chợ Nguyên Liệu', to: '/recycle/market' },
        { key: 'orders', label: 'Theo dõi đơn hàng', to: '/recycle/order-tracking' },
        { key: 'partners', label: 'Danh Sách Vựa', to: '/nha-may/doi-tac' },
        { key: 'map', label: 'Bản đồ', to: '/nha-may/map' },
        { key: 'report', label: 'Báo cáo & Dữ liệu', to: '/nha-may/bao-cao-epr' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                
                {/* Brand Logo & Name */}
                <div className="flex items-center gap-6">
                    <Link to="/recycle/dashboard" className="flex items-center gap-2.5">
                        <img src="/logo.jpg" alt="Re-Nats" className="h-8 w-auto rounded-lg" />
                        <div>
                            <p className="text-sm font-extrabold text-slate-800 leading-none">Re-Nats</p>
                            <p className="text-xs text-slate-400 mt-0.5">Cổng nhà máy</p>
                        </div>
                    </Link>

                    {/* Navigation tabs inside the header */}
                    <nav className="hidden md:flex items-center gap-1.5 ml-6 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {navItems.map((item) => (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                                    ${activeTab === item.key
                                        ? 'bg-white text-green-700 shadow-sm border border-slate-100/50'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right: notification + user */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button 
                            onClick={() => setNotifOpen(o => !o)}
                            className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none cursor-pointer"
                        >
                            <IconBell />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {notifOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in max-h-96 flex flex-col">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Thông báo ({unreadCount})</p>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={handleMarkAllAsRead} 
                                                className="text-[11px] text-green-700 font-bold hover:underline"
                                            >
                                                Đọc tất cả
                                            </button>
                                        )}
                                    </div>
                                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-xs">
                                                Không có thông báo mới
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => handleMarkAsRead(n.id)}
                                                    className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-slate-50 ${!n.isRead ? 'bg-green-50/50' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-1.5">
                                                        <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                                                        {!n.isRead && <span className="w-2 h-2 bg-green-600 rounded-full shrink-0 mt-1" />}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                                    <p className="text-[9px] text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-8 w-px bg-slate-200"></div>


                    {/* Account Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(o => !o)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                        >
                            {/* Initials Avatar */}
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center text-white font-bold text-sm select-none">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-bold text-slate-800 leading-none">{displayName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-xs text-slate-400">{displayRole}</p>
                                    {matInfo && (
                                        <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-green-200">
                                            {matInfo.icon} {matInfo.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-slate-400 hidden sm:block">
                                <IconChevron open={dropdownOpen} />
                            </span>
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                                {/* Dropdown List */}
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">Tài khoản</p>
                                        <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">{displayName}</p>
                                        {matInfo && (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                                                {matInfo.icon} {matInfo.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="py-1">
                                        <Link
                                            to="/recycle/dashboard"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <IconHome />
                                            <span>Trang chủ nhà máy</span>
                                        </Link>
                                        <Link
                                            to="/nha-may/setup-profile"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                            <span>Hồ sơ nhà máy</span>
                                        </Link>
                                        <Link
                                            to="/nha-may/premium"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <IconPremium />
                                            <span>Đăng ký Premium</span>
                                        </Link>
                                        <div className="border-t border-slate-100 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-semibold"
                                        >
                                            <IconLogout />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </header>
    );
};

export default HeaderDoanhNghiep;
