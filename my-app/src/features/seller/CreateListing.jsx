import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sellerService } from '../../services/sellerService';

// ── Waste type catalogue ───────────────────────────────────────────────────
const WASTE_CATALOGUE = [
    { id: 'dong_cap_1', label: 'Đồng cáp', sub: 'Loại 1', emoji: '🔶', color: 'amber' },
    { id: 'dong_cap_2', label: 'Đồng cáp', sub: 'Loại 2', emoji: '🟡', color: 'yellow' },
    { id: 'nhom', label: 'Nhôm', sub: 'Phế liệu', emoji: '🔘', color: 'slate' },
    { id: 'sat', label: 'Sắt vụn', sub: 'Phế liệu', emoji: '⚙️', color: 'gray' },
    { id: 'thep', label: 'Thép', sub: 'Phế liệu', emoji: '🔩', color: 'zinc' },
    { id: 'giay_carton', label: 'Giấy Carton', sub: 'Thùng cũ', emoji: '📦', color: 'sky' },
    { id: 'giay_bao', label: 'Giấy báo', sub: 'Sách cũ', emoji: '📰', color: 'blue' },
    { id: 'nhua_cung', label: 'Nhựa cứng', sub: 'PP / PE', emoji: '🪣', color: 'emerald' },
    { id: 'nhua_mem', label: 'Nhựa mềm', sub: 'Bao bì', emoji: '🛍️', color: 'teal' },
    { id: 'thiec', label: 'Thiếc', sub: 'Kim loại', emoji: '🥫', color: 'orange' },
    { id: 'pin', label: 'Pin / Acquy', sub: 'Cũ', emoji: '🔋', color: 'green' },
    { id: 'dien_tu', label: 'Điện tử', sub: 'Linh kiện', emoji: '💻', color: 'violet' },
    { id: 'khac', label: 'Khác', sub: 'Ghi rõ ở mô tả', emoji: '♻️', color: 'rose' },
];

const ACCENT = {
    amber: { sel: 'bg-amber-500 text-white border-amber-500', ring: 'ring-amber-300' },
    yellow: { sel: 'bg-yellow-400 text-slate-800 border-yellow-400', ring: 'ring-yellow-300' },
    slate: { sel: 'bg-slate-500 text-white border-slate-500', ring: 'ring-slate-300' },
    gray: { sel: 'bg-gray-600 text-white border-gray-600', ring: 'ring-gray-400' },
    zinc: { sel: 'bg-zinc-600 text-white border-zinc-600', ring: 'ring-zinc-400' },
    sky: { sel: 'bg-sky-500 text-white border-sky-500', ring: 'ring-sky-300' },
    blue: { sel: 'bg-blue-500 text-white border-blue-500', ring: 'ring-blue-300' },
    emerald: { sel: 'bg-emerald-500 text-white border-emerald-500', ring: 'ring-emerald-300' },
    teal: { sel: 'bg-teal-500 text-white border-teal-500', ring: 'ring-teal-300' },
    orange: { sel: 'bg-orange-500 text-white border-orange-500', ring: 'ring-orange-300' },
    green: { sel: 'bg-green-600 text-white border-green-600', ring: 'ring-green-300' },
    violet: { sel: 'bg-violet-500 text-white border-violet-500', ring: 'ring-violet-300' },
    rose: { sel: 'bg-rose-500 text-white border-rose-500', ring: 'ring-rose-300' },
};

const TIME_SLOTS = [
    '07:00 – 09:00', '09:00 – 11:00', '11:00 – 13:00',
    '13:00 – 15:00', '15:00 – 17:00', '17:00 – 19:00',
];

