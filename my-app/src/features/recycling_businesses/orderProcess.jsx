import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

const IconBack = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const IconCamera = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
);

const IconScale = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0a3 3 0 11-6 0m6 0a3 3 0 106 0M6 16.5H3m15 0h3M6 12H3m15 0h3m-15-4.5H3m15 0h3M6 7.5a3 3 0 116 0m-6 0a3 3 0 006 0" />
    </svg>
);

const IconTrash = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const IconAlert = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconCash = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zm1.5 3h13.5M9 12.75h6M9 15.75h6" />
    </svg>
);

const OrderProcess = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const targetOrderId = searchParams.get('orderId');
    const [timeStr, setTimeStr] = useState('09:42 AM');
    const [trucks, setTrucks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTruckIndex, setActiveTruckIndex] = useState(0);

    // Auto-select truck index from URL search params if present
    useEffect(() => {
        if (targetOrderId && trucks.length > 0) {
            const foundIndex = trucks.findIndex(t => t.id === targetOrderId);
            if (foundIndex !== -1) {
                setActiveTruckIndex(foundIndex);
            }
        }
    }, [trucks, targetOrderId]);

    // Reactive input states synchronized to the active truck
    const [measuredInput, setMeasuredInput] = useState(0);
    const [impurityInput, setImpurityInput] = useState(0);
    const [priceInput, setPriceInput] = useState(0);
    const [noteInput, setNoteInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Update real-time clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            setTimeStr(`${String(hours).padStart(2, '0')}:${minutes} ${ampm}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch queue from backend
    const loadQueue = async () => {
        setLoading(true);
        try {
            const res = await factoryService.getWeighingQueue();
            if (res && res.length > 0) {
                // Backend queue mapping
                const mapped = res.map(t => ({
                    id: t.orderId,
                    plate: t.vehiclePlate || '29H-441.22',
                    driver: t.driverName || 'Nguyễn Hữu Thọ',
                    material: t.materialType || 'PAPER',
                    declaredWeight: t.estimatedWeightKg || 12000,
                    unitPrice: 3200,
                    measuredWeight: t.estimatedWeightKg || 12000,
                    impurityWeight: 150,
                    supplier: t.depotName || 'Hợp Tác Xã Minh Khôi',
                    status: t.status,
                }));
                setTrucks(mapped);
            } else {
                setTrucks([]);
            }
        } catch (err) {
            console.error('Error fetching weighing queue:', err);
            setTrucks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const activeTruck = trucks[activeTruckIndex];

    // Sync input states when active truck changes
    useEffect(() => {
        if (activeTruck) {
            setMeasuredInput(activeTruck.measuredWeight);
            setImpurityInput(activeTruck.impurityWeight);
            setPriceInput(activeTruck.unitPrice);
            setNoteInput('');
        }
    }, [activeTruckIndex, trucks]);

    // Handle weighing completion
    const handleConfirmWeighing = async () => {
        if (!activeTruck) return;
        setSubmitting(true);
        try {
            await factoryService.completeWeighing(activeTruck.id, {
                measuredWeightKg: measuredInput,
                impurityWeightKg: impurityInput,
                pricePerKg: priceInput,
                station: 'Trạm Cân Cổng Nam #04',
                note: noteInput || 'Đã kiểm định hoàn tất.',
            });
            toast.success(`Cân xe ${activeTruck.plate} thành công! Đã chốt phiếu cân & chuyển hóa đơn.`);
            navigate(`/recycle/order-settlement?orderId=${activeTruck.id}`);
        } catch (err) {
            console.error('Error completing weighing:', err);
            toast.error('Giao dịch lỗi hoặc đã được hoàn tất trước đó!');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle rejecting truck
    const handleRejectTruck = async () => {
        if (!activeTruck) return;
        const reason = window.prompt(`Nhập lý do từ chối kiểm định xe hàng ${activeTruck.plate}:`);
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('Bạn phải cung cấp lý do từ chối!');
            return;
        }

        setSubmitting(true);
        try {
            await factoryService.rejectTruck(activeTruck.id, reason);
            toast.warning(`Đã từ chối nhận xe hàng ${activeTruck.plate}.`);
            loadQueue();
            setActiveTruckIndex(0);
        } catch (err) {
            console.error('Error rejecting truck:', err);
            toast.error('Lỗi khi từ chối xe hàng!');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReadScale = () => {
        if (!activeTruck) return;
        const randomFluctuation = Math.floor(Math.random() * 80) - 40;
        const simulatedScaleWeight = activeTruck.declaredWeight + randomFluctuation;
        setMeasuredInput(simulatedScaleWeight);
        toast.info('Trạm cân đã ổn định ở mức: ' + simulatedScaleWeight + ' kg');
    };

    // Real-time calculations
    const cleanWeight = Math.max(0, measuredInput - impurityInput);
    const impurityRate = measuredInput > 0 ? ((impurityInput / measuredInput) * 100) : 0;
    
    const pricePerKg = priceInput;
    const cleanValue = cleanWeight * pricePerKg;
    const deductionValue = impurityInput * pricePerKg;
    const isHighImpurity = impurityRate > 5.0;

    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col antialiased">
            {/* Unified Top Navigation */}
            <HeaderDoanhNghiep activeTab="dashboard" />

            {/* Visual Stepper Guideline for Recycler Lifecycle */}
            <div className="bg-white border-b border-slate-100 py-6 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">1</div>
                            <span className="text-xs font-bold text-slate-500">Chốt thầu / Đặt mua</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">2</div>
                            <span className="text-xs font-bold text-slate-500">Vận chuyển đến</span>
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-md ring-4 ring-green-100">3</div>
                            <span className="text-xs font-black text-green-700">Kiểm định & Trạm cân</span>
                            {/* Connector line indicators */}
                            <div className="hidden md:block absolute left-[-50%] top-4 w-[100%] h-0.5 bg-green-200 -z-10" />
                            <div className="hidden md:block absolute right-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm mb-2">4</div>
                            <span className="text-xs font-bold text-slate-400">Xuất hóa đơn & Chốt</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to dashboard toolbar */}
            <div className="bg-white border-b border-slate-200/60 py-3">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                    <Link to="/recycle/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-green-700 font-extrabold text-xs transition-colors">
                        <IconBack />
                        Quay lại trang tổng quan nhà máy
                    </Link>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                            QC STATION CỔNG NAM #04
                        </span>
                        <span className="hidden sm:inline">|</span>
                        <span>{timeStr}</span>
                    </div>
                </div>
            </div>

            {/* Master Grid Area */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                        <p className="text-slate-500 font-bold">Đang quét hàng chờ kiểm định...</p>
                    </div>
                ) : trucks.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center max-w-lg mx-auto shadow-sm">
                        <p className="text-5xl mb-4">🚚</p>
                        <h2 className="text-xl font-bold text-slate-800">Hàng chờ trống</h2>
                        <p className="text-sm text-slate-400 mt-2">Hiện tại không có xe hàng vận chuyển nào của vựa đang đợi kiểm định hoặc chờ cân tại nhà máy của bạn.</p>
                        <Link to="/recycle/market" className="inline-flex mt-6 bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-secondary transition-colors">
                            Vào chợ đặt mua hàng
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left: Queue Column */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-slate-200/50 p-3 rounded-2xl flex items-center justify-between">
                                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Xe chờ cân ({trucks.length})</h2>
                                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                            </div>

                            <div className="space-y-3">
                                {trucks.map((truck, idx) => {
                                    const isActive = idx === activeTruckIndex;
                                    return (
                                        <div
                                            key={truck.id}
                                            onClick={() => setActiveTruckIndex(idx)}
                                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none
                                                ${isActive 
                                                    ? 'bg-white border-green-600/30 ring-2 ring-green-600/20 shadow-md' 
                                                    : 'bg-white border-slate-100 hover:bg-slate-50 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded
                                                    ${isActive ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isActive ? 'ĐANG CÂN' : 'CHỜ QC'}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-400">#{(truck.id || '').substring(0, 8)}</span>
                                            </div>
                                            <p className="text-base font-extrabold text-slate-800 leading-snug">{truck.plate}</p>
                                            <p className="text-xs text-slate-400 mt-1 truncate">Vựa: {truck.supplier}</p>
                                            <p className="text-xs text-slate-500 font-bold mt-1.5 text-green-700 truncate">{truck.material}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Middle & Right: Active Station Board */}
                        <div className="lg:col-span-9 space-y-6">
                            
                            {/* Active Vehicle Details Ribbon */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-8 border-green-700">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{activeTruck.plate}</h1>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200/30">{activeTruck.material}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        Đối tác vựa: <span className="font-bold text-slate-600">{activeTruck.supplier}</span> · Tài xế phụ trách: <span className="font-bold text-slate-600">{activeTruck.driver}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100/50 shrink-0">
                                    <IconCamera />
                                    <span>Camera Trạm Cân Tự Động</span>
                                </div>
                            </div>

                            {/* Weight Inspection Core Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Input Column */}
                                <div className="space-y-6">
                                    {/* Declared Weight Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tổng khối lượng ước tính của vựa</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                readOnly
                                                value={activeTruck.declaredWeight.toLocaleString('vi-VN')}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xl font-extrabold text-slate-400 outline-none cursor-not-allowed select-none"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
                                        </div>
                                    </div>

                                    {/* Measured Inbound Weight Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative">
                                        <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <IconScale /> Tổng trọng lượng thực tế (Gross Weight)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={measuredInput || ''}
                                                onChange={(e) => setMeasuredInput(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-full bg-slate-50 border border-blue-200 focus:border-blue-500 rounded-xl py-3.5 px-4 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
                                        </div>
                                        <div className="flex justify-end mt-2.5">
                                            <button
                                                onClick={handleReadScale}
                                                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/70 text-blue-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
                                            >
                                                <span className="text-sm">🔄</span>
                                                <span>Nhận dữ liệu từ Trạm Cân</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tare / Impurities Weight Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative">
                                        <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <IconTrash /> Trọng lượng tạp chất trừ khấu hao (Tare)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={impurityInput || ''}
                                                onChange={(e) => setImpurityInput(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-full bg-slate-50 border border-amber-200 focus:border-amber-500 rounded-xl py-3.5 px-4 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KG</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {[-50, 50, 200].map((val) => (
                                                <button
                                                    key={val}
                                                    onClick={() => setImpurityInput(Math.max(0, impurityInput + val))}
                                                    className="py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-xl transition-all focus:outline-none cursor-pointer"
                                                >
                                                    {val > 0 ? `+${val}` : val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price Per Kg Card */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative">
                                        <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <IconCash /> Đơn giá chốt thực tế (Price/kg)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={priceInput || ''}
                                                onChange={(e) => setPriceInput(Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-full bg-slate-50 border border-green-200 focus:border-green-500 rounded-xl py-3.5 px-4 text-2xl font-black text-slate-800 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₫/KG</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            {[-100, 100, 500].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setPriceInput(Math.max(0, priceInput + val))}
                                                    className="py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold text-xs rounded-xl transition-all focus:outline-none cursor-pointer"
                                                >
                                                    {val > 0 ? `+${val}` : val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Inspection Calculation Column */}
                                <div className="flex flex-col space-y-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-grow flex flex-col justify-between items-center text-center">
                                        <div className="w-full">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kết quả kiểm định</h3>
                                            <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100/50 text-xs font-bold mb-4">
                                                Đơn giá thỏa thuận: {pricePerKg.toLocaleString('vi-VN')} ₫/kg
                                            </span>
                                        </div>

                                        {/* Impurity meter */}
                                        <div className="my-4">
                                            <p className="text-6xl font-black text-slate-800 tracking-tighter">{impurityRate.toFixed(1)}%</p>
                                            <p className="text-xs text-slate-400 font-bold mt-1">Tỷ lệ tạp chất kiểm định</p>
                                            {isHighImpurity ? (
                                                <div className="flex items-center justify-center gap-1.5 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold mt-3 border border-red-100/40">
                                                    <IconAlert />
                                                    <span>Tạp chất cao vượt ngưỡng cho phép (&gt;5.0%)</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold mt-3 border border-green-100/40">
                                                    <span className="text-sm">✅</span>
                                                    <span>Đạt chuẩn chất lượng quy định</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Ghi chú kiểm định */}
                                        <div className="w-full px-2">
                                            <input
                                                type="text"
                                                value={noteInput}
                                                onChange={(e) => setNoteInput(e.target.value)}
                                                placeholder="Nhập ghi chú kiểm định chất lượng (ví dụ: ẩm nhẹ, sạch tạp chất...)"
                                                className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl py-2 px-3 text-xs text-slate-600 focus:outline-none transition-all text-center"
                                            />
                                        </div>

                                        {/* Real-time Dynamic Results Summary */}
                                        <div className="w-full grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trọng lượng sạch (Net)</p>
                                                <p className="text-xl font-extrabold text-slate-800 mt-1">{cleanWeight.toLocaleString('vi-VN')} <span className="text-xs text-slate-400 font-normal">KG</span></p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trừ khấu hao tạp chất</p>
                                                <p className="text-xl font-extrabold text-red-600 mt-1">-{deductionValue.toLocaleString('vi-VN')} ₫</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Confirmation CTA Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleConfirmWeighing}
                                            disabled={submitting || cleanWeight <= 0}
                                            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-55 text-white text-base font-extrabold py-4 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                                        >
                                            <IconCheck />
                                            <span>{submitting ? 'ĐANG CHỐT PHIẾU CÂN...' : 'XÁC NHẬN CÂN & XUẤT HÓA ĐƠN'}</span>
                                        </button>
                                        <button
                                            onClick={handleRejectTruck}
                                            disabled={submitting}
                                            className="w-full bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/80 text-xs font-bold py-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-all focus:outline-none cursor-pointer"
                                        >
                                            <IconAlert />
                                            <span>Từ chối xe hàng hoặc phát hiện gian lận</span>
                                        </button>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>
                )}
            </main>

            {/* Standard Footer */}
            <footer className="bg-white border-t border-slate-100 mt-auto py-8">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Re-Nats Logo" className="h-6 w-auto rounded" />
                        <span className="text-slate-400 text-xs font-bold">© 2026 Re-Nats Platform. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default OrderProcess;
