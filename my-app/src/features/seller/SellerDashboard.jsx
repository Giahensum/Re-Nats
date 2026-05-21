import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AvatarDropdown } from '../../components/seller/AvatarDropdown';
import { sellerService } from '../../services/sellerService';

const WAREHOUSE = 'Kho Re-Nats';

const STATUS = {
    pending: { label: 'Chờ xác nhận', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', step: 0 },
    scheduled: { label: 'Kho sắp đến', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400', step: 1 },
    weighed: { label: 'Đã cân xong', bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400', step: 2 },
    done: { label: 'Hoàn tất', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', step: 3 },
};

const FLOW_STEPS = ['Chờ xác nhận', 'Kho xác nhận', 'Đã cân', 'Hoàn tất'];

const vnd = n => n.toLocaleString('vi-VN') + ' ₫';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBell = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);
const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const IconChevron = ({ open }) => (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);
const IconInvoice = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

// ── Request card ───────────────────────────────────────────────────────────
const RequestCard = ({ req, expanded, onToggle }) => {
    const s = STATUS[req.status] || STATUS.pending;
    const totalKg = req.resultWeights?.reduce((a, x) => a + x.kg, 0);
    const totalMoney = req.resultWeights?.reduce((a, x) => a + x.kg * x.pricePerKg, 0);

    return (
        <div className={`bg-white rounded-2xl border overflow-hidden transition-all
            ${expanded ? 'border-slate-200 shadow-md' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>

            {/* Header row */}
            <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-700">{req.requestCode}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                            {s.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                        {req.types?.map(t => t.label).join(' · ')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{req.pickupDate} · {req.pickupSlot}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                    {totalKg !== undefined ? (
                        <div>
                            <p className="text-sm font-extrabold text-slate-800">{totalKg.toFixed(1)} kg</p>
                            <p className="text-xs text-emerald-600 font-semibold">{vnd(Math.round(totalMoney))}</p>
                        </div>
                    ) : (
                        <span className="text-slate-400"><IconChevron open={expanded} /></span>
                    )}
                </div>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">

                    {/* Flow tracker */}
                    <div className="flex items-center">
                        {FLOW_STEPS.map((label, i) => {
                            const done = i <= s.step;
                            const active = i === s.step;
                            return (
                                <React.Fragment key={i}>
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all
                                            ${done ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {done
                                                ? <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                : <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            }
                                        </div>
                                        <span className={`text-[9px] mt-1 text-center w-14 leading-tight
                                            ${active ? 'font-bold text-slate-700' : 'text-slate-400'}`}>
                                            {label}
                                        </span>
                                    </div>
                                    {i < FLOW_STEPS.length - 1 && (
                                        <div className={`flex-1 h-px mx-1 mb-3.5 ${i < s.step ? 'bg-green-500' : 'bg-slate-200'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Address */}
                    <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">Địa chỉ: </span>{req.pickupAddress}
                    </div>

                    {/* Kho xử lý */}
                    {req.status !== 'pending' && (
                        <div className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">Xử lý bởi: </span>
                            <span className="text-green-700 font-semibold">{req.depotName || WAREHOUSE}</span>
                        </div>
                    )}

                    {/* Trạng thái message */}
                    {req.status === 'pending' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
                            Đang chờ kho xác nhận lịch đến thu gom. Thường trong vòng <strong>2–4 giờ</strong>.
                        </div>
                    )}
                    {req.status === 'scheduled' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                            <strong>{req.depotName || WAREHOUSE}</strong> sẽ đến vào <strong>{req.pickupSlot}</strong> ngày <strong>{req.pickupDate}</strong>.
                            Vui lòng có mặt để bàn giao và cân hàng trực tiếp.
                        </div>
                    )}

                    {/* Kết quả cân + hóa đơn */}
                    {req.resultWeights?.length > 0 && (
                        <div className="border border-emerald-200 rounded-xl overflow-hidden">
                            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100">
                                <p className="text-sm font-bold text-emerald-700">Kết quả cân — {req.depotName || WAREHOUSE}</p>
                            </div>
                            <div className="px-4 py-3 space-y-2">
                                {req.resultWeights.map(w => (
                                    <div key={w.label} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{w.label}</span>
                                        <div className="text-right">
                                            <span className="font-bold text-slate-800">{w.kg} kg</span>
                                            <span className="text-xs text-slate-400 ml-2">· {vnd(w.pricePerKg)}/kg</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">Tổng khối lượng</span>
                                    <span className="text-sm font-extrabold text-slate-800">{totalKg.toFixed(1)} kg</span>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2.5">
                                    <span className="text-sm font-extrabold text-emerald-700">Tiền nhận được</span>
                                    <span className="text-base font-extrabold text-emerald-700">{vnd(Math.round(totalMoney))}</span>
                                </div>
                                {req.note && (
                                    <p className="text-xs text-slate-400 italic">Ghi chú: {req.note}</p>
                                )}
                                {/* Nút hóa đơn */}
                                <Link to={`/hoa-don/${req.id}`}
                                    className="flex items-center justify-center gap-2 w-full mt-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.005]">
                                    <IconInvoice />
                                    Xem &amp; tải hóa đơn
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main ───────────────────────────────────────────────────────────────────
const SellerDashboard = () => {
    const [expanded, setExpanded] = useState(null);
    const [filter, setFilter] = useState('all');
    const [requests, setRequests] = useState([]);
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const reqRes = await sellerService.getRequests(filter === 'all' ? null : filter);
                setRequests(reqRes.data);
                
                const statRes = await sellerService.getStats();
                setStatsData(statRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter]);

    const stats = [
        { label: 'Tổng', value: statsData?.totalRequests || 0, color: 'text-slate-700', bg: 'bg-slate-100' },
        { label: 'Chờ xử lý', value: statsData?.pendingCount || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Đang xử lý', value: statsData?.inProgressCount || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Hoàn tất', value: statsData?.doneCount || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const FILTERS = [
        { key: 'all', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ xác nhận' },
        { key: 'scheduled', label: 'Đã lên lịch' },
        { key: 'weighed', label: 'Đã cân' },
        { key: 'done', label: 'Hoàn tất' },
    ];

    return (
        <div className="font-sans bg-slate-50 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src="/logo.jpg" alt="Re-Nats" className="h-8 w-auto" />
                        <div>
                            <p className="text-sm font-extrabold text-slate-800 leading-none">Re-Nats</p>
                            <p className="text-xs text-slate-400">Cổng người bán</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                            <IconBell />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                        </button>
                        <AvatarDropdown name="Ngô Sỹ Giá" role="Người bán" />
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* Greeting + CTA */}
                <div className="flex items-start justify-between gap-4">
                    <Link to="/seller/dang-tin"
                        className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-green-200 transition-all hover:scale-[1.02] whitespace-nowrap flex-shrink-0">
                        <IconPlus /> Đăng bán
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2">
                    {stats.map(s => (
                        <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                    {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0
                                ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Request list */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center text-slate-400 py-10">Đang tải dữ liệu...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-4xl mb-3">♻️</p>
                            <p className="font-semibold text-slate-500">Không có yêu cầu nào</p>
                            <Link to="/seller/dang-tin" className="mt-3 inline-block text-sm text-green-700 font-semibold">
                                + Đăng bán ngay
                            </Link>
                        </div>
                    ) : (
                        requests.map(req => (
                            <RequestCard
                                key={req.id}
                                req={req}
                                expanded={expanded === req.id}
                                onToggle={() => setExpanded(expanded === req.id ? null : req.id)}
                            />
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default SellerDashboard;
