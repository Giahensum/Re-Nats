import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

const vnd = n => (n || 0).toLocaleString('vi-VN') + ' ₫';

const OrderSettlement = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const navigate = useNavigate();
    const toast = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settling, setSettling] = useState(false);

    const loadOrderDetail = async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const data = await factoryService.getOrderDetail(orderId);
            setOrder(data);
        } catch (err) {
            console.error('Error loading order details:', err);
            toast.error('Không tải được thông tin đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrderDetail();
    }, [orderId]);

    const handleSettle = async () => {
        setSettling(true);
        try {
            await factoryService.settleInvoice(orderId);
            toast.success('Thanh toán hóa đơn & chốt giao dịch thành công!');
            // Reload order details to reflect paid status
            await loadOrderDetail();
        } catch (err) {
            console.error('Error settling invoice:', err);
            toast.error('Giao dịch thất bại, vui lòng thử lại');
        } finally {
            setSettling(false);
        }
    };

    const formatMaterial = (type) => {
        const lower = (type || '').toLowerCase();
        if (lower.includes('cardboard') || lower.includes('paper')) return 'Giấy Carton';
        if (lower.includes('hdpe') || lower.includes('plastic')) return 'Nhựa các loại';
        if (lower.includes('iron') || lower.includes('metal') || lower.includes('steel')) return 'Kim loại phế liệu';
        if (lower.includes('copper')) return 'Đồng đỏ phế liệu';
        return 'Nguyên liệu thô';
    };

    if (loading) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
                <HeaderDoanhNghiep activeTab="orders" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 border-4 border-green-700 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-slate-500 font-semibold text-sm">Đang tải thông tin hóa đơn...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
                <HeaderDoanhNghiep activeTab="orders" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <p className="text-red-500 font-bold">Không tìm thấy thông tin đơn hàng này.</p>
                        <Link to="/recycle/order-process" className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">
                            Quay lại trạm cân
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const isPaid = order.invoice?.status === 'VERIFIED';
    const subtotal = order.invoice?.subtotal || 0;
    const vat = order.invoice?.vatAmount || 0;
    const commissionFee = order.invoice?.commissionFee || 0;
    const totalAmount = order.invoice?.totalAmount || 0;

    return (
        <div className="font-sans text-slate-900 bg-slate-50 overflow-x-hidden min-h-screen flex flex-col">
            {/* Header */}
            <HeaderDoanhNghiep activeTab="orders" />

            {/* MAIN CONTENT */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link */}
                <div className="mb-6 print:hidden">
                    <Link to="/recycle/order-process" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-semibold transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Quay lại Trạm Cân
                    </Link>
                </div>

                {/* Stepper Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8 print:hidden">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">1</div>
                            <span className="text-xs font-bold text-slate-500">Chốt thầu / Đặt mua</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">2</div>
                            <span className="text-xs font-bold text-slate-500">Vận chuyển đến</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-2 shadow-sm">3</div>
                            <span className="text-xs font-bold text-slate-500">Kiểm định & Trạm cân</span>
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-md ring-4 ${isPaid ? 'bg-emerald-600 text-white ring-emerald-100' : 'bg-green-700 text-white ring-green-100'}`}>4</div>
                            <span className={`text-xs font-black ${isPaid ? 'text-emerald-700' : 'text-green-700'}`}>Xuất hóa đơn & Chốt</span>
                            <div className="hidden md:block absolute left-[-50%] top-4 w-[100%] h-0.5 bg-green-200 -z-10" />
                        </div>
                    </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Panel: Weight and Details */}
                    <div className="lg:col-span-5 space-y-6 print:hidden">
                        {/* Weighing Details */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                                <span className="material-symbols-outlined text-green-700 text-2xl">scale</span>
                                <h3 className="font-bold text-slate-800 text-base">Thông tin Trạm Cân &amp; Nghiệm Thu</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">Cân Tổng (Gross)</p>
                                        <p className="text-lg font-bold text-slate-800 mt-1">{order.weightTicket?.grossWeightKg?.toLocaleString('vi-VN') || 0} kg</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-400 font-semibold uppercase">Tạp chất (Tare)</p>
                                        <p className="text-lg font-bold text-slate-800 mt-1">{order.weightTicket?.tareWeightKg?.toLocaleString('vi-VN') || 0} kg</p>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                                    <p className="text-xs text-green-600 font-bold uppercase">Trọng lượng Thực nhận (Net)</p>
                                    <p className="text-2xl font-extrabold text-green-800 mt-1">{order.weightTicket?.netWeightKg?.toLocaleString('vi-VN') || 0} kg</p>
                                </div>

                                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Mã phiếu cân:</span>
                                        <span className="font-bold text-slate-700">{order.weightTicket?.ticketNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Trạm cân thực hiện:</span>
                                        <span className="font-semibold text-slate-700">Trạm Cân Cổng Nam #04</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Hao hụt chất lượng:</span>
                                        <span className="font-semibold text-amber-600">-{order.weightVerification?.differencePercentage || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order info */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                                <span className="material-symbols-outlined text-green-700 text-2xl">local_shipping</span>
                                <h3 className="font-bold text-slate-800 text-base">Thông tin Lô Hàng</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Mã Lô Hàng:</span>
                                    <span className="font-bold text-slate-700">#{order.batch?.batchCode || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Nguyên Liệu:</span>
                                    <span className="font-semibold text-slate-700">{formatMaterial(order.batch?.materialType)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Xe Vận Chuyển:</span>
                                    <span className="font-semibold text-slate-700">{order.transport?.vehiclePlate || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tài xế phụ trách:</span>
                                    <span className="font-semibold text-slate-700">{order.transport?.driverName || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Invoice Document */}
                    <div className="lg:col-span-7 space-y-6 w-full">
                        {/* Invoice Paper */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden relative">
                            {/* Paid Stamp overlay */}
                            {isPaid && (
                                <div className="absolute right-8 top-28 border-4 border-emerald-600 text-emerald-600 font-black uppercase text-xl px-4 py-2 rotate-[-12deg] tracking-widest rounded opacity-80 select-none z-10">
                                    ĐÃ THANH TOÁN
                                </div>
                            )}

                            {/* Invoice Header */}
                            <div className="bg-green-700 px-8 py-6 text-white flex justify-between items-start">
                                <div>
                                    <p className="text-2xl font-extrabold tracking-tight">Re-Nats</p>
                                    <p className="text-green-200 text-xs mt-0.5">Nền tảng Quản lý Phế liệu Công nghiệp</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-green-300 uppercase tracking-widest font-bold">Hóa Đơn Thu Mua</p>
                                    <p className="text-lg font-black mt-0.5">{order.invoice?.invoiceNumber || 'HD-NMY-PENDING'}</p>
                                    <p className="text-green-100 text-xs mt-0.5">
                                        Ngày lập: {order.invoice?.createdAt ? new Date(order.invoice.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>

                            {/* Invoice Body */}
                            <div className="p-8 space-y-6">
                                {/* Bill To / Bill From */}
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn vị bán (Đại lý Vựa)</p>
                                        <p className="font-extrabold text-slate-800">{order.batch?.depot?.companyName || 'N/A'}</p>
                                        <p className="text-slate-500 mt-1 leading-snug">{order.batch?.depot?.address || 'N/A'}</p>
                                        <p className="text-slate-500 mt-0.5">{order.batch?.depot?.city || ''}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn vị mua (Nhà máy)</p>
                                        <p className="font-extrabold text-slate-800">CÔNG TY TNHH TÁI CHẾ RE-NATS</p>
                                        <p className="text-slate-500 mt-1 leading-snug">Khu công nghiệp VSIP, Đại Đồng, Tiên Du</p>
                                        <p className="text-slate-500 mt-0.5">Bắc Ninh</p>
                                    </div>
                                </div>

                                <div className="border-t border-dashed border-slate-200" />

                                {/* Items table */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Chi tiết phế liệu thực nhận</p>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                                                <th className="text-left pb-2">Vật liệu</th>
                                                <th className="text-right pb-2">Số kg (Net)</th>
                                                <th className="text-right pb-2">Đơn giá thầu</th>
                                                <th className="text-right pb-2">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            <tr>
                                                <td className="py-4 font-bold text-slate-800 flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
                                                    {formatMaterial(order.batch?.materialType)}
                                                </td>
                                                <td className="py-4 text-right font-bold text-slate-700">
                                                    {(order.weightTicket?.netWeightKg || 0).toLocaleString('vi-VN')} kg
                                                </td>
                                                <td className="py-4 text-right text-slate-500">
                                                    {vnd(order.agreedPrice)} /kg
                                                </td>
                                                <td className="py-4 text-right font-extrabold text-slate-800">
                                                    {vnd(subtotal)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="border-t border-slate-100 pt-4 space-y-2.5">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Cộng tiền hàng:</span>
                                        <span className="font-semibold text-slate-800">{vnd(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Thuế giá trị gia tăng (VAT 8%):</span>
                                        <span className="font-semibold text-slate-800">{vnd(vat)}</span>
                                    </div>
                                    {commissionFee > 0 && (
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Phí dịch vụ trung gian Re-Nats (3%):</span>
                                            <span className="font-semibold text-slate-800">{vnd(commissionFee)}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl px-5 py-4 mt-2">
                                        <span className="font-bold text-base">Tổng cộng thanh toán:</span>
                                        <span className="text-2xl font-black text-yellow-400">{vnd(totalAmount)}</span>
                                    </div>
                                </div>

                                {/* Terms & Signs */}
                                <div className="border-t border-dashed border-slate-200 pt-6 grid grid-cols-2 gap-6 text-center text-xs text-slate-400">
                                    <div>
                                        <p className="uppercase tracking-wider font-bold mb-1">Đại lý vựa</p>
                                        <p className="italic">(Ký, ghi rõ họ tên)</p>
                                        <div className="h-16" />
                                    </div>
                                    <div>
                                        <p className="uppercase tracking-wider font-bold mb-1">Đại diện nhà máy</p>
                                        <p className="italic">(Ký, đóng dấu)</p>
                                        {isPaid ? (
                                            <div className="flex flex-col items-center justify-center h-16">
                                                <span className="material-symbols-outlined text-3xl text-emerald-500 animate-bounce">verified_user</span>
                                                <span className="text-[10px] text-emerald-500 font-bold mt-1">ĐÃ XÁC NHẬN CHỮ KÝ SỐ</span>
                                            </div>
                                        ) : (
                                            <div className="h-16" />
                                        )}
                                    </div>
                                </div>

                                {/* Footer details */}
                                <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
                                    Hóa đơn này được tạo tự động bởi Re-Nats Platform và có giá trị pháp lý đối soát thuế bảo vệ môi trường EPR.
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 print:hidden">
                            {!isPaid ? (
                                <button
                                    onClick={handleSettle}
                                    disabled={settling}
                                    className="flex-1 bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-950 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-base disabled:opacity-50"
                                >
                                    {settling ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-xl">payments</span>
                                            XÁC NHẬN THANH TOÁN &amp; CHỐT ĐƠN HÀNG
                                        </>
                                    )}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">print</span>
                                        In hóa đơn VAT
                                    </button>
                                    <Link
                                        to="/recycle/order-process"
                                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">scale</span>
                                        Quay về trạm cân
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    @page { margin: 1cm; }
                }
            `}</style>
        </div>
    );
};

export default OrderSettlement;
