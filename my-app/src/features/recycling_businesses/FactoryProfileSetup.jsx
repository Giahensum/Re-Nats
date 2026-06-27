import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { factoryService, saveFactoryProfile } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

// ── Danh sách vật liệu theo thực tế Việt Nam ──────────────────────────────────
const MATERIAL_TYPES = [
  { id: 'STEEL',          group: 'KIM LOẠI',   label: 'Sắt thép phế liệu',      sub: 'Thép vụn, thép cuộn, thép tấm', icon: '⚙️',  color: '#64748b' },
  { id: 'ALUMINUM',       group: 'KIM LOẠI',   label: 'Nhôm phế liệu',           sub: 'Lon nhôm, khung nhôm, dây nhôm', icon: '🔩',  color: '#94a3b8' },
  { id: 'COPPER',         group: 'KIM LOẠI',   label: 'Đồng phế liệu',           sub: 'Đồng dây, đồng tấm, cáp đồng',  icon: '🔶',  color: '#b45309' },
  { id: 'LEAD',           group: 'KIM LOẠI',   label: 'Chì / Ắc quy cũ',         sub: 'Ắc quy chì, tấm chì phế liệu',  icon: '🔋',  color: '#374151' },
  { id: 'PET',            group: 'NHỰA',       label: 'Nhựa PET',                sub: 'Chai nhựa trong, PET chai nước', icon: '♻️',  color: '#0284c7' },
  { id: 'HDPE',           group: 'NHỰA',       label: 'Nhựa HDPE',               sub: 'Hộp sữa, thùng nhựa cứng',      icon: '🪣',  color: '#0369a1' },
  { id: 'PP',             group: 'NHỰA',       label: 'Nhựa PP',                 sub: 'Hộp đựng thực phẩm, ống nhựa',  icon: '🛒',  color: '#7c3aed' },
  { id: 'PVC',            group: 'NHỰA',       label: 'Nhựa PVC',                sub: 'Ống nước, thanh nhựa PVC',       icon: '🧱',  color: '#6d28d9' },
  { id: 'CARDBOARD',      group: 'GIẤY',       label: 'Giấy carton / Bìa cứng',  sub: 'Thùng carton, bìa cứng ép kiện', icon: '📦',  color: '#d97706' },
  { id: 'PAPER',          group: 'GIẤY',       label: 'Giấy thải hỗn hợp',       sub: 'Giấy báo, giấy văn phòng',      icon: '📄',  color: '#f59e0b' },
  { id: 'BATTERY',        group: 'PIN / ĐIỆN TỬ', label: 'Pin Lithium / NiMH',   sub: 'Pin điện thoại, pin xe điện',   icon: '⚡',  color: '#059669' },
  { id: 'ELECTRONIC_WASTE', group: 'PIN / ĐIỆN TỬ', label: 'Điện tử phế liệu',  sub: 'Máy tính, bo mạch, linh kiện',  icon: '💻',  color: '#10b981' },
  { id: 'RUBBER',         group: 'KHÁC',       label: 'Cao su phế liệu',         sub: 'Lốp xe cũ, băng tải cao su',    icon: '🛞',  color: '#dc2626' },
  { id: 'OIL',            group: 'KHÁC',       label: 'Dầu nhớt thải',           sub: 'Dầu động cơ, dầu công nghiệp',  icon: '🛢️', color: '#1d4ed8' },
];

const PROVINCES = [
  'TP. Hồ Chí Minh','Hà Nội','Bình Dương','Đồng Nai','Long An',
  'Hải Phòng','Đà Nẵng','Cần Thơ','Bà Rịa - Vũng Tàu','Bình Định',
  'Hưng Yên','Hà Nam','Nam Định','Thái Bình','Nghệ An',
  'Thanh Hóa','Quảng Ngãi','Bình Thuận','Vĩnh Long','An Giang',
];

const STEPS = [
  { label: 'Thông tin doanh nghiệp', icon: 'business' },
  { label: 'Vật liệu tái chế',       icon: 'recycling' },
  { label: 'Giấy tờ chứng nhận',     icon: 'verified_user' },
];

