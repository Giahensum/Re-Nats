import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import HeaderDoanhNghiep from '../../components/layout/header_doanhNghiep/headerDoanhNghiep';
import { factoryService } from '../../services/factoryService';
import { useToast } from '../../context/ToastContext';

const OrderConfirm = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const batchId = searchParams.get('batchId') || '00000000-0000-0000-0000-000000000101';

    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bidPrice, setBidPrice] = useState(0);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await factoryService.getBatchDetail(batchId);
                setBatch(res);
                setBidPrice(res.unitPrice || 0);

            } catch (err) {
                console.error('Error fetching batch detail:', err);
                toast.error('Không tìm thấy thông tin lô hàng từ máy chủ!');
                setBatch(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [batchId, toast]);

    const handleSubmitBid = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await factoryService.placeBid(batch.id, bidPrice, note);
            toast.success('Chốt mua lô hàng thành công! Đơn hàng đã được chuyển sang trạng thái vận chuyển.');
            navigate('/recycle/order-tracking');
        } catch (err) {
            console.error('Error placing bid:', err);
            toast.error('Có lỗi xảy ra khi chốt mua lô hàng. Vui lòng thử lại!');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col items-center justify-center">
                <span className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></span>
                <p className="text-slate-500 font-bold mt-4">Đang tải thông tin xác nhận đơn hàng...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-5xl mb-4">⚠️</p>
                <h2 className="text-xl font-bold text-slate-800">Không tìm thấy lô hàng</h2>
                <p className="text-sm text-slate-400 mt-2">Thông tin lô hàng không tồn tại hoặc đã bị xóa.</p>
                <Link to="/recycle/market" className="mt-6 bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-secondary transition-colors">
                    Quay lại chợ nguyên liệu
                </Link>
            </div>
        );
    }

    const estimatedTotal = (batch.estimatedWeightKg * bidPrice);

    return (
        <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex flex-col">
            {/* Redesigned Premium Unified Header */}
            <HeaderDoanhNghiep activeTab="market" />

            {/* Visual Stepper Guideline for Recycler Lifecycle */}
            <div className="bg-white border-b border-slate-100 py-6 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm mb-2 shadow-md ring-4 ring-green-100">1</div>
                            <span className="text-xs font-black text-green-700">Chốt thầu / Đặt mua</span>
                            {/* Connector line indicators */}
                            <div className="hidden md:block absolute right-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm mb-2">2</div>
                            <span className="text-xs font-bold text-slate-400">Vận chuyển đến</span>
                            <div className="hidden md:block absolute left-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                            <div className="hidden md:block absolute right-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm mb-2">3</div>
                            <span className="text-xs font-bold text-slate-400">Kiểm định & Trạm cân</span>
                            <div className="hidden md:block absolute left-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                            <div className="hidden md:block absolute right-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                        </div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm mb-2">4</div>
                            <span className="text-xs font-bold text-slate-400">Xuất hóa đơn & Chốt</span>
                            <div className="hidden md:block absolute left-[-50%] top-4 w-[100%] h-0.5 bg-slate-200 -z-10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <Link className="inline-flex items-center text-slate-500 hover:text-primary mb-4 transition-colors" to="/recycle/market">
                        <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
                        Quay lại chợ nguyên liệu
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Xác nhận Đơn hàng</h1>
                    <p className="text-slate-500 mt-2">Vui lòng kiểm tra chất lượng lô hàng qua hình ảnh thực tế trước khi xác nhận mua.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Details Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Hướng dẫn chốt đơn thầu */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                            <span className="text-2xl mt-0.5 shrink-0">💡</span>
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">Hướng dẫn chốt đơn mua ngay:</h4>
                                <ul className="text-xs text-blue-700 space-y-1.5 list-disc pl-4 mt-2">
                                    <li><strong>Kiểm tra thông số:</strong> Hãy xem kỹ độ sạch, độ ẩm và hình ảnh thực tế của lô hàng từ vựa.</li>
                                    <li><strong>Đơn giá mua:</strong> Bạn có thể mua trực tiếp theo đơn giá đề xuất của vựa để chốt ngay lô hàng.</li>
                                    <li><strong>Không cần chờ xác nhận:</strong> Khi bạn bấm xác nhận, hệ thống sẽ chốt đơn ngay lập tức và điều phối tài xế vận chuyển về nhà máy.</li>
                                    <li><strong>Theo dõi hành trình:</strong> Bạn có thể theo dõi xe di chuyển trực quan trên bản đồ ngay sau khi chốt đơn.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                                Thông tin lô hàng
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-slate-100">
                                <div
                                    className="w-full sm:w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                                    {batch.thumbnailImageUrl ? (
                                        <img className="w-full h-full object-cover" src={batch.thumbnailImageUrl} alt={batch.materialType} />
                                    ) : (
                                        <span className="material-symbols-outlined text-5xl text-slate-300">recycling</span>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{batch.materialType}</h3>
                                        <p className="text-slate-500 text-sm">Mã lô: #{batch.batchCode}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span
                                            className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium border border-blue-100">Độ ẩm {batch.moisturePercentage}%</span>
                                        <span
                                            className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium border border-green-100">Độ sạch {batch.purityPercentage}%</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase font-semibold">Khối lượng ước tính</span>
                                            <p className="text-lg font-bold text-slate-800">{batch.estimatedWeightKg.toLocaleString('vi-VN')} kg</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase font-semibold">Đơn giá niêm yết</span>
                                            <p className="text-lg font-bold text-primary">
                                                {batch.unitPrice ? `${batch.unitPrice.toLocaleString('vi-VN')} đ/kg` : 'Chờ thỏa thuận'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-sm">
                                <span className="text-slate-500">Nhà cung cấp:</span>
                                <span className="font-semibold text-slate-900">{batch.depot.companyName}</span>
                            </div>
                            <div className="mt-2 flex justify-between items-center text-sm">
                                <span className="text-slate-500">Địa chỉ kho:</span>
                                <span className="font-medium text-slate-700">{batch.depot.address}, {batch.depot.city}</span>
                            </div>

                        </div>

                        {/* Interactive Bid Form */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">local_offer</span>
                                Đề xuất mức giá thu mua
                            </h2>
                            <form onSubmit={handleSubmitBid} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Giá thu mua đề xuất (đ/kg)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={bidPrice}
                                            onChange={(e) => setBidPrice(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl py-3 px-4 text-lg font-extrabold text-slate-800 focus:outline-none transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ĐỒNG / KG</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Mặc định được điền theo giá niêm yết của vựa, bạn có thể mặc cả/thương lượng nếu muốn.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú / Thỏa thuận vận chuyển</label>
                                    <textarea
                                        rows={3}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Nhập thỏa thuận về giao nhận hàng, chất lượng hoặc thời gian mong muốn..."
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl py-3 px-4 text-sm text-slate-700 focus:outline-none transition-all"
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sticky Billing Column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Tổng cộng ước tính</h3>
                                <div className="space-y-3 pb-6 border-b border-slate-100 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Giá trị hàng hóa</span>
                                        <span className="font-medium text-slate-900">{(batch.estimatedWeightKg * bidPrice).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Thu gom & Vận chuyển</span>
                                        <span className="font-medium text-slate-900">Tự thỏa thuận / Tài xế Re-Nats</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Phí sàn Re-Nats</span>
                                        <span className="font-medium text-slate-900">Miễn phí</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-baseline mb-8">
                                    <span className="text-base font-bold text-slate-700">Tổng tạm tính</span>
                                    <span className="text-2xl font-bold text-primary">{estimatedTotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <button
                                    onClick={handleSubmitBid}
                                    disabled={submitting}
                                    className="w-full bg-primary hover:bg-secondary text-white py-4 px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-55">
                                    {submitting ? (
                                        <span>Đang xử lý đơn...</span>
                                    ) : (
                                        <>
                                            Xác nhận Mua lô hàng
                                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-xs text-slate-400 text-center mt-4">
                                    Bằng việc mua hàng, bạn đồng ý với <a className="text-primary hover:underline" href="#">Điều khoản mua hàng</a> của Re-Nats.
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600 shrink-0 mt-0.5">info</span>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800">Lưu ý quan trọng</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Số lượng và khối lượng thực tế sẽ được kiểm nghiệm chính xác tại cân KCS của nhà máy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderConfirm;

