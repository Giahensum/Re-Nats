import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { depotService } from '../../services/depotService';
import FactoryPickerModal from './FactoryPickerModal';
import { useToast } from '../../context/ToastContext';


// ── Định cấu hình 3 bước ──────────────────────────────────────────────────
const STEPS = [
    { num: 1, title: 'Thông tin chung', desc: 'Loại phế liệu & Số lượng' },
    { num: 2, title: 'Nguồn gốc phế liệu', desc: 'Tỷ lệ thu gom thực tế' },
    { num: 3, title: 'Xác nhận & Hoàn tất', desc: 'Đăng bán lên chợ' },
];

const PRIMARY_COLOR = '#16a34a'; // Xanh lá thương hiệu

const vnd = n => n.toLocaleString('vi-VN') + ' ₫';

export default function CreateBatchOrder() {
    const navigate = useNavigate();
    const toast = useToast();


    // ── Khởi tạo State Form ─────────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [inventoryList, setInventoryList] = useState([]);
    const [activeMaterialTypes, setActiveMaterialTypes] = useState([]);
    const [depotProfile, setDepotProfile] = useState(null);
    const [showFactoryPicker, setShowFactoryPicker] = useState(false);
    const [selectedFactory, setSelectedFactory] = useState(null);
    const [transportType, setTransportType] = useState(''); // 'RENATS_DRIVER' | 'DEPOT_SELF'

    const [form, setForm] = useState({
        wasteType: '',         // Loại phế liệu (tên hiển thị)
        materialTypeKey: '',   // Key enum gửi lên BE (VD: IRON, COPPER, PET...)
        totalKg: '',           // Tổng số kg đóng lô
        unit: 'kg',
        location: 'Khu A - Phân khu phân loại 1',
        note: '',
        unitPrice: '',         // Không nhập giá ở kho, nhà máy sẽ tự nhập

        // Bước 2: Tỷ lệ nguồn gốc (%)
        sourceRatio: {
            households: 50,
            stores: 30,
            offices: 20,
        },
        // Ghi chú: phương thức vận chuyển sẽ chọn SAU khi nhà máy xác nhận
    });

    // Load tồn kho và danh sách loại vật liệu đang có lô hoạt động
    useEffect(() => {
        depotService.getInventory()
            .then(data => setInventoryList(data))
            .catch(() => {
                setInventoryList([
                    { type: 'Sắt vụn', current: 1200, unit: 'kg', key: 'IRON' },
                    { type: 'Đồng cáp', current: 450, unit: 'kg', key: 'COPPER' },
                    { type: 'Nhựa cứng (PP/PE)', current: 890, unit: 'kg', key: 'PET' },
                ]);
            });
        depotService.getActiveMaterialTypes()
            .then(data => setActiveMaterialTypes(data || []))
            .catch(() => {});
        depotService.getProfile()
            .then(data => {
                setDepotProfile(data);
                if (data && data.address) {
                    updateForm('location', data.address);
                } else if (data && data.latitude && data.longitude) {
                    const loc = `${data.latitude}, ${data.longitude}`;
                    updateForm('location', loc);
                }
            })
            .catch(() => {});
    }, []);

    // ── Xử lý nhập liệu ──────────────────────────────────────────────────────
    const updateForm = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const updateSource = (key, val) => {
        const num = Math.min(100, Math.max(0, parseInt(val) || 0));
        setForm(prev => ({
            ...prev,
            sourceRatio: { ...prev.sourceRatio, [key]: num }
        }));
    };

    // Tự động gán key enum tương ứng khi chọn loại phế liệu
    const handleSelectWasteType = (typeLabel) => {
        const matched = inventoryList.find(i => i.type === typeLabel);
        setForm(prev => ({
            ...prev,
            wasteType: typeLabel,
            materialTypeKey: matched?.key || 'OTHER'
        }));
    };

    // Lấy vị trí GPS hiện tại của kho vựa và lưu vào profile dạng Địa chỉ chữ
    const handleGetWarehouseGPS = () => {
        if (!navigator.geolocation) {
            toast.warning('Trình duyệt của bạn không hỗ trợ định vị GPS.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                
                try {
                    // Gọi OpenStreetMap Nominatim reverse geocoding để lấy địa chỉ dạng chữ
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
                    );
                    const data = await res.json();
                    const addressStr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    
                    updateForm('location', addressStr);

                    // Cập nhật lên server cả địa chỉ chữ lẫn tọa độ Latitude, Longitude
                    await depotService.updateProfile({
                        companyName: depotProfile?.companyName,
                        contactPerson: depotProfile?.contactPerson,
                        contactPhone: depotProfile?.contactPhone,
                        taxCode: depotProfile?.taxCode,
                        address: addressStr,
                        latitude: lat,
                        longitude: lng
                    });

                    setDepotProfile(prev => ({
                        ...prev,
                        address: addressStr,
                        latitude: lat,
                        longitude: lng
                    }));
                    
                    toast.success('Đã cập nhật vị trí địa chỉ & tọa độ GPS thành công vào Hồ Sơ Kho!');
                } catch (err) {
                    console.error('Lỗi định vị vị trí hoặc cập nhật GPS:', err);
                    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                    updateForm('location', fallback);
                }
            },
            (() => {
                toast.error('Không thể truy cập GPS thiết bị. Vui lòng cấp quyền vị trí.');
            })
        );

    };

    // Tổng nguồn gốc
    const totalRatio = Object.values(form.sourceRatio).reduce((s, v) => s + v, 0);

    // ── Submit API ──────────────────────────────────────────────────────────
    const handleFinish = async () => {
        setLoading(true);
        try {
            const payload = {
                wasteType:       form.wasteType,
                materialTypeKey: form.materialTypeKey,
                totalKg:         parseFloat(form.totalKg),
                unit:            form.unit,
                location:        form.location,
                note:            form.note,
                carrierId:       form.carrierId,
                buyer:           selectedFactory?.id || form.buyer,
                deliveryDate:    form.deliveryDate,
                transportType:   transportType || 'RENATS_DRIVER',
                unitPrice:       null,
                sourceRatio:     form.sourceRatio
            };

            await depotService.createBatchOrder(payload);
            toast.success('Xuất lô hàng thành công!');
            navigate('/kho/dashboard');
        } catch (err) {
            // Dev mode fallback
            console.warn('API error (dev mode):', err.message);
            toast.error('Đã xảy ra lỗi khi tạo lô hàng, hoặc hệ thống đang chạy ở chế độ offline.');
            navigate('/kho/dashboard');
        } finally {
            setLoading(false);
        }

    };

    const selectedItem = inventoryList.find(item => item.type === form.wasteType);
    const isWeightInvalid = selectedItem && parseFloat(form.totalKg) > selectedItem.current;


    return (
        <>
        <div className="font-sans bg-slate-50 min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/kho/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-slate-800">Tạo lô phế liệu xuất kho</h1>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">MÃ TẠO LÔ TỰ ĐỘNG</span>
                </div>
            </header>

            {/* Stepper */}
            <div className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex justify-between items-center relative">
                        {/* Tiến trình line sau lưng */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-green-600 transition-all duration-300 -z-0"
                            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />

                        {STEPS.map(s => {
                            const isDone = step > s.num;
                            const isCurrent = step === s.num;
                            return (
                                <div key={s.num} className="flex flex-col items-center relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                                        ${isDone ? 'bg-green-600 text-white' : isCurrent ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-slate-100 text-slate-400'}`}>
                                        {isDone ? '✓' : s.num}
                                    </div>
                                    <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>{s.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 pb-24">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

                    {/* BƯỚC 1: THÔNG TIN CHUNG */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Thông tin lô hàng</h3>
                                <p className="text-xs text-slate-400 mt-1">Đóng gói phế liệu tồn kho thành lô để đăng bán cho nhà máy.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Loại phế liệu trong kho</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {inventoryList.map(item => {
                                            const active = form.wasteType === item.type;
                                            return (
                                                <button key={item.type} type="button"
                                                    onClick={() => handleSelectWasteType(item.type)}
                                                    className={`p-4 rounded-xl border text-left transition-all relative
                                                        ${active ? 'border-green-600 bg-green-50/50'
                                                            : 'border-slate-200 hover:bg-slate-50'}`}>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase">TỒN: {item.current} kg</p>
                                                    <p className="font-bold text-slate-800 text-sm mt-1">{item.type}</p>
                                                </button>
                                            );
                                        })}
                                    </div>

                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng khối lượng đóng lô (kg)</label>
                                    <input type="number" placeholder="Nhập số kg đóng lô..." value={form.totalKg} onChange={e => updateForm('totalKg', e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                                    {isWeightInvalid && (
                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-semibold">
                                            <span>⚠️</span> Khối lượng đóng lô không được vượt quá số lượng tồn kho ({selectedItem.current} kg)
                                        </p>
                                    )}
                                </div>


                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí lưu kho chứa lô</label>
                                        <button
                                            type="button"
                                            onClick={handleGetWarehouseGPS}
                                            className="text-green-700 hover:text-green-800 flex items-center gap-1 hover:underline text-[10px] font-extrabold cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-xs">my_location</span>
                                            Lấy GPS hiện tại
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={e => updateForm('location', e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                                            placeholder="VD: Khu A - Phân khu 1 hoặc tọa độ GPS..."
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                                            location_on
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mô tả hoặc ghi chú thêm</label>
                                    <textarea rows={3} placeholder="Mô tả chất lượng phế liệu, độ sạch..." value={form.note} onChange={e => updateForm('note', e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BƯỚC 2: NGUỒN GỐC PHẾ LIỆU */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Tỷ lệ nguồn gốc phế liệu</h3>
                                <p className="text-xs text-slate-400 mt-1">Cung cấp nguồn gốc phế liệu giúp nâng cao tính minh bạch để nhà máy tin cậy đấu giá cao hơn.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-600">Tổng phần trăm phân bổ:</span>
                                    <span className={`text-lg font-black ${totalRatio === 100 ? 'text-green-600' : 'text-red-500'}`}>{totalRatio} %</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-slate-700 w-32">Hộ gia đình (%)</span>
                                        <input type="number" value={form.sourceRatio.households} onChange={e => updateSource('households', e.target.value)}
                                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-slate-700 w-32">Cửa hàng (%)</span>
                                        <input type="number" value={form.sourceRatio.stores} onChange={e => updateSource('stores', e.target.value)}
                                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-slate-700 w-32">Công sở (%)</span>
                                        <input type="number" value={form.sourceRatio.offices} onChange={e => updateSource('offices', e.target.value)}
                                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-extrabold text-slate-800 text-base">Xác nhận đóng lô hàng</h3>
                                <p className="text-xs text-slate-400 mt-1">Kiểm tra lại thông tin trước khi đăng bán công khai lên chợ.</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Loại phế liệu:</span>
                                    <span className="font-bold text-slate-800">{form.wasteType}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Khối lượng đóng lô:</span>
                                    <span className="font-bold text-slate-800">{form.totalKg} kg</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Vị trí trong kho:</span>
                                    <span className="font-bold text-slate-800">{form.location}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
                                    <span className="text-slate-500">Đơn giá:</span>
                                    <span className="font-bold text-slate-600 italic">Chờ nhà máy đặt giá</span>
                                </div>
                            </div>


                            {/* ── Chọn nhà máy nhận lô ─────────────────── */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">Nhà máy tái chế nhận lô</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {form.materialTypeKey
                                                ? <>Chỉ hiển thị nhà máy nhận <strong className="text-green-700">{form.wasteType}</strong>, sắp xếp gần kho nhất</>
                                                : 'Vui lòng quay lại bước 1 để chọn loại phế liệu trước'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!form.materialTypeKey) {
                                                alert('Vui lòng quay lại Bước 1 để chọn loại phế liệu trước khi chọn nhà máy!');
                                                return;
                                            }
                                            setShowFactoryPicker(true);
                                        }}
                                        disabled={!form.materialTypeKey}
                                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm ${
                                            form.materialTypeKey
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-base">factory</span>
                                        {selectedFactory ? 'Đổi nhà máy' : 'Chọn nhà máy'}
                                    </button>
                                </div>

                                {selectedFactory ? (
                                    <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-400 rounded-2xl">
                                        <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">🏭</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 text-sm">{selectedFactory.companyName}</p>
                                                {selectedFactory.isPremium && (
                                                    <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">⭐ PREMIUM</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">{selectedFactory.address || selectedFactory.province}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                {selectedFactory.capacityPerMonthTon && (
                                                    <span className="text-xs text-slate-500">🏋️ {selectedFactory.capacityPerMonthTon.toLocaleString('vi-VN')} tấn/tháng</span>
                                                )}
                                                {selectedFactory.distanceKm != null && (
                                                    <span className="text-xs font-bold text-green-700">📍 Cách {selectedFactory.distanceKm} km</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFactory(null)}
                                            className="text-slate-400 hover:text-red-500 transition text-xs"
                                        >✕</button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => setShowFactoryPicker(true)}
                                        className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition"
                                    >
                                        <span className="material-symbols-outlined text-3xl text-slate-300">factory</span>
                                        <p className="text-slate-400 text-sm font-semibold mt-1">Chưa chọn nhà máy</p>
                                        <p className="text-slate-400 text-xs mt-0.5">Lô sẽ được đăng bán công khai trên chợ</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Chọn phương thức vận chuyển ─────────────── */}
                            <div>
                                <p className="font-bold text-slate-800 text-sm mb-3">Phương thức vận chuyển</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTransportType('RENATS_DRIVER')}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            transportType === 'RENATS_DRIVER'
                                                ? 'border-green-500 bg-green-50 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div className="text-2xl mb-2">🚛</div>
                                        <p className="font-bold text-slate-800 text-sm">Tài xế Re-Nats</p>
                                        <p className="text-xs text-slate-500 mt-1">Hệ thống điều phối tài xế đến lấy hàng</p>
                                        {transportType === 'RENATS_DRIVER' && (
                                            <span className="mt-2 inline-block text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">✓ Đã chọn</span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTransportType('DEPOT_SELF')}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                            transportType === 'DEPOT_SELF'
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div className="text-2xl mb-2">🏪</div>
                                        <p className="font-bold text-slate-800 text-sm">Kho tự vận chuyển</p>
                                        <p className="text-xs text-slate-500 mt-1">Dùng phương tiện riêng của kho</p>
                                        {transportType === 'DEPOT_SELF' && (
                                            <span className="mt-2 inline-block text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">✓ Đã chọn</span>
                                        )}
                                    </button>
                                </div>
                                {!transportType && (
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <span>⚠️</span> Vui lòng chọn phương thức vận chuyển
                                    </p>
                                )}
                                {transportType === 'RENATS_DRIVER' && (
                                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                                        <span>ℹ️</span> Tài xế sẽ được điều phối sau khi nhà máy xác nhận mua lô hàng
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Điều hướng Next/Back */}
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                        <button type="button" disabled={step === 1} onClick={() => setStep(s => s - 1)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${step === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                            Quay lại
                        </button>

                        {step < STEPS.length ? (
                            <button
                                type="button"
                                disabled={step === 1 && (!form.wasteType || !form.totalKg || isWeightInvalid)}
                                onClick={() => setStep(s => s + 1)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
                                    step === 1 && (!form.wasteType || !form.totalKg || isWeightInvalid)
                                        ? 'bg-slate-300 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {step === 1 && !form.wasteType ? 'Chọn loại phế liệu trước' : step === 1 && isWeightInvalid ? 'Vượt quá tồn kho' : step === 1 && !form.totalKg ? 'Nhập số kg trước' : 'Tiếp tục'}
                            </button>

                        ) : (
                            <button type="button" disabled={loading} onClick={handleFinish}
                                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all bg-green-600 hover:bg-green-700">
                                {loading ? 'Đang tạo lô...' : 'Đóng lô & Đăng bán'}
                            </button>
                        )}
                    </div>

                </div>
            </main>
        </div>

        {/* Factory Picker Modal */}
        {showFactoryPicker && (
            <FactoryPickerModal
                materialType={form.materialTypeKey}
                depotProfile={depotProfile}
                onSelect={(factory) => {
                    setSelectedFactory(factory);
                    setShowFactoryPicker(false);
                }}
                onClose={() => setShowFactoryPicker(false)}
            />
        )}
    </>
    );
}