const STEPS = ['Loại phế liệu', 'Địa điểm & Thời gian', 'Xác nhận'];

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBack = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);
const IconCheck = ({ size = 4 }) => (
    <svg className={`w-${size} h-${size}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);
const IconX = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const IconCamera = () => (
    <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);
const IconPin = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

// ── Step bar ───────────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
    <div className="flex items-center mb-8">
        {STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            return (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${done ? 'bg-green-700 text-white' : active ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-slate-100 text-slate-400'}`}>
                            {done ? <IconCheck /> : i + 1}
                        </div>
                        <span className={`text-xs font-medium mt-1 text-center whitespace-nowrap ${active ? 'text-slate-800' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-5 ${done ? 'bg-green-600' : 'bg-slate-200'}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ── Step 1: Chọn nhiều loại phế liệu ──────────────────────────────────────
const Step1 = ({ selected, setSelected, description, setDescription }) => {
    const toggle = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Loại phế liệu muốn bán <span className="text-red-400">*</span>
                </p>
                <p className="text-xs text-slate-400 mb-3">Chọn tất cả các loại bạn có — kho sẽ đến cân</p>

                {/* Selected tags */}
                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        {selected.map(id => {
                            const w = WASTE_CATALOGUE.find(x => x.id === id);
                            return (
                                <span key={id} className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-green-200 text-sm font-semibold text-green-800 shadow-sm">
                                    {w.emoji} {w.label}
                                    <button onClick={() => toggle(id)} className="text-green-500 hover:text-red-500 transition-colors ml-0.5">
                                        <IconX />
                                    </button>
                                </span>
                            );
                        })}
                        <span className="text-xs text-green-600 self-center ml-1 font-medium">
                            ✓ {selected.length} loại đã chọn
                        </span>
                    </div>
                )}

                {/* Tile grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {WASTE_CATALOGUE.map(w => {
                        const isSel = selected.includes(w.id);
                        const a = ACCENT[w.color];
                        return (
                            <button key={w.id} onClick={() => toggle(w.id)}
                                className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all active:scale-95 cursor-pointer
                                    ${isSel
                                        ? `${a.sel} shadow-md ring-2 ${a.ring} ring-offset-1`
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-2xl leading-none">{w.emoji}</span>
                                <div>
                                    <p className={`text-xs font-bold leading-tight ${isSel ? 'text-inherit' : 'text-slate-700'}`}>{w.label}</p>
                                    <p className={`text-[10px] ${isSel ? 'text-inherit opacity-80' : 'text-slate-400'}`}>{w.sub}</p>
                                </div>
                                {isSel && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                                        <IconCheck size={3} />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mô tả thêm</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Mô tả tình trạng, ước lượng nhiều hay ít, ghi chú cho nhân viên thu gom..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" />
                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <span className="text-amber-500 text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-amber-700">
                        Bạn <strong>không cần cân</strong> — nhân viên của kho sẽ đến, cân chính xác và báo lại kết quả cho bạn.
                    </p>
                </div>
            </div>
        </div>
    );
};

// ── Step 2: Địa điểm & Thời gian ──────────────────────────────────────────
const Step2 = ({ form, setForm, images, setImages, fileRef }) => {
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

    const handleImages = (e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(f => ({ url: URL.createObjectURL(f), name: f.name }));
        setImages(prev => [...prev, ...previews].slice(0, 6));
    };
    const removeImg = idx => setImages(p => p.filter((_, i) => i !== idx));

    return (
        <div className="space-y-6">
            {/* Images (optional) */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hình ảnh phế liệu</label>
                <p className="text-xs text-slate-400 mb-3">Không bắt buộc nhưng giúp kho chuẩn bị tốt hơn · Tối đa 6 ảnh</p>
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeImg(i)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconX />
                            </button>
                        </div>
                    ))}
                    {images.length < 6 && (
                        <button onClick={() => fileRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-green-500 hover:bg-green-50 flex flex-col items-center justify-center gap-1 transition-colors">
                            <IconCamera />
                            <span className="text-xs text-slate-400 font-medium">Thêm ảnh</span>
                        </button>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </div>

            {/* Address */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Địa chỉ thu gom <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Nhập địa chỉ cụ thể..." value={form.address} onChange={set('address')}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
                    <button
                        onClick={() => {
                            setForm(p => ({ ...p, address: 'Đang lấy vị trí...' }));
                            navigator.geolocation?.getCurrentPosition(
                                () => setForm(p => ({ ...p, address: 'Quận 9, TP. Hồ Chí Minh' })),
                                () => setForm(p => ({ ...p, address: '' }))
                            );
                        }}
                        className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors whitespace-nowrap">
                        <IconPin /> Vị trí của tôi
                    </button>
                </div>
                {/* Map placeholder */}
                <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(#e2e8f01a_1px,transparent_1px),linear-gradient(90deg,#e2e8f01a_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="text-center z-10">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-1 shadow">
                            <IconPin />
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                            {form.address || 'Bản đồ · Google Maps'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Date & Timeslot */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thời gian có thể thu gom <span className="text-red-400">*</span>
                </label>
                <input type="date" value={form.pickupDate} onChange={set('pickupDate')}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-600" />
                <p className="text-xs text-slate-500 mb-2 font-medium">Khung giờ phù hợp</p>
                <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map(slot => (
                        <button key={slot} onClick={() => setForm(p => ({ ...p, pickupSlot: slot }))}
                            className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${form.pickupSlot === slot
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}>{slot}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Step 3: Xác nhận ───────────────────────────────────────────────────────
const Step3 = ({ selectedTypes, description, form, images }) => {
    const typeLabels = selectedTypes.map(id => WASTE_CATALOGUE.find(w => w.id === id));
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">Kiểm tra lại trước khi gửi yêu cầu đến kho.</p>

            {/* Waste types */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Loại phế liệu ({typeLabels.length})</p>
                <div className="flex flex-wrap gap-2">
                    {typeLabels.map(w => (
                        <span key={w.id} className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">
                            {w.emoji} {w.label}
                        </span>
                    ))}
                </div>
                {description && (
                    <p className="mt-3 text-sm text-slate-500 italic">"{description}"</p>
                )}
            </div>

            {/* Info table */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200">
                {[
                    { label: 'Địa điểm thu gom', value: form.address },
                    { label: 'Ngày thu gom', value: form.pickupDate },
                    { label: 'Khung giờ', value: form.pickupSlot },
                    { label: 'Số ảnh đính kèm', value: `${images.length} ảnh` },
                ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between px-5 py-3.5">
                        <span className="text-sm text-slate-500 w-40 flex-shrink-0">{label}</span>
                        <span className="text-sm font-semibold text-slate-800 text-right">{value || '—'}</span>
                    </div>
                ))}
            </div>

            {/* Images */}
            {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {images.map((img, i) => (
                        <img key={i} src={img.url} alt="" className="w-16 h-16 object-cover rounded-xl border" />
                    ))}
                </div>
            )}

            {/* Note */}
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
                🏭 Sau khi gửi, <strong>nhân viên kho</strong> sẽ liên hệ xác nhận lịch đến cân và thu gom. Bạn sẽ nhận thông báo kết quả cân.
            </div>
        </div>
    );
};

// ── Main ───────────────────────────────────────────────────────────────────
const CreateListing = () => {
    const navigate = useNavigate();
    const fileRef = useRef();
    const [step, setStep] = useState(0);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [form, setForm] = useState({ address: '', pickupDate: '', pickupSlot: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                pickupAddress: form.address,
                city: 'TP. Hồ Chí Minh',
                note: description,
                description: description,
                pickupDate: form.pickupDate,
                pickupSlot: form.pickupSlot,
                items: selectedTypes.map(id => {
                    const w = WASTE_CATALOGUE.find(x => x.id === id);
                    return {
                        materialId: w.id,
                        materialLabel: w.label,
                        materialEmoji: w.emoji
                    };
                })
            };
            
            await sellerService.createRequest(payload);
            alert('Đã gửi yêu cầu! Kho sẽ liên hệ sớm.');
            navigate('/seller/dashboard');
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return selectedTypes.length > 0;
        if (step === 1) return form.address && form.pickupDate && form.pickupSlot;
        return true;
    };

    return (
        <div className="font-sans bg-slate-50 min-h-screen">
            {/* Topbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => step === 0 ? navigate('/seller/dashboard') : setStep(s => s - 1)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                        <IconBack /> {step === 0 ? 'Huỷ' : 'Quay lại'}
                    </button>
                    <span className="text-sm font-extrabold text-slate-800">Đăng bán phế liệu</span>
                    <div className="w-14" />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
                <StepBar current={step} />

                <div className="mb-6">
                    <h1 className="text-xl font-extrabold text-slate-900">
                        {step === 0 && 'Chọn loại phế liệu'}
                        {step === 1 && 'Địa điểm & Thời gian'}
                        {step === 2 && 'Xem lại & Gửi yêu cầu'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">Bước {step + 1} / {STEPS.length}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    {step === 0 && <Step1 selected={selectedTypes} setSelected={setSelectedTypes} description={description} setDescription={setDescription} />}
                    {step === 1 && <Step2 form={form} setForm={setForm} images={images} setImages={setImages} fileRef={fileRef} />}
                    {step === 2 && <Step3 selectedTypes={selectedTypes} description={description} form={form} images={images} />}
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">
                    {step < 2 ? (
                        <>
                            {step > 0 && (
                                <button onClick={() => setStep(s => s - 1)}
                                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
                                    Quay lại
                                </button>
                            )}
                            <button disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${canNext()
                                        ? 'bg-green-700 hover:bg-green-800 text-white shadow-md shadow-green-200 hover:scale-[1.01]'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}>
                                Tiếp theo →
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col w-full gap-3">
                            <button onClick={handleSubmit} disabled={loading}
                                className={`w-full py-4 rounded-xl font-extrabold text-base shadow-md transition-all ${
                                    loading ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white shadow-green-200 hover:scale-[1.01]'
                                }`}>
                                {loading ? 'Đang gửi...' : '📤 Gửi yêu cầu đến Kho'}
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                                    ← Chỉnh sửa
                                </button>
                                <Link to="/seller/dashboard"
                                    className="flex-1 py-3 rounded-xl border border-red-100 text-red-400 font-semibold text-sm hover:bg-red-50 transition-colors text-center">
                                    Huỷ
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CreateListing;
