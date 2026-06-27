import React, { useState, useEffect } from 'react';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { useNavigate, Link } from 'react-router-dom';
import { factoryService } from '../../services/factoryService';

const InforPartnerVip = () => {
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        factoryService.getPremiumStatus()
            .then(res => setIsPremium(res?.isPremium || false))
            .catch(() => setIsPremium(false));
    }, []);

    return (
        <div className="font-sans text-slate-900 bg-slate-50 overflow-x-hidden min-h-screen flex flex-col">

            {/* Redesigned Premium Unified Header */}
            <HeaderDoanhNghiep activeTab="partners" />

            {/* Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Back link */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/nha-may/doi-tac')}
                        className="text-slate-500 hover:text-green-700 text-sm flex items-center gap-1.5 mb-2 focus:outline-none cursor-pointer font-semibold"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Quay lại danh sách đối tác
                    </button>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="h-32 bg-gradient-to-r from-green-800 to-green-600 relative">
                        <div className="absolute bottom-4 right-6 flex gap-3">
                            <button className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">share</span> Chia sẻ
                            </button>
                            <button className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">edit</span> Chỉnh sửa
                            </button>
                        </div>
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                            <div className="w-32 h-32 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0 relative">
                                <img
                                    alt="Vựa Phế Liệu Minh Khôi"
                                    className="w-full h-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMo4W6nUdCRfZCBnwcIP1LM8dpwEO2KsT5MeRF7X0bZno83NJe8Nj7cztEcXKUskNW7HtnzPL5cI6MPf0t9ERUW1ekbHJZQb38Lj2sy6iQkh7jBOvicHQdaFV-6tErXJYn31LuValHrvPguQif-unF8IIA0Jde6-rUV0WJSib2tc6-1goeRUezUWsqn7JtHXSRGGthjjeE4S7otUYkszSY8noP1B2V-VBTxgNDopuRZwH3VKzM9yX0xyGFXyrmhQ8knF9hNFz5LRg"
                                />
                                <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-tl-lg">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                </div>
                            </div>
                            <div className="flex-1 pt-14 md:pt-0 mt-2">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-2xl font-bold text-slate-900">Vựa Phế Liệu Minh Khôi</h1>
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold border border-yellow-200">VIP PARTNER</span>
                                        </div>
                                        <p className="text-slate-500 flex items-center gap-1 text-sm mb-4">
                                            <span className="material-symbols-outlined text-lg text-slate-400">storefront</span>
                                            Chuyên thu mua: Đồng, Nhôm, Sắt thép công nghiệp
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-slate-400">call</span>
                                                <span>0909 123 456 (A. Minh)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-slate-400">mail</span>
                                                <span>minhkhoi.scrap@gmail.com</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-slate-400">location_on</span>
                                                <span>123 Quốc Lộ 1A, Bình Chánh, TP.HCM</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 uppercase font-semibold">Lịch sử giao dịch</p>
                                                <p className="text-2xl font-bold text-green-600">98 Chuyến</p>
                                            </div>
                                            <div className="h-12 w-12 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-50">
                                                <span className="material-symbols-outlined text-green-600 text-2xl">local_shipping</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            <span>Hợp tác từ:</span>
                                            <span className="font-medium text-slate-700">12/2021</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Chart Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                            {!isPremium && (
                                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-2xl">
                                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm">Phân tích KCS nâng cao</p>
                                    <p className="text-xs text-slate-500 text-center max-w-[200px]">Xem biểu đồ độ sạch và tạp chất theo thời gian của từng đối tác</p>
                                    <Link to="/nha-may/premium" className="inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-white font-bold py-2 px-5 rounded-lg text-xs shadow-md transition-all">
                                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                        Mua gói Premium
                                    </Link>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Lịch sử Độ sạch (% Tạp chất)</h3>
                                    <p className="text-sm text-slate-500">Tỉ lệ tạp chất trung bình 3 tháng gần nhất</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                                    <span className="text-xs text-slate-500">Tạp chất %</span>
                                </div>
                            </div>
                            <div className="relative h-64 w-full flex items-end justify-between px-2 pb-8 border-b border-l border-slate-200 gap-4">
                                <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-xs text-slate-400 py-2">
                                    <span>5%</span><span>4%</span><span>3%</span><span>2%</span><span>1%</span><span>0%</span>
                                </div>
                                <svg className="absolute inset-0 w-full h-[85%] overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 50">
                                    <defs>
                                        <linearGradient id="gradientStroke" x1="0%" x2="100%" y1="0%" y2="0%">
                                            <stop offset="0%" style={{ stopColor: '#2f7f34', stopOpacity: 1 }} />
                                            <stop offset="100%" style={{ stopColor: '#86efac', stopOpacity: 1 }} />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,40 Q10,35 20,38 T40,30 T60,25 T80,28 T100,20" fill="none" stroke="url(#gradientStroke)" strokeLinecap="round" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                                    {[[0, 40], [20, 38], [40, 30], [60, 25], [80, 28], [100, 20]].map(([cx, cy], i) => (
                                        <circle key={i} cx={cx} cy={cy} fill="#fff" r="1" stroke="#2f7f34" strokeWidth="0.5" />
                                    ))}
                                </svg>
                                <div className="w-full flex justify-between absolute bottom-0 left-0 text-xs text-slate-400 translate-y-full pt-2">
                                    <span>Tháng 8</span><span>15/8</span><span>Tháng 9</span><span>15/9</span><span>Tháng 10</span><span>Hiện tại</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Trung bình tạp chất</p>
                                    <p className="text-xl font-bold text-slate-800">2.1%</p>
                                    <span className="text-xs text-green-600 flex items-center">
                                        <span className="material-symbols-outlined text-sm mr-1">trending_down</span> -0.5%
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Tổng khối lượng (3T)</p>
                                    <p className="text-xl font-bold text-slate-800">452 Tấn</p>
                                    <span className="text-xs text-green-600 flex items-center">
                                        <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +12%
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Đánh giá chung</p>
                                    <p className="text-xl font-bold text-slate-800">Xuất sắc</p>
                                    <div className="flex text-yellow-400 text-xs">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction History */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                            {!isPremium && (
                                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-2xl">
                                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm">Lịch sử Giao dịch đối tác</p>
                                    <p className="text-xs text-slate-500 text-center max-w-[200px]">Xem toàn bộ lịch sử mua bán, trọng lượng và độ sạch theo từng lô</p>
                                    <Link to="/nha-may/premium" className="inline-flex items-center gap-1.5 bg-primary hover:bg-secondary text-white font-bold py-2 px-5 rounded-lg text-xs shadow-md transition-all">
                                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                        Mua gói Premium
                                    </Link>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Lịch sử Giao dịch</h3>
                                <button className="text-primary text-sm font-medium hover:underline">Xem tất cả</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Mã đơn</th>
                                            <th className="px-4 py-3 font-medium">Loại liệu</th>
                                            <th className="px-4 py-3 font-medium">Khối lượng</th>
                                            <th className="px-4 py-3 font-medium">Độ sạch</th>
                                            <th className="px-4 py-3 font-medium text-right">Ngày</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[
                                            { code: '#TRX-9021', type: 'Đồng dây điện', weight: '2,450 kg', purity: '98.5%', purityColor: 'green', date: '24/10/2023' },
                                            { code: '#TRX-8955', type: 'Nhôm lon', weight: '1,200 kg', purity: '95.0%', purityColor: 'green', date: '20/10/2023' },
                                            { code: '#TRX-8812', type: 'Sắt phế liệu', weight: '5,100 kg', purity: '92.1%', purityColor: 'yellow', date: '15/10/2023' },
                                            { code: '#TRX-8740', type: 'Nhựa HDPE', weight: '850 kg', purity: '99.0%', purityColor: 'green', date: '12/10/2023' },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-primary">{row.code}</td>
                                                <td className="px-4 py-3 text-slate-600">{row.type}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{row.weight}</td>
                                                <td className={`px-4 py-3 text-${row.purityColor}-600 font-medium`}>{row.purity}</td>
                                                <td className="px-4 py-3 text-slate-500 text-right">{row.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Map Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">Vị trí kho bãi</h3>
                                <a className="text-xs text-primary hover:underline flex items-center gap-1" href="#">
                                    Mở rộng <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </a>
                            </div>
                            <div className="relative w-full h-64 bg-slate-100 group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img
                                        alt="Map Preview"
                                        className="w-full h-full object-cover opacity-80"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuByCVgrvO48Nz1suo3xPFnXGLyAowELMph9WAMlGTyK3_wclsKAnnfnTmniS8vMtMTPR4l67e4kM5bwxm-SncSbWSRGvzERV2szHlFnQxoOgacIZ9bc3yvp_stTLzOXev4WzpD2xg19CVD0Lm6EjAepGHzMdUIsG2jx--9Z0aOGaFftHdsvujfH_5D7JVOTVqhp0QyQBV-nfbSsqNw16X-Qxul2BrRHdU6hO0qM4cqpz427EIdEqdiOsTPABPYyl4O7-ACvku1jfXQ"
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-red-500 drop-shadow-md animate-bounce">location_on</span>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm border border-slate-200 text-sm">
                                    <p className="font-medium text-slate-800">Kho Minh Khôi (Cổng chính)</p>
                                    <p className="text-xs text-slate-500 mt-1">Cách nhà máy ReNats 12km</p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50">
                                <button className="w-full bg-white border border-slate-300 text-slate-700 font-medium py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">directions</span>
                                    Chỉ đường
                                </button>
                            </div>
                        </div>

                        {/* Certificate Card */}
                        <div className="bg-gradient-to-br from-primary to-green-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-symbols-outlined text-9xl">workspace_premium</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 relative z-10">Chứng nhận Đối tác</h3>
                            <p className="text-green-100 text-sm mb-6 relative z-10">Vựa Minh Khôi đã hoàn thành xác thực KYC doanh nghiệp và đạt tiêu chuẩn ISO 9001 về quy trình phân loại.</p>
                            <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
                                    <div className="bg-white text-primary p-1.5 rounded-full">
                                        <span className="material-symbols-outlined text-lg">verified_user</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Xác thực Doanh nghiệp</p>
                                        <p className="text-xs text-green-200">Ngày cấp: 12/01/2022</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg border border-white/10">
                                    <div className="bg-white text-primary p-1.5 rounded-full">
                                        <span className="material-symbols-outlined text-lg">eco</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">Chứng chỉ Xanh (Level 2)</p>
                                        <p className="text-xs text-green-200">Hết hạn: 12/01/2025</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Ghi chú nội bộ</h3>
                            <div className="space-y-4">
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                    <div className="flex items-center gap-2 mb-1 font-semibold">
                                        <span className="material-symbols-outlined text-base">sticky_note_2</span>
                                        Lưu ý nhập hàng
                                    </div>
                                    <p>Lô hàng từ kho Minh Khôi thường có lẫn tạp chất nhựa trong phế liệu sắt. Cần kiểm tra kỹ QC bước đầu.</p>
                                    <p className="text-xs text-yellow-600 mt-2 text-right">- Ghi bởi: Trần B (QC Leader)</p>
                                </div>
                                <textarea
                                    className="w-full text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                                    placeholder="Thêm ghi chú mới..."
                                    rows="3"
                                />
                                <button className="w-full mt-2 bg-slate-100 text-slate-600 font-medium py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                                    Lưu ghi chú
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InforPartnerVip;
