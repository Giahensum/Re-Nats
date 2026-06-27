import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { transportService } from '../../services/transportService';
import { useToast } from '../../context/ToastContext';

const MATERIAL_LABEL = {
    STEEL: 'Sắt thép', ALUMINUM: 'Nhôm', COPPER: 'Đồng', LEAD: 'Chì/Ắc quy',
    PET: 'Nhựa PET', HDPE: 'Nhựa HDPE', PP: 'Nhựa PP', PVC: 'Nhựa PVC',
    CARDBOARD: 'Giấy carton', PAPER: 'Giấy thải', BATTERY: 'Pin Lithium',
    ELECTRONIC_WASTE: 'Điện tử', RUBBER: 'Cao su', OIL: 'Dầu nhớt',
    IRON: 'Sắt vụn', OTHER: 'Khác',
};
const MATERIAL_ICON = {
    STEEL: '⚙️', ALUMINUM: '🔩', COPPER: '🔶', LEAD: '🔋',
    PET: '♻️', HDPE: '🪣', PP: '🛒', PVC: '🧱',
    CARDBOARD: '📦', PAPER: '📄', BATTERY: '⚡', ELECTRONIC_WASTE: '💻',
    RUBBER: '🛞', OIL: '🛢️', IRON: '⚙️', OTHER: '🏭',
};

const STATUS_CONFIG = {
    PENDING:    { label: 'Mới đăng', color: 'bg-blue-100 text-blue-700' },
    OPEN:       { label: 'Chờ nhận',  color: 'bg-green-100 text-green-700' },
    ASSIGNED:   { label: 'Đã nhận',  color: 'bg-slate-100 text-slate-500' },
};