export default function FactoryProfileSetup() {
  const navigate  = useNavigate();
  const toast     = useToast();
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);

  // Step 1
  const [form1, setForm1] = useState({
    companyName: '', taxCode: '', address: '',
    city: '', province: '', industrialZone: '',
    contactPerson: '', contactPhone: '',
    latitude: null, longitude: null,
  });
  const [gpsLoading, setGpsLoading] = useState(false);

  // Step 2
  const [primaryMaterial, setPrimaryMaterial]   = useState('');
  const [acceptedMaterials, setAcceptedMaterials] = useState([]);
  const [capacity, setCapacity]     = useState('');
  const [minPurity, setMinPurity]   = useState('');

  // Step 3
  const [bizFile, setBizFile]         = useState(null);
  const [envFile, setEnvFile]         = useState(null);
  const [bizPreview, setBizPreview]   = useState(null);
  const [envPreview, setEnvPreview]   = useState(null);
  const [bizUrl, setBizUrl]           = useState('');
  const [envUrl, setEnvUrl]           = useState('');
  const [bizLoading, setBizLoading]   = useState(false);
  const [envLoading, setEnvLoading]   = useState(false);
  const bizRef = useRef();
  const envRef = useRef();

  const grouped = MATERIAL_TYPES.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {});

  const toggleAccepted = (id) => {
    if (id === primaryMaterial) return; // Primary already included
    setAcceptedMaterials(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleFileChange = async (e, type) => {
    const targetFiles = e.target.files || (e.dataTransfer && e.dataTransfer.files);
    const file = targetFiles ? targetFiles[0] : null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File vượt quá 10MB'); return; }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    
    if (type === 'biz') {
      setBizFile(file);
      setBizPreview(preview);
      setBizLoading(true);
      try {
        const res = await factoryService.uploadTempDocument(file);
        setBizUrl(res.url);
        toast.success('Upload giấy phép kinh doanh thành công!');
      } catch (err) {
        toast.error('Lỗi upload giấy phép kinh doanh: ' + (err.message || err));
        setBizFile(null);
        setBizPreview(null);
      } finally {
        setBizLoading(false);
      }
    } else {
      setEnvFile(file);
      setEnvPreview(preview);
      setEnvLoading(true);
      try {
        const res = await factoryService.uploadTempDocument(file);
        setEnvUrl(res.url);
        toast.success('Upload giấy phép môi trường thành công!');
      } catch (err) {
        toast.error('Lỗi upload giấy phép môi trường: ' + (err.message || err));
        setEnvFile(null);
        setEnvPreview(null);
      } finally {
        setEnvLoading(false);
      }
    }
  };

  const canGoNext = () => {
    if (step === 0) return form1.companyName.trim() && form1.province;
    if (step === 1) return !!primaryMaterial;
    if (step === 2) return !!bizUrl && !bizLoading && !envLoading;
    return false;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const allMaterials = [primaryMaterial, ...acceptedMaterials.filter(m => m !== primaryMaterial)];
      await factoryService.updateProfile({
        ...form1,
        primaryMaterialType: primaryMaterial,
        acceptedMaterialTypes: allMaterials,
        capacityPerMonthTon: capacity ? parseFloat(capacity) : null,
        minPurityRequired:   minPurity  ? parseFloat(minPurity)  : null,
        latitude:  form1.latitude  ? parseFloat(form1.latitude)  : null,
        longitude: form1.longitude ? parseFloat(form1.longitude) : null,
        businessLicenseUrl: bizUrl,
        environmentLicenseUrl: envUrl,
      });

      // Lấy profile mới nhất từ BE và lưu localStorage
      const freshProfile = await factoryService.getProfile();
      saveFactoryProfile(freshProfile);

      toast.success('🎉 Hoàn thiện hồ sơ nhà máy thành công!');
      navigate('/recycle/dashboard', { replace: true });
    } catch (err) {
      toast.error('Lỗi: ' + (err.message || 'Không thể lưu hồ sơ'));
      setSaving(false);
    }
  };

  const material = MATERIAL_TYPES.find(m => m.id === primaryMaterial);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <style>{`
        .mat-card { transition: all 0.2s; }
        .mat-card:hover { transform: translateY(-2px); }
        .mat-card.selected { box-shadow: 0 0 0 3px var(--mat-color); }
        .upload-zone { border: 2px dashed #334155; transition: border-color 0.2s, background 0.2s; }
        .upload-zone:hover { border-color: #2f7f34; background: rgba(47,127,52,0.05); }
        .upload-zone.has-file { border-color: #2f7f34; background: rgba(47,127,52,0.08); }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeInUp 0.35s ease; }
      `}</style>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.jpg" alt="Re-Nats" className="h-10 w-auto rounded-xl shadow-lg" />
        <div>
          <p className="text-white font-extrabold text-xl leading-none">Re-Nats</p>
          <p className="text-green-400 text-xs mt-0.5">Cổng nhà máy tái chế</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="bg-white/5 px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    i < step  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' :
                    i === step ? 'bg-white text-green-700 shadow-lg ring-2 ring-green-400' :
                                  'bg-white/10 text-white/40'
                  }`}>
                    {i < step
                      ? <span className="material-symbols-outlined text-lg">check</span>
                      : <span className="material-symbols-outlined text-lg">{s.icon}</span>
                    }
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight max-w-[80px] ${
                    i === step ? 'text-white' : i < step ? 'text-green-400' : 'text-white/30'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${i < step ? 'bg-green-500' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="h-px bg-white/10 -mx-8" />
        </div>

        <div className="p-8 fade-up" key={step}>

          {/* ── STEP 0: Thông tin doanh nghiệp ── */}
          {step === 0 && (
            <>
              <h2 className="text-white text-xl font-bold mb-1">Thông tin doanh nghiệp</h2>
              <p className="text-slate-400 text-sm mb-6">Điền đầy đủ để hệ thống xác minh nhà máy của bạn.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'companyName',  label: 'Tên công ty *',       placeholder: 'Công ty TNHH Tái Chế XYZ', full: true },
                  { key: 'taxCode',      label: 'Mã số thuế',          placeholder: '0312345678' },
                  { key: 'contactPerson',label: 'Người đại diện',      placeholder: 'Nguyễn Văn A' },
                  { key: 'contactPhone', label: 'Số điện thoại',       placeholder: '0912345678' },
                  { key: 'industrialZone', label: 'Khu công nghiệp',   placeholder: 'KCN Sóng Thần, Vsip...' },
                ].map(f => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">{f.label}</label>
                    <input
                      value={form1[f.key]}
                      onChange={e => setForm1(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                    />
                  </div>
                ))}

                {/* Address field + GPS button */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 text-xs font-semibold">Địa chỉ nhà máy</label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!navigator.geolocation) { toast.error('Trình duyệt không hỗ trợ GPS'); return; }
                        setGpsLoading(true);
                        navigator.geolocation.getCurrentPosition(
                          async (pos) => {
                            try {
                              const { latitude: lat, longitude: lng } = pos.coords;
                              const res = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
                              );
                              const data = await res.json();
                              const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                              setForm1(p => ({ ...p, address: addr, latitude: lat, longitude: lng }));
                              toast.success('Đã lấy vị trí GPS thành công!');
                            } catch {
                              toast.error('Không thể chuyển GPS sang địa chỉ. Vui lòng nhập thủ công.');
                            } finally { setGpsLoading(false); }
                          },
                          () => { toast.error('Không thể truy cập GPS. Vui lòng cấp quyền vị trí.'); setGpsLoading(false); }
                        );
                      }}
                      disabled={gpsLoading}
                      className="flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs font-bold transition disabled:opacity-50"
                    >
                      {gpsLoading
                        ? <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-sm">my_location</span>
                      }
                      {gpsLoading ? 'Đang lấy...' : 'Lấy GPS'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      value={form1.address}
                      onChange={e => setForm1(p => ({ ...p, address: e.target.value }))}
                      placeholder="Số 1, Đường AB, Phường XY..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                    />
                    {form1.latitude && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold">📍</span>
                    )}
                  </div>
                  {form1.latitude && (
                    <p className="text-green-500 text-xs mt-1">
                      Tọa độ: {Number(form1.latitude).toFixed(5)}, {Number(form1.longitude).toFixed(5)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Tỉnh/Thành phố *</label>
                  <select
                    value={form1.province}
                    onChange={e => setForm1(p => ({ ...p, province: e.target.value, city: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                  >
                    <option value="" className="bg-slate-800">Chọn tỉnh/thành...</option>
                    {PROVINCES.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 1: Vật liệu tái chế ── */}
          {step === 1 && (
            <>
              <h2 className="text-white text-xl font-bold mb-1">Loại vật liệu tái chế</h2>
              <p className="text-slate-400 text-sm mb-5">
                Chọn <strong className="text-green-400">1 loại vật liệu chính</strong> mà nhà máy chuyên tái chế.
                Hệ thống sẽ chỉ hiển thị phế liệu phù hợp từ các vựa.
              </p>
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{group}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map(m => {
                      const isPrimary  = primaryMaterial === m.id;
                      const isSecondary = acceptedMaterials.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className={`mat-card relative rounded-2xl p-3.5 border cursor-pointer select-none ${
                            isPrimary
                              ? 'bg-green-500/15 border-green-400'
                              : isSecondary
                              ? 'bg-white/10 border-white/30'
                              : 'bg-white/5 border-white/10 hover:border-white/30'
                          }`}
                          style={isPrimary ? { '--mat-color': '#22c55e' } : {}}
                          onClick={() => {
                            if (isPrimary) return;
                            setPrimaryMaterial(m.id);
                            setAcceptedMaterials([]);
                          }}
                        >
                          {isPrimary && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">CHÍNH</span>
                          )}
                          <div className="flex items-start gap-3">
                            <span className="text-2xl leading-none mt-0.5">{m.icon}</span>
                            <div className="min-w-0">
                              <p className={`text-sm font-bold leading-tight ${isPrimary ? 'text-green-300' : 'text-white'}`}>{m.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{m.sub}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {primaryMaterial && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Công suất tối đa / tháng (tấn)</label>
                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Ví dụ: 5000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Độ tinh khiết yêu cầu tối thiểu (%)</label>
                    <input type="number" value={minPurity} onChange={e => setMinPurity(e.target.value)} placeholder="Ví dụ: 90"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Giấy tờ ── */}
          {step === 2 && (
            <>
              <h2 className="text-white text-xl font-bold mb-1">Giấy tờ chứng nhận</h2>
              <p className="text-slate-400 text-sm mb-6">
                Upload giấy phép để kích hoạt tài khoản. Hỗ trợ ảnh JPG/PNG hoặc PDF (tối đa 10MB).
              </p>

              {/* Business License */}
              <div className="mb-5">
                <label className="text-slate-300 text-sm font-semibold flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-green-400">badge</span>
                  Giấy phép kinh doanh <span className="text-red-400">*</span>
                </label>
                <div
                  className={`upload-zone rounded-2xl p-6 text-center cursor-pointer ${bizFile ? 'has-file' : ''}`}
                  onClick={() => !bizLoading && bizRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); !bizLoading && handleFileChange({ target: { files: e.dataTransfer.files } }, 'biz'); }}
                >
                  <input ref={bizRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={e => handleFileChange(e, 'biz')} />
                  {bizLoading ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <span className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-green-400 text-sm mt-2 font-semibold animate-pulse">Đang tải lên cloud...</p>
                    </div>
                  ) : (
                    <>
                      {bizPreview
                        ? <img src={bizPreview} alt="preview" className="h-32 mx-auto rounded-xl object-cover mb-2" />
                        : bizFile
                        ? <span className="material-symbols-outlined text-green-400 text-5xl">description</span>
                        : <span className="material-symbols-outlined text-slate-500 text-5xl">upload_file</span>
                      }
                      <p className={`text-sm mt-2 font-medium ${bizFile ? 'text-green-400' : 'text-slate-400'}`}>
                        {bizFile ? bizFile.name : 'Kéo thả hoặc click để chọn file'}
                      </p>
                      {!bizFile && <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP hoặc PDF • Tối đa 10MB</p>}
                    </>
                  )}
                </div>
              </div>
 
              {/* Environment License */}
              <div>
                <label className="text-slate-300 text-sm font-semibold flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-blue-400">eco</span>
                  Giấy phép môi trường <span className="text-slate-500 text-xs font-normal">(không bắt buộc)</span>
                </label>
                <div
                  className={`upload-zone rounded-2xl p-6 text-center cursor-pointer ${envFile ? 'has-file' : ''}`}
                  onClick={() => !envLoading && envRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); !envLoading && handleFileChange({ target: { files: e.dataTransfer.files } }, 'env'); }}
                >
                  <input ref={envRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={e => handleFileChange(e, 'env')} />
                  {envLoading ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <span className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-blue-400 text-sm mt-2 font-semibold animate-pulse">Đang tải lên cloud...</p>
                    </div>
                  ) : (
                    <>
                      {envPreview
                        ? <img src={envPreview} alt="preview" className="h-24 mx-auto rounded-xl object-cover mb-2" />
                        : envFile
                        ? <span className="material-symbols-outlined text-blue-400 text-4xl">description</span>
                        : <span className="material-symbols-outlined text-slate-600 text-4xl">upload_file</span>
                      }
                      <p className={`text-sm mt-1.5 font-medium ${envFile ? 'text-blue-400' : 'text-slate-500'}`}>
                        {envFile ? envFile.name : 'Kéo thả hoặc click để chọn file'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Summary */}
              {primaryMaterial && (
                <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                  <p className="text-green-300 text-xs font-bold uppercase tracking-wide mb-2">Tóm tắt hồ sơ</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{material?.icon}</span>
                    <div>
                      <p className="text-white text-sm font-bold">{material?.label}</p>
                      <p className="text-slate-400 text-xs">{form1.companyName} • {form1.province}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0 || saving}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span> Quay lại
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-green-500/20"
            >
              Tiếp theo <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canGoNext() || saving}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-green-500/20"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">check_circle</span> Hoàn tất & vào hệ thống</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
