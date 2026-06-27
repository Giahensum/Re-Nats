import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

const PartnerList = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [depots, setDepots] = useState([]);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const loadPartners = async () => {
            setLoading(true);
            try {
                const res = await factoryService.getPartners();
                setIsPremium(res.isPremium || false);
                setDepots(res.data || []);
            } catch (err) {
                console.error('Error fetching partners:', err);
                toast.error('Không thể tải danh sách đối tác từ máy chủ!');
                setIsPremium(false);
                setDepots([]);
            } finally {
                setLoading(false);
            }
        };
        loadPartners();
    }, [toast]);

    const filtered = depots.filter(d =>
        d.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (d.city || '').toLowerCase().includes(search.toLowerCase())
    );

    const avatarColors = ['blue', 'purple', 'green', 'red', 'indigo', 'teal', 'pink', 'cyan', 'orange', 'rose'];

    return (
        <div className="font-sans text-slate-900 overflow-x-hidden bg-slate-50 min-h-screen">
            <style>{`.locked-blur { filter: blur(6px); user-select: none; pointer-events: none; }`}</style>

            <HeaderDoanhNghiep activeTab="partners" />

            <section className="relative py-12 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">

                    {/* Page Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">
                                Danh bạ Đại lý Uy tín
                                {isPremium && (
                                    <span className="ml-3 text-base font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        Premium
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 mt-2">Danh sách các đại lý tái chế được xác thực bởi Re-Nats.</p>
                        </div>

                        {isPremium ? (
                            <div className="flex space-x-3">
                                <div className="relative">
                                    <input
                                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-primary focus:border-primary w-64"
                                        placeholder="Tìm kiếm đại lý..."
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                                </div>
                                <button className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium flex items-center transition-colors">
                                    <span className="material-symbols-outlined mr-2 text-lg">download</span>Xuất Excel
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-3 opacity-50">
                                <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium">Bộ lọc</button>
                                <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium">Xuất Excel</button>
                            </div>
                        )}
                    </div>

                    {/* Loading state */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                            <p className="text-slate-500 font-medium">Đang tải danh sách đối tác...</p>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!isPremium ? 'locked-blur' : ''}`}>
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Tên Kho Vựa</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Địa chỉ</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Tổng giao dịch</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Phân hạng</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Liên hệ</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider" scope="col">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {filtered.map((depot, i) => {
                                            const color = avatarColors[i % avatarColors.length];
                                            const initial = depot.companyName.charAt(0).toUpperCase();
                                            const score = isPremium && depot.reputationScore != null ? depot.reputationScore : null;
                                            const scoreColor = score >= 90 ? 'green' : score >= 75 ? 'orange' : 'red';
                                            return (
                                                <tr key={depot.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className={`h-10 w-10 flex-shrink-0 rounded-full bg-${color}-100 flex items-center justify-center text-${color}-600 font-bold shadow-sm border border-${color}-200`}>
                                                                {initial}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-bold text-slate-900">{depot.companyName}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-slate-600 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px] text-slate-400">location_on</span>
                                                            {depot.city}, {depot.province}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-sm font-semibold text-slate-700">{depot.totalTransactions} đơn</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {score != null ? (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-${scoreColor}-100 text-${scoreColor}-700 border border-${scoreColor}-200`}>
                                                                {score >= 90 ? 'Xuất sắc' : score >= 75 ? 'Đạt chuẩn' : 'Cần lưu ý'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">
                                                                <span className="material-symbols-outlined text-sm">lock</span> Premium
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {isPremium && depot.contactPerson ? (
                                                            <div>
                                                                <p className="text-xs font-semibold text-slate-700">{depot.contactPerson}</p>
                                                                <p className="text-xs text-slate-500">{depot.contactPhone}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">lock</span> Ẩn
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => navigate(`/nha-may/doi-tac/${depot.id}`)}
                                                            className="text-primary hover:text-secondary bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors"
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filtered.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                    Không tìm thấy đại lý nào phù hợp.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (chỉ khi premium) */}
                            {isPremium && filtered.length > 0 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-slate-500">Hiển thị {filtered.length} đại lý</div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Lock Overlay – chỉ hiện khi chưa Premium */}
                {!loading && !isPremium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-green-300"></div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-50 rounded-full opacity-50 blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 blur-2xl"></div>

                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <span className="material-symbols-outlined text-4xl text-primary">lock</span>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                                Mở khóa danh sách <span className="text-primary">Đại lý Uy tín</span>
                            </h2>
                            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                                Tiết kiệm hàng triệu đồng nhờ tránh được phế liệu lẫn tạp chất. <br />
                                Truy cập toàn bộ đại lý có Điểm Tin cậy cao.
                            </p>
                            <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                                <li className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-green-500 mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Điểm uy tín + lịch sử hoạt động đã xác minh</span>
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-green-500 mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Thông tin liên hệ trực tiếp (tên & số điện thoại)</span>
                                </li>
                                <li className="flex items-center text-slate-700">
                                    <span className="material-symbols-outlined text-green-500 mr-3 text-xl">check_circle</span>
                                    <span className="font-medium">Xem lịch sử giao dịch chi tiết từng lô hàng</span>
                                </li>
                            </ul>
                            <button
                                onClick={() => navigate('/nha-may/premium')}
                                className="w-full sm:w-auto bg-primary hover:bg-secondary text-white text-lg font-bold py-4 px-10 rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-1"
                            >
                                Mua gói Premium
                            </button>
                            <p className="mt-4 text-xs text-slate-400">Thanh toán an toàn • Hủy bất kỳ lúc nào</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default PartnerList;