// ── Bottom Navigation ──────────────────────────────────────────────────────────
function BottomNav({ active }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const tabs = [
        { id: 'market',   icon: 'storefront',      label: 'Chợ đơn',  path: '/transport/market'      },
        { id: 'trips',    icon: 'local_shipping',  label: 'Chuyến xe', path: '/van-chuyen/chuyen-xe?tab=active' },
        { id: 'checkin',  icon: 'qr_code_scanner', label: 'QR Check', path: '/van-chuyen/checkin', center: true },
        { id: 'history',  icon: 'history',         label: 'Lịch sử',  path: '/van-chuyen/chuyen-xe?tab=history' },
        { id: 'account',  icon: 'logout',          label: 'Đăng xuất', path: 'logout'                 },
    ];
    return (
        <nav className="bg-white border-t border-slate-100 px-2 pb-safe pt-2 sticky bottom-0 z-20">
            <div className="flex justify-between items-end relative h-14">
                {tabs.map(tab => tab.center ? (
                    <div key={tab.id} className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
                        <button
                            onClick={() => navigate(tab.path)}
                            className="w-14 h-14 rounded-full bg-green-600 text-white shadow-lg shadow-green-900/30 flex items-center justify-center border-4 border-slate-50 hover:scale-105 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.path === 'logout') {
                                if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                                    logout();
                                    navigate('/dang-nhap');
                                }
                            } else if (tab.path !== '#') {
                                navigate(tab.path);
                            }
                        }}
                        className={`flex flex-col items-center justify-end w-full pb-1 gap-0.5 transition-colors ${active === tab.id ? 'text-green-600' : 'text-slate-400 hover:text-green-500'}`}
                    >
                        <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                        <span className="text-[10px] font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}

// ── Depot Selector Screen ──────────────────────────────────────────────────────
function DepotSelectorScreen({ onSelect }) {
    const [depots, setDepots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const toast = useToast();

    useEffect(() => {
        const fetchDepots = (lat = null, lng = null) => {
            transportService.getDepotsWithJobs(lat, lng)
                .then(data => setDepots(data || []))
                .catch(() => {
                    toast.error('Không thể tải danh sách kho. Vui lòng thử lại!');
                    setDepots([]);
                })
                .finally(() => setLoading(false));
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    fetchDepots(lat, lng);
                },
                () => {
                    fetchDepots();
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            fetchDepots();
        }
    }, []);

    const filtered = depots.filter(d =>
        d.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        d.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="px-4 pt-4 pb-3">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-green-500 transition"
                        placeholder="Tìm kho theo tên hoặc địa chỉ..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">warehouse</span>
                        <p className="font-semibold text-slate-500">Không tìm thấy kho nào</p>
                        <p className="text-xs mt-1">Hiện chưa có kho nào có đơn cần vận chuyển</p>
                    </div>
                ) : filtered.map(depot => (
                    <button
                        key={depot.id}
                        type="button"
                        onClick={() => onSelect(depot)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left hover:border-green-400 hover:shadow-md active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-xl shrink-0">🏪</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate">{depot.companyName}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                    <span className="material-symbols-outlined text-xs align-middle mr-0.5">location_on</span>
                                    {depot.address || depot.city}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {depot.pendingJobCount > 0 && (
                                        <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            {depot.pendingJobCount} đơn chờ
                                        </span>
                                    )}
                                    {depot.distanceKm != null && (
                                        <span className="text-[10px] text-slate-500">📍 {depot.distanceKm} km</span>
                                    )}
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 text-2xl">chevron_right</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Job Card ───────────────────────────────────────────────────────────────────
function JobCard({ job, onAccept, accepting }) {
    const statusCfg = STATUS_CONFIG[job.status] || { label: job.status, color: 'bg-slate-100 text-slate-600' };
    const isAvailable = job.status === 'PENDING' || job.status === 'OPEN';
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.99] transition-transform">
            {/* Card top */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                    <span className="text-xs text-slate-400">{job.createdAtFormatted || 'Vừa đăng'}</span>
                </div>
                {/* Route */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                        <p className="font-bold text-slate-800 text-base leading-tight">{job.depotName}</p>
                        <p className="text-xs text-slate-400">Điểm lấy hàng</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-xl shrink-0">arrow_forward</span>
                    <div className="flex-1 text-right">
                        <p className="font-bold text-slate-800 text-base leading-tight">{job.factoryName}</p>
                        <p className="text-xs text-slate-400">Điểm giao</p>
                    </div>
                </div>
                {/* Distance */}
                {job.distanceKm != null && (
                    <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                        <span className="material-symbols-outlined text-base text-slate-400">near_me</span>
                        <span>Khoảng cách: <strong>{job.distanceKm} km</strong></span>
                    </div>
                )}
                {/* Cargo info */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">Hàng hóa</p>
                        <p className="font-semibold text-slate-800 text-sm">
                            {MATERIAL_ICON[job.materialType] || '📦'} {(job.totalKg / 1000).toFixed(1)} tấn {MATERIAL_LABEL[job.materialType] || job.materialType}
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">Phương tiện</p>
                        <p className="font-semibold text-slate-800 text-sm">{job.vehicleType || 'Xe tải'}</p>
                    </div>
                </div>
            </div>
            {/* Card bottom */}
            <div className="px-4 pb-4 flex items-center justify-between border-t border-slate-50 pt-3">
                {job.transportFee ? (
                    <div>
                        <p className="text-xs text-slate-400">Thu nhập ước tính</p>
                        <p className="text-xl font-extrabold text-green-600">
                            {job.transportFee.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-400">đ</span>
                        </p>
                    </div>
                ) : <div />}
                {isAvailable && (
                    <button
                        onClick={() => onAccept(job.id)}
                        disabled={accepting === job.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-green-200 active:scale-95"
                    >
                        {accepting === job.id ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                Đang nhận...
                            </span>
                        ) : 'Nhận đơn'}
                    </button>
                )}
                {!isAvailable && (
                    <span className="text-sm text-slate-400 font-medium">Đã có người nhận</span>
                )}
            </div>
        </div>
    );
}

// ── Main Marketplace ────────────────────────────────────────────────────────────
const TransportationMarketplace = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [selectedDepot, setSelectedDepot] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [accepting, setAccepting] = useState(null); // jobId being accepted
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'nearby'

    const loadJobs = useCallback(async (depotId) => {
        setLoadingJobs(true);
        try {
            const data = await transportService.getAvailableJobs(depotId);
            setJobs(data || []);
        } catch {
            toast.error('Không thể tải danh sách đơn. Vui lòng thử lại!');
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDepot) loadJobs(selectedDepot.id);
    }, [selectedDepot, loadJobs]);

    const handleAcceptJob = async (jobId) => {
        setAccepting(jobId);
        try {
            await transportService.acceptJob(jobId);
            toast.success('Bạn đã nhận đơn thành công! Hãy đến kho lấy hàng.');
            // Reload jobs
            await loadJobs(selectedDepot.id);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể nhận đơn. Vui lòng thử lại!');
        } finally {
            setAccepting(null);
        }
    };

    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex items-center justify-center py-4 sm:py-8">
            <div className="w-full max-w-md bg-slate-50 shadow-xl rounded-2xl overflow-hidden border border-slate-100 flex flex-col h-[90vh]">

                {/* ── Header ── */}
                <div className="bg-white px-4 py-3 border-b border-slate-100 sticky top-0 z-20">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || '🚛'}
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 leading-none">Xin chào,</p>
                                <h2 className="font-bold text-slate-800 text-sm leading-snug">{user?.name || 'Tài xế'}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-xl">notifications</span>
                                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                            </button>
                        </div>
                    </div>

                    {/* Depot info / selector */}
                    {selectedDepot ? (
                        <button
                            onClick={() => { setSelectedDepot(null); setJobs([]); }}
                            className="w-full mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 hover:bg-green-100 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-left">
                                <span className="text-base">🏪</span>
                                <div>
                                    <p className="text-xs font-bold text-green-800">{selectedDepot.companyName}</p>
                                    <p className="text-[10px] text-green-600">{selectedDepot.address || selectedDepot.city} · Nhấn để đổi kho</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-green-500 text-lg">swap_horiz</span>
                        </button>
                    ) : (
                        <div className="mt-2 text-xs text-slate-500 font-medium">
                            Chọn kho bên dưới để xem danh sách đơn vận chuyển
                        </div>
                    )}
                </div>

                {/* ── Body: Depot List or Jobs ── */}
                {!selectedDepot ? (
                    <>
                        <div className="px-4 pt-4">
                            <h1 className="text-lg font-extrabold text-slate-800">Chọn kho làm việc</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Danh sách kho đang có đơn cần vận chuyển</p>
                        </div>
                        <DepotSelectorScreen onSelect={setSelectedDepot} />
                    </>
                ) : (
                    <>
                        {/* Filter tabs */}
                        <div className="flex gap-2 px-4 pt-3 pb-2">
                            {[
                                { id: 'all',    label: `Tất cả (${jobs.length})` },
                                { id: 'nearby', label: 'Gần nhất' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-green-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Job list */}
                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                            {loadingJobs ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
                                ))
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <span className="material-symbols-outlined text-5xl block mb-3 text-slate-300">local_shipping</span>
                                    <p className="font-semibold text-slate-500">Chưa có đơn nào</p>
                                    <p className="text-xs mt-1">Kho này hiện chưa có đơn vận chuyển khả dụng</p>
                                    <button
                                        onClick={() => loadJobs(selectedDepot.id)}
                                        className="mt-4 text-green-600 text-sm font-semibold hover:underline"
                                    >
                                        Tải lại
                                    </button>
                                </div>
                            ) : (
                                jobs
                                    .filter(j => activeTab === 'all' || j.distanceKm != null)
                                    .sort((a, b) => activeTab === 'nearby' ? (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999) : 0)
                                    .map(job => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onAccept={handleAcceptJob}
                                            accepting={accepting}
                                        />
                                    ))
                            )}
                        </div>
                    </>
                )}

                <BottomNav active="market" />
            </div>
        </div>
    );
};

export default TransportationMarketplace;
