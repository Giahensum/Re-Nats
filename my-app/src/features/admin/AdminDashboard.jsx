import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { AvatarDropdown } from '../../components/seller/AvatarDropdown';

// ── Role Configs for Badges ──
const ROLE_BADGES = {
  ADMIN: { label: 'Admin', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DEPOT: { label: 'Kho (Depot)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  FACTORY: { label: 'Nhà máy (Factory)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DRIVER: { label: 'Tài xế (Driver)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SELLER: { label: 'Người bán (Seller)', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

// Helper format date
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
};

// Initial state for user form
const initialFormState = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  role: 'SELLER',
  isActive: true,
  
  // Profile objects
  factoryProfile: {
    companyName: '',
    taxCode: '',
    address: '',
    city: '',
    province: '',
    industrialZone: '',
    capacityPerMonthTon: '',
    minPurityRequired: '',
    isPremium: false,
    premiumExpiresAt: '',
    isProfileComplete: false
  },
  depotProfile: {
    companyName: '',
    taxCode: '',
    address: '',
    city: '',
    province: '',
    reputationScore: 100,
    totalTransactions: 0
  },
  driverProfile: {
    licenseNumber: '',
    vehiclePlate: '',
    vehicleType: '',
    maxCapacityKg: '',
    isAvailable: true
  },
  sellerProfile: {
    defaultAddress: '',
    city: '',
    province: '',
    bio: ''
  }
};

export default function AdminDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users'
  
  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // User List State
  const [users, setUsers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Forms
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Stats
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải số liệu thống kê hệ thống.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Users
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {
        search: searchText,
        role: roleFilter,
        isActive: statusFilter === '' ? null : statusFilter === 'active',
        page: currentPage,
        pageSize: pageSize
      };
      const data = await adminService.getUsers(params);
      setUsers(data.items || []);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, currentPage, roleFilter, statusFilter]);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  // Add User Trigger
  const handleAddUserClick = () => {
    setForm(JSON.parse(JSON.stringify(initialFormState)));
    setModalMode('create');
    setEditingUserId(null);
    setShowModal(true);
  };

  // Edit User Trigger
  const handleEditUserClick = async (userId) => {
    try {
      toast.info('Đang tải thông tin chi tiết...');
      const userDetail = await adminService.getUser(userId);
      
      // Merge with initial state to preserve fields structure
      const preppedForm = {
        email: userDetail.email || '',
        password: '', // Clear password field for security
        fullName: userDetail.fullName || '',
        phone: userDetail.phone || '',
        role: userDetail.role || 'SELLER',
        isActive: userDetail.isActive !== false,
        
        factoryProfile: {
          companyName: userDetail.factoryProfile?.companyName || '',
          taxCode: userDetail.factoryProfile?.taxCode || '',
          address: userDetail.factoryProfile?.address || '',
          city: userDetail.factoryProfile?.city || '',
          province: userDetail.factoryProfile?.province || '',
          industrialZone: userDetail.factoryProfile?.industrialZone || '',
          capacityPerMonthTon: userDetail.factoryProfile?.capacityPerMonthTon || '',
          minPurityRequired: userDetail.factoryProfile?.minPurityRequired || '',
          isPremium: userDetail.factoryProfile?.isPremium || false,
          premiumExpiresAt: userDetail.factoryProfile?.premiumExpiresAt ? userDetail.factoryProfile.premiumExpiresAt.substring(0, 10) : '',
          isProfileComplete: userDetail.factoryProfile?.isProfileComplete || false
        },
        depotProfile: {
          companyName: userDetail.depotProfile?.companyName || '',
          taxCode: userDetail.depotProfile?.taxCode || '',
          address: userDetail.depotProfile?.address || '',
          city: userDetail.depotProfile?.city || '',
          province: userDetail.depotProfile?.province || '',
          reputationScore: userDetail.depotProfile?.reputationScore ?? 100,
          totalTransactions: userDetail.depotProfile?.totalTransactions ?? 0
        },
        driverProfile: {
          licenseNumber: userDetail.driverProfile?.licenseNumber || '',
          vehiclePlate: userDetail.driverProfile?.vehiclePlate || '',
          vehicleType: userDetail.driverProfile?.vehicleType || '',
          maxCapacityKg: userDetail.driverProfile?.maxCapacityKg || '',
          isAvailable: userDetail.driverProfile?.isAvailable !== false
        },
        sellerProfile: {
          defaultAddress: userDetail.sellerProfile?.defaultAddress || '',
          city: userDetail.sellerProfile?.city || '',
          province: userDetail.sellerProfile?.province || '',
          bio: userDetail.sellerProfile?.bio || ''
        }
      };

      setForm(preppedForm);
      setEditingUserId(userId);
      setModalMode('edit');
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải chi tiết người dùng.');
    }
  };

  // Toggle user status direct in table
  const handleToggleStatus = async (user) => {
    try {
      const updatedStatus = !user.isActive;
      // Fetch details first to get profile payload so we don't clear it
      const details = await adminService.getUser(user.id);
      
      const payload = {
        email: details.email,
        fullName: details.fullName,
        phone: details.phone,
        role: details.role,
        isActive: updatedStatus,
        factoryProfile: details.factoryProfile,
        depotProfile: details.depotProfile,
        driverProfile: details.driverProfile,
        sellerProfile: details.sellerProfile
      };

      await adminService.updateUser(user.id, payload);
      toast.success(`Đã ${updatedStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.fullName}`);
      
      // Refresh
      loadUsers();
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật trạng thái người dùng.');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await adminService.deleteUser(userId);
      toast.success('Xóa tài khoản thành công!');
      loadUsers();
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Không thể xóa tài khoản. Thử vô hiệu hóa thay thế.');
    }
  };

  // Submit modal form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Build clean payload depending on role
      const payload = {
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (form.role === 'FACTORY') {
        payload.factoryProfile = {
          ...form.factoryProfile,
          capacityPerMonthTon: form.factoryProfile.capacityPerMonthTon ? parseFloat(form.factoryProfile.capacityPerMonthTon) : null,
          minPurityRequired: form.factoryProfile.minPurityRequired ? parseFloat(form.factoryProfile.minPurityRequired) : null,
          premiumExpiresAt: form.factoryProfile.premiumExpiresAt ? new Date(form.factoryProfile.premiumExpiresAt).toISOString() : null
        };
      } else if (form.role === 'DEPOT') {
        payload.depotProfile = {
          ...form.depotProfile,
          reputationScore: parseInt(form.depotProfile.reputationScore),
          totalTransactions: parseInt(form.depotProfile.totalTransactions)
        };
      } else if (form.role === 'DRIVER') {
        payload.driverProfile = {
          ...form.driverProfile,
          maxCapacityKg: form.driverProfile.maxCapacityKg ? parseFloat(form.driverProfile.maxCapacityKg) : null
        };
      } else if (form.role === 'SELLER') {
        payload.sellerProfile = form.sellerProfile;
      }

      if (modalMode === 'create') {
        await adminService.createUser(payload);
        toast.success('Tạo người dùng mới thành công!');
      } else {
        await adminService.updateUser(editingUserId, payload);
        toast.success('Cập nhật người dùng thành công!');
      }
      
      setShowModal(false);
      loadUsers();
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi gửi dữ liệu lên server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle generic inputs
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle profile sub-inputs
  const handleProfileInputChange = (profileType, field, value) => {
    setForm(prev => ({
      ...prev,
      [profileType]: {
        ...prev[profileType],
        [field]: value
      }
    }));
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="font-sans bg-slate-50 min-h-screen flex">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <img src="/logo.jpg" alt="Re-Nats" className="h-8 w-8 rounded-lg object-cover" />
          <div>
            <p className="text-sm font-extrabold tracking-tight">Re-Nats</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hệ thống Admin</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-green-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Tổng quan hệ thống
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-green-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A9.342 9.342 0 0012.5 20c.422.062.852.094 1.288.094a9.38 9.38 0 002.625-.372M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quản lý người dùng
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-3 text-center border border-slate-800">
            <p className="text-xs text-slate-500 font-bold">Phiên bản hiện tại</p>
            <p className="text-sm font-extrabold text-slate-300 mt-0.5">v2.4.0-admin</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="md:hidden text-2xl">⚙️</span>
              {activeTab === 'overview' ? 'Tổng quan hệ thống Re-Nats' : 'Quản lý tài khoản & phân quyền'}
            </h1>
            <div className="flex items-center gap-3">
              {/* Quick Mobile Tab toggles */}
              <div className="flex md:hidden border rounded-xl overflow-hidden mr-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 text-xs font-bold ${activeTab === 'overview' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                >
                  Tổng quan
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 text-xs font-bold ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                >
                  Người dùng
                </button>
              </div>
              <AvatarDropdown />
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Introduction Card */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                <div className="relative z-10">
                  <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Hệ thống live</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">Chào mừng Admin Re-Nats! 🚀</h2>
                  <p className="text-slate-300 mt-2 text-sm md:text-base max-w-xl">Đây là bảng điều khiển hệ thống thu gom và tái chế phế liệu tuần hoàn. Bạn có quyền tạo mới, cấp quyền và quản lý tài khoản của tất cả các bên tham gia chuỗi cung ứng.</p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="relative z-10 flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3.5 rounded-2xl font-extrabold text-base shadow-lg transition-all hover:scale-[1.03]"
                >
                  Quản lý người dùng ngay &rarr;
                </button>
              </div>

              {/* Stats Loading State */}
              {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse h-32" />
                  ))}
                </div>
              ) : (
                <>
                  {/* High level Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng người dùng</p>
                      <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.totalUsers || 0}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{stats?.activeUsers || 0} Hoạt động</span>
                        <span className="text-slate-300">|</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span>{stats?.inactiveUsers || 0} Bị khóa</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đối tác sản xuất</p>
                      <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.totalFactories || 0}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                        👑 {stats?.premiumFactories || 0} tài khoản Premium VIP
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm thu gom (Depots)</p>
                      <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.totalDepots || 0}</h3>
                      <p className="text-xs text-slate-400 mt-2">Tổng kho trung chuyển phế liệu</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logistics & Vận chuyển</p>
                      <h3 className="text-4xl font-black text-slate-800 mt-2">{stats?.totalDrivers || 0}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-indigo-600">
                        🚙 Tải xế / Hãng xe đối tác
                      </div>
                    </div>
                  </div>

                  {/* Role Distribution Block */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                      <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
                        📊 Cơ cấu tài khoản hệ thống
                      </h3>
                      <div className="space-y-4">
                        {[
                          { key: 'SELLER', name: 'Người bán cá nhân (Sellers)', color: 'bg-slate-400' },
                          { key: 'FACTORY', name: 'Nhà máy tái chế (Factories)', color: 'bg-amber-400' },
                          { key: 'DEPOT', name: 'Điểm gom hàng (Depots)', color: 'bg-emerald-500' },
                          { key: 'DRIVER', name: 'Tài xế vận chuyển (Drivers)', color: 'bg-purple-500' },
                          { key: 'ADMIN', name: 'Quản trị viên hệ thống (Admins)', color: 'bg-blue-600' }
                        ].map(r => {
                          const count = stats?.rolesCount?.[r.key] || 0;
                          const pct = stats?.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
                          return (
                            <div key={r.key} className="space-y-1.5">
                              <div className="flex justify-between items-center text-sm font-semibold">
                                <span className="text-slate-600">{r.name}</span>
                                <span className="text-slate-800">{count} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className={`${r.color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base mb-2">Thông tin vận hành 💡</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Tất cả các tài khoản khi đăng ký đều thuộc về các nhóm nghiệp vụ cụ thể. Nhà máy VIP hoặc Điểm thu gom cần được kích hoạt/bảo dưỡng uy tín định kỳ.
                        </p>
                      </div>
                      <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold">Người bán phế liệu:</span>
                          <span className="font-semibold text-slate-800">{stats?.totalSellers || 0} tài khoản</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold">Hội viên Premium VIP:</span>
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{stats?.premiumFactories || 0} hội viên</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold">Độ sẵn sàng tài xế:</span>
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Đang kết nối live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT (CRUD) */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
              {/* Top controls: Filter & Add */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <form onSubmit={handleSearch} className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px] flex-1">
                    <input
                      type="text"
                      placeholder="Tìm theo Tên, Email hoặc Số điện thoại..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                    />
                  </div>
                  
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
                  >
                    <option value="">Tất cả Vai trò</option>
                    <option value="ADMIN">Admin</option>
                    <option value="DEPOT">Điểm thu gom</option>
                    <option value="FACTORY">Nhà máy tái chế</option>
                    <option value="DRIVER">Tài xế vận chuyển</option>
                    <option value="SELLER">Người bán</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer"
                  >
                    <option value="">Tất cả Trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã khóa</option>
                  </select>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow transition-all cursor-pointer"
                  >
                    Lọc kết quả
                  </button>
                </form>

                <button
                  onClick={handleAddUserClick}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-black shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Thêm người dùng mới
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Họ và tên</th>
                      <th className="px-6 py-4">Email / Số điện thoại</th>
                      <th className="px-6 py-4">Vai trò</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4 text-center">Trạng thái hoạt động</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {usersLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-20 text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="w-8 h-8 rounded-full border-4 border-green-700 border-t-transparent animate-spin" />
                            <span>Đang tải danh sách người dùng...</span>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-20 text-slate-400 font-bold text-base">
                          🔎 Không tìm thấy tài khoản người dùng nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      users.map(u => {
                        const badge = ROLE_BADGES[u.role] || ROLE_BADGES.SELLER;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/55 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-slate-800">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{u.id}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-700">{u.email}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{u.phone || '—'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={u.isActive}
                                    onChange={() => handleToggleStatus(u)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  onClick={() => handleEditUserClick(u.id)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.fullName)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Xóa tài khoản"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500 font-medium">
                    Đang hiển thị trang <strong className="text-slate-800">{currentPage}</strong> trên <strong className="text-slate-800">{totalPages}</strong> trang ({totalItems} kết quả)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                    >
                      Trang trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── CREATE / EDIT USER MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800">
                {modalMode === 'create' ? '✨ Tạo tài khoản người dùng mới' : '⚙️ Chỉnh sửa thông tin tài khoản'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 p-6 space-y-6">
              {/* Section 1: Core Account Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">1. Thông tin tài khoản chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Họ và tên *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={form.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                      placeholder="Ví dụ: Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Email đăng nhập *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                      placeholder="email@domain.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">
                      Mật khẩu {modalMode === 'create' ? '*' : '(để trống nếu không đổi)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={modalMode === 'create'}
                      value={form.password}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                      placeholder="Ít nhất 6 ký tự"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                      placeholder="Số điện thoại liên hệ"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Vai trò hệ thống</label>
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white cursor-pointer"
                    >
                      <option value="SELLER">Người bán (Seller)</option>
                      <option value="DEPOT">Điểm gom hàng (Depot)</option>
                      <option value="FACTORY">Nhà máy tái chế (Factory)</option>
                      <option value="DRIVER">Tài xế vận chuyển (Driver)</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="formActive"
                      checked={form.isActive}
                      onChange={handleInputChange}
                      className="h-4.5 w-4.5 accent-green-600 rounded cursor-pointer"
                    />
                    <label htmlFor="formActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Kích hoạt tài khoản này
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Role Specific Dynamic Fields */}
              <div className="border-t border-slate-100 pt-6">
                {form.role === 'FACTORY' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-amber-700 uppercase tracking-wider">2. Thông tin hồ sơ Nhà Máy Tái Chế</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tên công ty / Doanh nghiệp *</label>
                        <input
                          type="text"
                          required
                          value={form.factoryProfile.companyName}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'companyName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Công ty TNHH Tái chế..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Mã số thuế</label>
                        <input
                          type="text"
                          value={form.factoryProfile.taxCode || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'taxCode', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Địa chỉ nhà máy</label>
                        <input
                          type="text"
                          value={form.factoryProfile.address || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'address', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Thành phố</label>
                        <input
                          type="text"
                          value={form.factoryProfile.city || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'city', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tỉnh thành</label>
                        <input
                          type="text"
                          value={form.factoryProfile.province || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'province', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Khu công nghiệp</label>
                        <input
                          type="text"
                          value={form.factoryProfile.industrialZone || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'industrialZone', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Công suất/Tháng (Tấn)</label>
                        <input
                          type="number"
                          value={form.factoryProfile.capacityPerMonthTon || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'capacityPerMonthTon', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Độ tinh khiết tối thiểu (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form.factoryProfile.minPurityRequired || ''}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'minPurityRequired', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="relative inline-flex items-center cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={form.factoryProfile.isPremium}
                            onChange={(e) => handleProfileInputChange('factoryProfile', 'isPremium', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          <span className="ml-3 text-sm font-bold text-slate-700">Tài khoản Premium VIP</span>
                        </label>
                      </div>
                      {form.factoryProfile.isPremium && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5">Hạn Premium VIP</label>
                          <input
                            type="date"
                            value={form.factoryProfile.premiumExpiresAt || ''}
                            onChange={(e) => handleProfileInputChange('factoryProfile', 'premiumExpiresAt', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white cursor-pointer"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id="profileComplete"
                          checked={form.factoryProfile.isProfileComplete}
                          onChange={(e) => handleProfileInputChange('factoryProfile', 'isProfileComplete', e.target.checked)}
                          className="h-4.5 w-4.5 accent-green-600 rounded cursor-pointer"
                        />
                        <label htmlFor="profileComplete" className="text-sm font-bold text-slate-700 cursor-pointer">
                          Đã hoàn thành xác minh giấy phép hồ sơ
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'DEPOT' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">2. Thông tin hồ sơ Điểm Thu Gom</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tên công ty / Kho thu mua *</label>
                        <input
                          type="text"
                          required
                          value={form.depotProfile.companyName}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'companyName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Kho phế liệu Re-Nats..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Mã số thuế</label>
                        <input
                          type="text"
                          value={form.depotProfile.taxCode || ''}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'taxCode', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Địa chỉ kho hàng</label>
                        <input
                          type="text"
                          value={form.depotProfile.address || ''}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'address', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Thành phố</label>
                        <input
                          type="text"
                          value={form.depotProfile.city || ''}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'city', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tỉnh thành</label>
                        <input
                          type="text"
                          value={form.depotProfile.province || ''}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'province', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Điểm đánh giá uy tín (Reputation Score)</label>
                        <input
                          type="number"
                          value={form.depotProfile.reputationScore}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'reputationScore', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tổng số giao dịch</label>
                        <input
                          type="number"
                          value={form.depotProfile.totalTransactions}
                          onChange={(e) => handleProfileInputChange('depotProfile', 'totalTransactions', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'DRIVER' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-purple-700 uppercase tracking-wider">2. Thông tin hồ sơ Tài Xế Logistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Số bằng lái xe (License Number)</label>
                        <input
                          type="text"
                          value={form.driverProfile.licenseNumber || ''}
                          onChange={(e) => handleProfileInputChange('driverProfile', 'licenseNumber', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Biển số xe (Vehicle Plate)</label>
                        <input
                          type="text"
                          value={form.driverProfile.vehiclePlate || ''}
                          onChange={(e) => handleProfileInputChange('driverProfile', 'vehiclePlate', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Ví dụ: 29A-12345"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Loại phương tiện / Tải trọng xe</label>
                        <input
                          type="text"
                          value={form.driverProfile.vehicleType || ''}
                          onChange={(e) => handleProfileInputChange('driverProfile', 'vehicleType', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Ví dụ: Xe tải 2 tấn, Xe ba gác..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Khả năng chuyên chở tối đa (Kg)</label>
                        <input
                          type="number"
                          value={form.driverProfile.maxCapacityKg || ''}
                          onChange={(e) => handleProfileInputChange('driverProfile', 'maxCapacityKg', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Tải trọng tính bằng kg"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="driverAvailable"
                          checked={form.driverProfile.isAvailable}
                          onChange={(e) => handleProfileInputChange('driverProfile', 'isAvailable', e.target.checked)}
                          className="h-4.5 w-4.5 accent-green-600 rounded cursor-pointer"
                        />
                        <label htmlFor="driverAvailable" className="text-sm font-bold text-slate-700 cursor-pointer">
                          Tài xế sẵn sàng nhận đơn vận chuyển
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'SELLER' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">2. Thông tin hồ sơ Người Bán Phế Liệu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Địa chỉ giao hàng mặc định</label>
                        <input
                          type="text"
                          value={form.sellerProfile.defaultAddress || ''}
                          onChange={(e) => handleProfileInputChange('sellerProfile', 'defaultAddress', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                          placeholder="Địa chỉ bàn giao phế liệu..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Thành phố</label>
                        <input
                          type="text"
                          value={form.sellerProfile.city || ''}
                          onChange={(e) => handleProfileInputChange('sellerProfile', 'city', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Tỉnh thành</label>
                        <input
                          type="text"
                          value={form.sellerProfile.province || ''}
                          onChange={(e) => handleProfileInputChange('sellerProfile', 'province', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Mô tả / Giới thiệu</label>
                        <textarea
                          rows="3"
                          value={form.sellerProfile.bio || ''}
                          onChange={(e) => handleProfileInputChange('sellerProfile', 'bio', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white resize-none"
                          placeholder="Nhập thông tin giới thiệu ngắn về người bán..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {form.role === 'ADMIN' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-500 text-center font-medium">
                    🧑‍💼 Tài khoản Quản Trị Viên (Admin) không yêu cầu thông tin hồ sơ nghiệp vụ bổ sung.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-black shadow-lg transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
