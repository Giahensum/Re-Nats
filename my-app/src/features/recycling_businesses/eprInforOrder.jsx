import React, { useState, useEffect } from 'react';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { useNavigate, useParams } from 'react-router-dom';
import { factoryService } from '../../services/factoryService';

const EprInforOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        factoryService.getOrderDetail(id)
            .then(res => {
                setOrder(res);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching order detail for EPR:', err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
                <HeaderDoanhNghiep activeTab="report" />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                    <p className="text-slate-500 font-medium">Đang tải dữ liệu hồ sơ EPR...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
                <HeaderDoanhNghiep activeTab="report" />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <p className="text-red-500 font-bold">Không tìm thấy thông tin đơn hàng này.</p>
                    <button
                        onClick={() => navigate('/nha-may/bao-cao-epr')}
                        className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt);
    const netWeight = order.weightTicket?.netWeightKg || 0;
    const agreedPrice = order.agreedPrice || 0;
    const subtotal = order.invoice?.subtotal || (netWeight * agreedPrice);
    const vatAmount = order.invoice?.vatAmount || (subtotal * 0.08);
    const commissionFee = order.invoice?.commissionFee || (subtotal * 0.03);
    const totalAmount = order.invoice?.totalAmount || (subtotal + vatAmount + commissionFee);

    return (
        <div className="font-sans text-slate-900 bg-slate-50 overflow-x-hidden min-h-screen flex flex-col">
            <style>{`
        .timeline-line::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 15px;
          width: 2px;
          background-color: #e2e8f0;
          z-index: 0;
        }
      `}</style>

            {/* Redesigned Unified Header */}
            <HeaderDoanhNghiep activeTab="report" />

            {/* Main */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <button
                    onClick={() => navigate('/nha-may/bao-cao-epr')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-green-700 font-bold text-xs mb-6 transition-colors focus:outline-none cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Quay lại danh sách báo cáo
                </button>

                {/* Page Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900">Giao dịch #{order.batch?.batchCode || order.id.substring(0, 8)}</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                Hoàn thành
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                Đã xác thực EPR
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                            Thu gom từ: <span className="font-semibold text-slate-700">{order.batch?.depot?.companyName}</span> • Ngày: {orderDate.toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-slate-300 flex items-center gap-2 transition-colors">
                            <span className="material-symbols-outlined text-xl">print</span>
                            In Phiếu
                        </button>
                        <button className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors shadow-green-200 shadow-lg">
                            <span className="material-symbols-outlined text-xl">download</span>
                            Tải Hồ sơ EPR (PDF)
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Weighing Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                                    Phiếu Cân Điện Tử Trạm Cân
                                </h3>
                                <span className="text-xs font-mono text-slate-500">REF: SCALE-{order.batch?.batchCode || order.id.substring(0, 8)}</span>
                            </div>
                            <div className="p-6">
                                {/* Weight Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Loại vật liệu</p>
                                        <p className="text-lg font-bold text-slate-800">{order.batch?.materialType}</p>
                                        <p className="text-xs text-slate-400">Phế liệu sạch</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Trọng lượng tổng</p>
                                        <p className="text-lg font-bold text-slate-800">{order.weightTicket?.grossWeightKg?.toLocaleString('vi-VN') || '—'} kg</p>
                                        <p className="text-xs text-slate-400">Xe + Hàng</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Trọng lượng bì</p>
                                        <p className="text-lg font-bold text-slate-800">{order.weightTicket?.tareWeightKg?.toLocaleString('vi-VN') || '—'} kg</p>
                                        <p className="text-xs text-slate-400">Xe rỗng</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Thực nhận (Net)</p>
                                        <p className="text-2xl font-bold text-primary">{netWeight.toLocaleString('vi-VN')} kg</p>
                                        <p className="text-xs text-green-600 font-medium">Đạt chuẩn 100%</p>
                                    </div>
                                </div>

                                {/* Vehicle Info + Signature */}
                                <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-3">Thông tin phương tiện</p>
                                        <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                                            <span className="text-slate-500">Biển số xe:</span>
                                            <span className="font-medium">{order.transport?.vehiclePlate || '59C-123.45'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                                            <span className="text-slate-500">Tài xế:</span>
                                            <span className="font-medium">{order.transport?.driverName || 'Trần Văn B'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                                            <span className="text-slate-500">Giờ vào:</span>
                                            <span className="font-medium">{orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-slate-500">Giờ ra:</span>
                                            <span className="font-medium">{new Date(orderDate.getTime() + 45 * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-3">Chữ ký điện tử</p>
                                        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-4 h-32 flex items-center justify-center relative">
                                            <img
                                                alt="Electronic Signature"
                                                className="max-h-20 opacity-70"
                                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3oq9L-O1rTv_0ltugkIPjJV9vcf98CPRgh3x4kMIwCnf1fxQffEEc-Jgmo_V9b1NDi4TOB8U7NcaotdnCBhkNgWAqCEmIzAbwN-NqB_ERVfJ_dhRhQvAXCXdCZDC13G1gGiw3NEFBTR2rE2_nSsSS-7oMu7wLygpQ0cljTznPTNINe__5KD0EpvK_5T-ll_pgQPefKuKWl-ozGK4iJ645wpH_RKsDl3VoTEFizvwovweSn8q5YLqpDml5lw6qkQntP8EI2DAchjw"
                                            />
                                            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                                Đã xác thực
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 text-center">Được ký bởi: Nguyễn Văn A (QC Manager)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Photo Gallery */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-slate-800">Hình ảnh Nghiệm thu</h3>
                            </div>
                            <div className="p-6">
                                {order.batch?.images && order.batch.images.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {order.batch.images.map((img, i) => (
                                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer">
                                                <img
                                                    alt={`Batch image ${i + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    src={img}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">visibility</span>
                                                </div>
                                                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">Hình ảnh #{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3XlTaCNLcbPI6ZqPHuf7E-NFw5_wGHLhR-g4LXfEIthT85eFHU8YQoJDdINfPcQJs2cZz-CRi22gszMd-anr_iJcscWlIqIP7v-bw5v4f7FWIXp6gyfejkoxhKrcu3C43LhlOqbE-PCMjgkolowjAS6YH3DwiMHxsNlNyNMK1opXZ7cQ_y_S2SpeQl1w7OLDLdrvSWTHZzELhq13Q6Jd_a9kufWVTq12CK814b1_Gmt_ky2lNJ5JZD4G7cxC-G2GF-kgxmiNME5s', label: 'Cân xe', alt: 'Truck Weighing' },
                                            { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEt8MePT19w-vtg_B5Q_H2IV41i4P-D-h3VaKXlK2fC1AsfpTnXRvN0Z_5qeLoUKPJ1NDV6TSBDQ2PBLLRQ067HMJiuOF2tPjuU0h_zS4bvhDo7H-9aMoP848Sp_WgpdWsTdrlyJSFFMSrb5uFhBb3Y5khV3nVXmvac38pDftdks2rfN6MP7lDh6q2J-xdSxj206vcFI29kIH-M56Vahm__yFEanx1SMpV4dTRUWao8dlf_kVkzDD4P_taMFuF9re5ZDNZ8o0z5fQ', label: 'Kiểm hàng', alt: 'Material Inspection' },
                                            { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9FDCyyfrIOf6xWku609hHydCNlchLqUJZkQZx6UOL4JYwH0BP6Q0kRZhN-PMDVCcVy7PrQx_xHl4c2q9lNoErmHKT7-SY8AXCjfGGx3Dz8QDx9e68_5J71wf77lsObPBs1XEZa6L3J9iBwRIS8HxKfsrhaQipPwcnWAeCK7ZPyvfqERpEmp5KNQWLlo6ILfJrAbXjmI0hJeq4E024mYnwhveV1_RuEea12D-kj8qPGLXhi81XdiKLPlMBKYDp_Km5Ehj5n2wa4Ag', label: 'Xuống hàng', alt: 'Unloading' },
                                            { src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuJZfC3F6UIIItMiueMUmQLKc7zm9HdliyRYX3nIPqAS2S6tRyDee6OXyQUoGm1txRcFL7tmuvGHL1grbNQlo-5zW_g5jMZuKqL6yv-vu8QRnFJiOQvfgqiXC1Bnnl-1sucHpvU164zzoUu_eaZ-dFuWLmCstOwweIG1_OuOB_bfwvSx9z50azIi6G_PJPwWzKQYVEMYnqFfzKNxSfXq7m5uqLrC73vGH7DmwvSD4vmY0QgEqmKVkrrKEi_-gcUlzIjQhto8DiWh8', label: 'Tạp chất', alt: 'Contaminant Check' },
                                        ].map((photo, i) => (
                                            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer">
                                                <img
                                                    alt={photo.alt}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    src={photo.src}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">visibility</span>
                                                </div>
                                                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">{photo.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice & EPR Commission breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">payments</span>
                                    Chi tiết tài chính &amp; Thuế EPR
                                </h3>
                                <span className="text-xs font-mono text-slate-500">Mã hóa đơn: {order.invoice?.invoiceNumber || `INV-${order.id.substring(0, 8).toUpperCase()}`}</span>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Đơn giá đã chốt:</span>
                                    <span className="font-bold text-slate-800">{agreedPrice.toLocaleString('vi-VN')} đ/kg</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Thành tiền hàng (Net weight × Đơn giá):</span>
                                    <span className="font-semibold text-slate-800">{subtotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100 text-slate-600">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">percent</span>
                                        Thuế bảo vệ môi trường (VAT 8%):
                                    </span>
                                    <span>+{vatAmount.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100 text-blue-600 bg-blue-50/40 px-2 rounded-lg">
                                    <span className="flex items-center gap-1 font-medium">
                                        <span className="material-symbols-outlined text-xs">handshake</span>
                                        Phí hoa hồng sàn trung gian Re-Nats (3%):
                                    </span>
                                    <span className="font-bold">+{commissionFee.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-lg py-3 font-bold text-primary">
                                    <span>Tổng cộng thanh toán:</span>
                                    <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 text-right">
                                    Phát hành ngày: {order.invoice?.createdAt ? new Date(order.invoice.createdAt).toLocaleString('vi-VN') : orderDate.toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Timeline */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400">history</span>
                                Tiến trình xử lý
                            </h3>
                            <div className="relative timeline-line space-y-8 pl-2">
                                {[
                                    { icon: 'shopping_cart', color: 'green', title: 'Tạo đơn hàng', time: orderDate.toLocaleString('vi-VN'), desc: 'Đơn hàng thu gom được tạo tự động từ hệ thống.' },
                                    { icon: 'local_shipping', color: 'green', title: 'Xe đến nhà máy', time: new Date(orderDate.getTime() + 30 * 60000).toLocaleString('vi-VN'), desc: 'Check-in tại cổng cân điện tử.' },
                                    { icon: 'scale', color: 'green', title: 'Cân & Kiểm định (QC)', time: new Date(orderDate.getTime() + 45 * 60000).toLocaleString('vi-VN'), desc: 'Hoàn tất cân trọng lượng và kiểm định chất lượng.' },
                                    { icon: 'payments', color: 'blue', title: 'Thanh toán hoàn tất', time: new Date(orderDate.getTime() + 60 * 60000).toLocaleString('vi-VN'), desc: `Đã chốt hóa đơn, cộng 3% hoa hồng sàn trung gian.` },
                                ].map((step, i) => (
                                    <div key={i} className="relative pl-8 z-10">
                                        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full bg-${step.color}-100 border-2 border-white shadow-sm flex items-center justify-center`}>
                                            <span className={`material-symbols-outlined text-${step.color}-600 text-sm`}>{step.icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800">{step.title}</span>
                                            <span className="text-xs text-slate-500">{step.time}</span>
                                            <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Final EPR step */}
                                <div className="relative pl-8 z-10">
                                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-sm">assignment_turned_in</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-primary">Ghi nhận hồ sơ EPR</span>
                                        <span className="text-xs text-slate-500">{new Date(orderDate.getTime() + 75 * 60000).toLocaleString('vi-VN')}</span>
                                        <p className="text-xs text-slate-400 mt-1">Dữ liệu đã được đồng bộ lên hệ thống EPR quốc gia.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Thông tin liên hệ</h4>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {order.batch?.depot?.companyName ? order.batch.depot.companyName.charAt(0) : 'MK'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{order.batch?.depot?.companyName}</p>
                                        <p className="text-xs text-slate-500">{order.batch?.depot?.city || 'Việt Nam'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/nha-may/doi-tac/${order.batch?.depot?.id}`)}
                                    className="w-full mt-2 text-xs text-primary font-semibold border border-primary/20 bg-white py-1.5 rounded hover:bg-primary/5 transition-colors cursor-pointer"
                                >
                                    Xem hồ sơ nhà cung cấp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EprInforOrder;
