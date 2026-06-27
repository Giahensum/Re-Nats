import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';

const EprReport = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('ALL');
    const [selectedMaterial, setSelectedMaterial] = useState('ALL');
    const [selectedDepot, setSelectedDepot] = useState('ALL');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            factoryService.getOrders('VERIFIED'),
            factoryService.getOrders('COMPLETED')
        ]).then(([verified, completed]) => {
            const list = [...(verified || []), ...(completed || [])];
            list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(list);
            setLoading(false);
        }).catch(err => {
            console.error('Error fetching EPR orders:', err);
            setLoading(false);
        });
    }, []);

    // Filter logic
    const getFilteredOrders = () => {
        return orders.filter(o => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesId = o.id.toLowerCase().includes(q);
                const matchesBatch = o.batchCode?.toLowerCase().includes(q);
                if (!matchesId && !matchesBatch) return false;
            }
            if (selectedMonth !== 'ALL') {
                const monthYear = new Date(o.createdAt).toLocaleString('vi-VN', { month: '2-digit', year: 'numeric' });
                if (monthYear !== selectedMonth) return false;
            }
            if (selectedMaterial !== 'ALL') {
                if (o.materialType !== selectedMaterial) return false;
            }
            if (selectedDepot !== 'ALL') {
                if (o.depotName !== selectedDepot) return false;
            }
            return true;
        });
    };

    const filteredOrders = getFilteredOrders();

    // Unique options for dropdowns
    const uniqueMonths = [...new Set(orders.map(o => new Date(o.createdAt).toLocaleString('vi-VN', { month: '2-digit', year: 'numeric' })))];
    const uniqueMaterials = [...new Set(orders.map(o => o.materialType))];
    const uniqueDepots = [...new Set(orders.map(o => o.depotName))];

    // Compute stats
    const totalWeightKg = filteredOrders.reduce((sum, o) => sum + (o.netWeight || 0), 0);
    const totalAmountVnd = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    return (
        <div className="font-sans text-slate-900 overflow-x-hidden bg-slate-50">
            <style>{`
        .hero-mesh-gradient {
          background-color: #f8fafc;
          background-image:
            radial-gradient(at 0% 0%, hsla(142, 46%, 34%, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(199, 89%, 48%, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(142, 46%, 34%, 0.05) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(199, 89%, 48%, 0.1) 0px, transparent 50%);
        }
      `}</style>

            {/* Redesigned Unified Header */}
            <HeaderDoanhNghiep activeTab="report" />

            {/* Main */}
            <main className="min-h-screen pb-20">
                {/* Page Hero */}
                <div className="hero-mesh-gradient border-b border-slate-200/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Tuân thủ EPR
                                    </span>
                                    <span className="text-slate-400 text-sm">/ Quản lý dữ liệu</span>
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lịch sử Giao dịch &amp; Báo cáo EPR</h1>
                                <p className="mt-2 text-slate-600 max-w-2xl">
                                    Theo dõi chi tiết các giao dịch thu gom và xuất báo cáo môi trường tuân thủ quy định EPR (Extended Producer Responsibility).
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button className="inline-flex items-center px-4 py-2.5 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-all">
                                    <span className="material-symbols-outlined mr-2 text-green-600 text-[20px]">table_view</span>
                                    Xuất Excel
                                </button>
                                <button className="inline-flex items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary hover:bg-secondary focus:outline-none transition-all shadow-green-200 shadow-lg">
                                    <span className="material-symbols-outlined mr-2 text-[20px]">description</span>
                                    Tải Báo cáo Môi trường (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center">
                            <div className="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
                                <span className="material-symbols-outlined text-3xl">eco</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Tổng khối lượng sạch</p>
                                <p className="text-2xl font-bold text-slate-900">{totalWeightKg.toLocaleString('vi-VN')} <span className="text-sm font-normal text-slate-500">kg</span></p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
                                <span className="material-symbols-outlined text-3xl">recycling</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Tỷ lệ đạt chuẩn EPR</p>
                                <p className="text-2xl font-bold text-slate-900">100 <span className="text-sm font-normal text-slate-500">%</span></p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center">
                            <div className="p-3 rounded-lg bg-orange-50 text-orange-600 mr-4">
                                <span className="material-symbols-outlined text-3xl">payments</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Tổng giá trị thu mua</p>
                                <p className="text-2xl font-bold text-slate-900">{(totalAmountVnd / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">Tr VNĐ</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center whitespace-nowrap">
                                <span className="material-symbols-outlined mr-2 text-slate-400">history</span>
                                Danh sách giao dịch
                            </h3>
                            <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto xl:justify-end">
                                <div className="relative w-full sm:w-auto min-w-[160px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">calendar_month</span>
                                    </div>
                                    <select
                                        value={selectedMonth}
                                        onChange={e => setSelectedMonth(e.target.value)}
                                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary block w-full"
                                    >
                                        <option value="ALL">Tất cả các tháng</option>
                                        {uniqueMonths.map(m => (
                                            <option key={m} value={m}>{`Tháng ${m}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative w-full sm:w-auto min-w-[180px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">category</span>
                                    </div>
                                    <select
                                        value={selectedMaterial}
                                        onChange={e => setSelectedMaterial(e.target.value)}
                                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary block w-full"
                                    >
                                        <option value="ALL">Tất cả loại liệu</option>
                                        {uniqueMaterials.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative w-full sm:w-auto min-w-[200px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">storefront</span>
                                    </div>
                                    <select
                                        value={selectedDepot}
                                        onChange={e => setSelectedDepot(e.target.value)}
                                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-primary focus:border-primary block w-full"
                                    >
                                        <option value="ALL">Lọc theo Tên Vựa/Agency</option>
                                        {uniqueDepots.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative w-full sm:w-auto flex-grow xl:flex-grow-0">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                                    </div>
                                    <input
                                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-primary focus:border-primary block w-full sm:w-64"
                                        placeholder="Tìm kiếm mã GD..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                                    <p className="text-slate-500 font-medium">Đang tải dữ liệu giao dịch...</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Mã Giao Dịch</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Ngày &amp; Giờ</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Đơn Vị Thu Gom (Agency)</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Loại Vật Liệu</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">KL Sạch (kg)</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Thành Tiền (VNĐ)</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Trạng Thái EPR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-sm">
                                                    Không có giao dịch nào phù hợp bộ lọc.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((o) => {
                                                const orderDate = new Date(o.createdAt);
                                                return (
                                                    <tr
                                                        key={o.id}
                                                        className="hover:bg-primary/5 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/nha-may/bao-cao-epr/${o.id}`)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-primary">#{o.batchCode || o.id.substring(0, 8)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-slate-900">{orderDate.toLocaleDateString('vi-VN')}</div>
                                                            <div className="text-xs text-slate-500">{orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                                    {o.depotName ? o.depotName.charAt(0) : 'K'}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-slate-900">{o.depotName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">{o.materialType}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                                                            {o.netWeight?.toLocaleString('vi-VN') || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                                                            {o.subtotal?.toLocaleString('vi-VN') || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>Đạt Chuẩn
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination (Decorative) */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-700">
                                        Hiển thị <span className="font-medium">{filteredOrders.length}</span> giao dịch
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white pt-10 pb-8 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1">
                            <img
                                alt="Logo"
                                className="mb-4 h-12 w-auto object-contain"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIZfhhP-u2CXQYMl3s3pqNUtQxoXs5goaRe9m-ii4WaJAhp2thGbaIIiPmWDVKW3sygjrarHBZ26wmNnxgwdhScNZngJYQzPmoXf6bKLItOzA6TTYMgYpw1ji5SHLct9E4voqxNyBeBnCQopHJ3hUXCklM-Sd_q22IpQl6wGMYnoao4pL79k8pA1vp9p5_CuLLI0twg0V7E0ckTLWlmBxUpUZTx4pKsYVftpxlGXNYhY3z_Mu59aNCZObcugSnRncRcWyd_2SWmUQ"
                            />
                            <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                Nền tảng số hóa ngành phế liệu hàng đầu Việt Nam. Minh bạch, hiệu quả, bền vững.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase">Sản phẩm</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a className="hover:text-primary" href="#">Phần mềm quản lý vựa</a></li>
                                <li><a className="hover:text-primary" href="#">Ứng dụng thu gom</a></li>
                                <li><a className="hover:text-primary" href="#">Cổng doanh nghiệp</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase">Hỗ trợ</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a className="hover:text-primary" href="#">Trung tâm trợ giúp</a></li>
                                <li><a className="hover:text-primary" href="#">Hướng dẫn EPR</a></li>
                                <li><a className="hover:text-primary" href="#">Điều khoản sử dụng</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase">Liên hệ</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li className="flex items-start">
                                    <span className="material-symbols-outlined text-primary text-sm mr-2 mt-0.5">location_on</span>
                                    <span>Q.9, TP. HCM</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="material-symbols-outlined text-primary text-sm mr-2">call</span>
                                    <span>1900 123 456</span>
                                </li>
                                <li className="flex items-center">
                                    <span className="material-symbols-outlined text-primary text-sm mr-2">mail</span>
                                    <span>contact@vechai.vn</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 mt-8 pt-8 text-center text-xs text-slate-400">
                        <p>© 2024 Ve Chai Công Nghệ (Re-Nats Platform). All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EprReport;
