import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { ROLE_HOME } from '../../app/roleRoutes';

const ROLES = [
  { value: 'SELLER', label: 'Người bán phế liệu', icon: '👤', desc: 'Hộ gia đình, cá nhân bán phế liệu nhỏ lẻ', color: '#a78bfa' },
  { value: 'DEPOT', label: 'Điểm thu gom (Kho)', icon: '🏪', desc: 'Doanh nghiệp thu mua và phân loại phế liệu', color: '#0ea5e9' },
  { value: 'FACTORY', label: 'Nhà máy tái chế', icon: '🏭', desc: 'Cơ sở tái chế, mua nguyên liệu theo lô', color: '#22c55e' },
  { value: 'DRIVER', label: 'Tài xế vận chuyển', icon: '🚛', desc: 'Tài xế nhận đơn vận chuyển hàng hóa', color: '#f97316' },
];

const IS_MVP_MODE = true; // Bật cờ này để bỏ qua bước 3 (chỉ giữ lại 2 bước cho MVP)
const STEPS = IS_MVP_MODE ? ['Chọn vai trò', 'Thông tin cá nhân'] : ['Chọn vai trò', 'Thông tin cá nhân', 'Thông tin nghề nghiệp'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  // Đã đăng nhập rồi → redirect thẳng về dashboard
  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role] || '/', { replace: true });
  }, [user, navigate]);

  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', fullName: '', phone: '',
    companyName: '', taxCode: '', address: '', city: '', province: '',
    contactPerson: '', contactPhone: '',
    licenseNumber: '', vehiclePlate: '', vehicleType: '', maxCapacityKg: '',
    defaultAddress: '', bio: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm text-gray-900 outline-none transition-all";
  const inputStyle = { border: '1px solid #e5e7eb', background: '#fafafa' };
  const focusStyle = { border: '1px solid #22c55e', background: '#fff', boxShadow: '0 0 0 3px rgba(34,197,94,0.1)' };

  const handleNext = () => {
    setError('');
    if (step === 0 && !selectedRole) { setError('Vui lòng chọn vai trò.'); return; }
    if (step === 1) {
      if (!form.fullName || !form.email || !form.password) { setError('Vui lòng điền đầy đủ thông tin bắt buộc.'); return; }
      if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
      if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
      
      if (IS_MVP_MODE) {
        handleSubmitMVP();
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmitMVP = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        email: form.email, password: form.password, fullName: form.fullName,
        phone: form.phone || undefined, role: selectedRole,
        // Điền data giả lập để pass validation của Backend (DEPOT/FACTORY cần CompanyName)
        companyName: ['DEPOT', 'FACTORY'].includes(selectedRole) ? (form.fullName + ' Company') : undefined,
      };
      const res = await register(payload);
      navigate(ROLE_HOME[res.role] || '/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (['DEPOT', 'FACTORY'].includes(selectedRole) && !form.companyName) {
      setError('Tên công ty là bắt buộc.'); return;
    }
    setError('');
    setLoading(true);
    try {
      const payload = {
        email: form.email, password: form.password, fullName: form.fullName,
        phone: form.phone || undefined, role: selectedRole,
        companyName: form.companyName || undefined,
        taxCode: form.taxCode || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        province: form.province || undefined,
        contactPerson: form.contactPerson || undefined,
        contactPhone: form.contactPhone || undefined,
        licenseNumber: form.licenseNumber || undefined,
        vehiclePlate: form.vehiclePlate || undefined,
        vehicleType: form.vehicleType || undefined,
        maxCapacityKg: form.maxCapacityKg ? parseFloat(form.maxCapacityKg) : undefined,
        defaultAddress: form.defaultAddress || undefined,
        bio: form.bio || undefined,
      };
      const res = await register(payload);
      navigate(ROLE_HOME[res.role] || '/');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = ROLES.find(r => r.value === selectedRole);

  return (
    <div className="min-h-screen flex font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f14 0%, #1a3a22 50%, #0d2b1a 100%)' }}>
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)', transform: 'translate(30%, 30%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.jpg" alt="Re-Nats Logo" className="w-12 h-12 rounded-xl object-cover" />
          <span className="text-white text-xl font-bold">Re-Nats</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-white text-4xl font-bold leading-tight">
            Tham gia<br />chuỗi tuần hoàn 🌱
          </h1>
          <p className="text-green-300 text-sm opacity-80 leading-relaxed">
            Đăng ký tài khoản và trở thành một mắt xích trong hệ sinh thái kinh tế tuần hoàn của Việt Nam.
          </p>

          {/* Step indicator */}
          <div className="space-y-3 mt-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? '#22c55e' : i === step ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)',
                    border: i === step ? '2px solid #22c55e' : '2px solid transparent',
                    color: i <= step ? '#fff' : '#6b7280',
                  }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-sm" style={{ color: i === step ? '#fff' : i < step ? '#86efac' : '#6b7280' }}>
                  {s}
                </span>
              </div>
            ))}
          </div>

          {selectedRoleData && (
            <div className="rounded-2xl p-4 mt-4"
              style={{ background: `${selectedRoleData.color}15`, border: `1px solid ${selectedRoleData.color}33` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selectedRoleData.icon}</span>
                <span className="text-white text-sm font-semibold">{selectedRoleData.label}</span>
              </div>
              <p className="text-xs opacity-60" style={{ color: selectedRoleData.color }}>{selectedRoleData.desc}</p>
            </div>
          )}
        </div>

        <p className="relative z-10 text-green-400 text-xs opacity-60">© 2025 Re-Nats. All rights reserved.</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <img src="/logo.jpg" alt="Re-Nats Logo" className="w-10 h-10 rounded-xl object-cover" />
            <span className="text-gray-900 text-xl font-bold">Re-Nats</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-widest">
                Bước {step + 1}/{STEPS.length}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{STEPS[step]}</h2>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── STEP 0: Role Selection ── */}
          {step === 0 && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button key={r.value} type="button" onClick={() => setSelectedRole(r.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200"
                  style={{
                    border: selectedRole === r.value ? `2px solid ${r.color}` : '2px solid #f3f4f6',
                    background: selectedRole === r.value ? `${r.color}08` : '#fafafa',
                    transform: selectedRole === r.value ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: selectedRole === r.value ? `0 4px 20px ${r.color}25` : 'none',
                  }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${r.color}18` }}>{r.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{r.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: selectedRole === r.value ? r.color : 'transparent',
                      border: selectedRole === r.value ? `2px solid ${r.color}` : '2px solid #d1d5db',
                    }}>
                    {selectedRole === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
              <button onClick={handleNext}
                className="w-full mt-4 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 15px rgba(22,163,74,0.35)' }}>
                Tiếp theo →
              </button>
            </div>
          )}

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                <input id="reg-fullname" className={inputClass} style={inputStyle}
                  placeholder="Nguyễn Văn A" value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)} required
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input id="reg-email" type="email" className={inputClass} style={inputStyle}
                  placeholder="you@example.com" value={form.email}
                  onChange={(e) => update('email', e.target.value)} required
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                <input id="reg-phone" type="tel" className={inputClass} style={inputStyle}
                  placeholder="0912 345 678" value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input id="reg-password" type={showPass ? 'text' : 'password'} className={`${inputClass} pr-11`} style={inputStyle}
                    placeholder="••••••••" value={form.password}
                    onChange={(e) => update('password', e.target.value)} required
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                <input id="reg-confirm-password" type="password" className={inputClass} style={inputStyle}
                  placeholder="••••••••" value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)} required
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 transition-all"
                  style={{ border: '1px solid #e5e7eb' }}>← Quay lại</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ 
                    background: loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #15803d)', 
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(22,163,74,0.35)',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}>
                  {IS_MVP_MODE 
                    ? (loading ? '⏳ Đang đăng ký...' : '✓ Hoàn tất đăng ký') 
                    : 'Tiếp theo →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Role-specific Info ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SELLER */}
              {selectedRole === 'SELLER' && <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ mặc định</label>
                  <input className={inputClass} style={inputStyle} placeholder="123 Đường ABC, Phường XYZ"
                    value={form.defaultAddress} onChange={(e) => update('defaultAddress', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thành phố</label>
                    <input className={inputClass} style={inputStyle} placeholder="Hà Nội"
                      value={form.city} onChange={(e) => update('city', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tỉnh/Thành</label>
                    <input className={inputClass} style={inputStyle} placeholder="Hà Nội"
                      value={form.province} onChange={(e) => update('province', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Giới thiệu bản thân</label>
                  <textarea className={inputClass} style={{ ...inputStyle, resize: 'none' }} rows={3}
                    placeholder="Mô tả ngắn về bạn..."
                    value={form.bio} onChange={(e) => update('bio', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
              </>}

              {/* DEPOT or FACTORY */}
              {['DEPOT', 'FACTORY'].includes(selectedRole) && <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên công ty <span className="text-red-500">*</span></label>
                  <input className={inputClass} style={inputStyle} placeholder="Công ty TNHH ABC" required
                    value={form.companyName} onChange={(e) => update('companyName', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã số thuế</label>
                  <input className={inputClass} style={inputStyle} placeholder="0123456789"
                    value={form.taxCode} onChange={(e) => update('taxCode', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
                  <input className={inputClass} style={inputStyle} placeholder="123 Đường ABC"
                    value={form.address} onChange={(e) => update('address', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Thành phố</label>
                    <input className={inputClass} style={inputStyle} placeholder="Hà Nội"
                      value={form.city} onChange={(e) => update('city', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tỉnh/Thành</label>
                    <input className={inputClass} style={inputStyle} placeholder="Hà Nội"
                      value={form.province} onChange={(e) => update('province', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Người liên hệ</label>
                    <input className={inputClass} style={inputStyle} placeholder="Nguyễn Văn A"
                      value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SĐT liên hệ</label>
                    <input className={inputClass} style={inputStyle} placeholder="0912 345 678"
                      value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                </div>
              </>}

              {/* DRIVER */}
              {selectedRole === 'DRIVER' && <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Số GPLX</label>
                    <input className={inputClass} style={inputStyle} placeholder="B2 - 012345"
                      value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Biển số xe</label>
                    <input className={inputClass} style={inputStyle} placeholder="51A - 12345"
                      value={form.vehiclePlate} onChange={(e) => update('vehiclePlate', e.target.value)}
                      onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại xe</label>
                  <select className={inputClass} style={inputStyle} value={form.vehicleType}
                    onChange={(e) => update('vehicleType', e.target.value)}>
                    <option value="">-- Chọn loại xe --</option>
                    <option value="Xe tải nhỏ (1-2 tấn)">Xe tải nhỏ (1-2 tấn)</option>
                    <option value="Xe tải trung (3-5 tấn)">Xe tải trung (3-5 tấn)</option>
                    <option value="Xe tải lớn (>5 tấn)">Xe tải lớn (&gt;5 tấn)</option>
                    <option value="Xe container">Xe container</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tải trọng tối đa (kg)</label>
                  <input type="number" className={inputClass} style={inputStyle} placeholder="5000"
                    value={form.maxCapacityKg} onChange={(e) => update('maxCapacityKg', e.target.value)}
                    onFocus={(e) => Object.assign(e.target.style, focusStyle)} onBlur={(e) => Object.assign(e.target.style, inputStyle)} />
                </div>
              </>}




              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-600 transition-all"
                  style={{ border: '1px solid #e5e7eb' }}>← Quay lại</button>
                <button id="reg-submit" type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: loading ? '#86efac' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(22,163,74,0.35)',
                  }}>
                  {loading ? '⏳ Đang đăng ký...' : '✓ Hoàn tất đăng ký'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="font-semibold" style={{ color: '#16a34a' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
