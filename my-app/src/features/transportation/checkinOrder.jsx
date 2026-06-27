import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { transportService } from '../../services/transportService';
import { useToast } from '../../context/ToastContext';

const styles = `
  .hero-mesh-gradient {
    background-color: #f8fafc;
    background-image:
      radial-gradient(at 0% 0%, hsla(142, 46%, 34%, 0.15) 0px, transparent 50%),
      radial-gradient(at 100% 0%, hsla(199, 89%, 48%, 0.1) 0px, transparent 50%),
      radial-gradient(at 100% 100%, hsla(142, 46%, 34%, 0.05) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(199, 89%, 48%, 0.1) 0px, transparent 50%);
  }

  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const MATERIAL_LABEL = {
    STEEL: 'Sắt thép', ALUMINUM: 'Nhôm', COPPER: 'Đồng', LEAD: 'Chì/Ắc quy',
    PET: 'Nhựa PET', HDPE: 'Nhựa HDPE', PP: 'Nhựa PP', PVC: 'Nhựa PVC',
    CARDBOARD: 'Giấy carton', PAPER: 'Giấy thải', BATTERY: 'Pin Lithium',
    ELECTRONIC_WASTE: 'Điện tử', RUBBER: 'Cao su', OIL: 'Dầu nhớt',
    IRON: 'Sắt vụn', OTHER: 'Khác',
};

export default function CheckinOrder() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const jobIdParam = searchParams.get('jobId');

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    const [photo1, setPhoto1] = useState(null); 
    const [photo2, setPhoto2] = useState(null); 

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const myJobs = await transportService.getMyJobs();
                let selectedJob = null;
                if (jobIdParam) {
                    selectedJob = myJobs.find(j => j.id === jobIdParam);
                } else {
                    selectedJob = myJobs.find(j => j.status === 'ASSIGNED');
                }
                if (!selectedJob) {
                    selectedJob = myJobs.find(j => j.status === 'ON_THE_WAY');
                }
                setJob(selectedJob || null);
            } catch (err) {
                toast?.error('Không thể tải thông tin chuyến đi.');
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [jobIdParam, toast]);

    const handleFileChange1 = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto1(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleFileChange2 = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhoto2(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleStartTrip = async () => {
        if (!job) return;
        try {
            let imageUrl1 = null;
            let imageUrl2 = null;

            if (photo1 && photo1.startsWith('http')) {
                imageUrl1 = photo1;
            }
            if (photo2 && photo2.startsWith('http')) {
                imageUrl2 = photo2;
            }

            await transportService.updateJobStatus(job.id, 'ON_THE_WAY');
            
            // Phân đoạn 3: Check-in Vựa đối tác (chụp ảnh thùng xe trống)
            await transportService.checkin(job.id, {
                type: 'checkin_depot',
                latitude: 10.7876,
                longitude: 106.6346,
                note: 'Tài xế đã xác nhận thùng xe trống tại vựa thành công.',
                imageUrl: imageUrl1
            });

            // Phân đoạn 4: Check-out Vựa đối tác (chụp ảnh sau khi lên hàng & phiếu cân)
            await transportService.checkin(job.id, {
                type: 'checkout_depot',
                latitude: 10.8231,
                longitude: 106.6297,
                note: 'Tài xế chốt phiếu cân xuất kho và bắt đầu vận chuyển về nhà máy.',
                imageUrl: imageUrl2
            });

            toast?.success('Bắt đầu di chuyển đến nhà máy!');
            navigate(`/van-chuyen/di-chuyen?jobId=${job.id}`);
        } catch (err) {
            toast?.error('Lỗi hệ thống khi cập nhật chuyến đi.');
        }
    };

    if (loading) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 text-center border border-slate-100">
                    <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">qr_code_scanner</span>
                    <h2 className="text-lg font-bold text-slate-800">Không tìm thấy chuyến đi hợp lệ</h2>
                    <p className="text-xs text-slate-400 mt-2">Vui lòng nhận chuyến xe tại "Chợ đơn" hoặc bắt đầu chuyến đi từ mục "Chuyến đi" trước khi quét QR check-in.</p>
                    <button
                        onClick={() => navigate('/van-chuyen/chuyen-xe')}
                        className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-md shadow-green-200"
                    >
                        Xem chuyến đi của tôi
                    </button>
                </div>
            </div>
        );
    }

    const canSubmit = photo1 && photo2;

    return (
        <>
            <style>{styles}</style>
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                rel="stylesheet"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />

            <div className="font-sans text-slate-900 bg-slate-50 min-h-screen hero-mesh-gradient flex items-center justify-center py-8">
                <div className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100 flex flex-col h-[85vh] relative">

                    {/* Top bar */}
                    <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 sticky top-0 z-20 flex items-center justify-between">
                        <div className="flex items-center">
                            <button onClick={() => navigate('/van-chuyen/chuyen-xe')} className="mr-3 p-1 rounded-full hover:bg-slate-50 text-slate-500">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h1 className="text-lg font-bold text-slate-800">Check-in tại Vựa</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">EPR</span>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">

                        {/* Progress bar */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex space-x-1 w-full mr-4">
                                <div className="h-1.5 flex-1 bg-green-600 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                                <div className="h-1.5 flex-1 bg-slate-200 rounded-full"></div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Bước 1/3</span>
                        </div>

                        {/* Pickup info card */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Điểm nhận hàng</p>
                                    <h2 className="text-base font-bold text-slate-900 leading-snug">{job.depotName}</h2>
                                    <div className="flex items-start mt-1.5 text-slate-500 text-xs leading-relaxed">
                                        <span className="material-symbols-outlined text-sm mr-1 text-slate-400 shrink-0">location_on</span>
                                        <span>{job.depotAddress || 'Địa chỉ kho của vựa'}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold shrink-0">
                                    V
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                                <div>
                                    <p className="text-slate-400">Loại hàng</p>
                                    <p className="font-bold text-slate-700 mt-0.5">{(job.totalKg / 1000).toFixed(1)} tấn {MATERIAL_LABEL[job.materialType] || job.materialType}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Phương tiện</p>
                                    <p className="font-bold text-slate-700 mt-0.5">{job.vehicleType || 'Xe tải yêu cầu'}</p>
                                </div>
                            </div>
                        </div>

                        {/* EPR evidence section */}
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center">
                                <span className="material-symbols-outlined text-orange-500 mr-2">warning</span>
                                Bằng chứng EPR (Bắt buộc)
                            </h3>
                            <div className="space-y-4">
                                {/* Upload 1 */}
                                <div 
                                    onClick={() => setPhoto1("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400")}
                                    className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                                >
                                    {photo1 ? (
                                        <div className="relative h-32 w-full">
                                            <img src={photo1} alt="Preview 1" className="h-full w-full object-cover rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-2">
                                            <div className="h-11 w-11 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                                <span className="material-symbols-outlined text-2xl text-slate-400">add_a_photo</span>
                                            </div>
                                            <h4 className="font-semibold text-slate-700 text-xs">Chụp ảnh thùng xe trống</h4>
                                            <p className="text-[10px] text-slate-500 mt-1 text-center px-4 leading-normal">
                                                Đảm bảo thùng xe sạch sẽ (Nhấp vào để mô phỏng chụp ảnh)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Upload 2 */}
                                <div 
                                    onClick={() => setPhoto2("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400")}
                                    className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
                                >
                                    {photo2 ? (
                                        <div className="relative h-32 w-full">
                                            <img src={photo2} alt="Preview 2" className="h-full w-full object-cover rounded-lg" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-2">
                                            <div className="h-11 w-11 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                                <span className="material-symbols-outlined text-2xl text-slate-400">receipt_long</span>
                                            </div>
                                            <h4 className="font-semibold text-slate-700 text-xs text-center">
                                                Chụp ảnh sau khi lên hàng &amp; Phiếu cân
                                            </h4>
                                            <p className="text-[10px] text-slate-500 mt-1 text-center px-4 leading-normal">
                                                Phiếu cân của vựa (Nhấp vào để mô phỏng chụp ảnh)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg flex items-start">
                            <span className="material-symbols-outlined text-blue-600 mr-2 text-base mt-0.5">info</span>
                            <p className="text-[10px] text-blue-800 leading-relaxed">
                                Theo quy định EPR mới, tài xế cần cung cấp hình ảnh minh bạch tại điểm thu gom để đảm bảo truy xuất nguồn gốc phế liệu.
                            </p>
                        </div>

                        {/* Submit button */}
                        <div className="pt-2">
                            {canSubmit ? (
                                <button
                                    onClick={handleStartTrip}
                                    className="w-full py-3.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-base flex items-center justify-center shadow-lg shadow-green-100 transition-all active:scale-95 cursor-pointer"
                                >
                                    <span>Bắt đầu xuất phát</span>
                                    <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-bold text-base flex items-center justify-center cursor-not-allowed shadow-none transition-all"
                                    disabled
                                >
                                    <span>Bắt đầu xuất phát</span>
                                    <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                                </button>
                            )}
                            <p className="text-[10px] text-center text-slate-400 mt-2">Hoàn thành tải lên các ảnh bắt buộc ở trên để tiếp tục</p>
                        </div>
                    </div>

                    {/* Bottom Navigation */}
                    <div className="bg-white border-t border-slate-100 px-6 py-2 pb-5 absolute bottom-0 w-full z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-end">
                            <Link to="/transport/market" className="flex flex-col items-center gap-1 group w-14">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-green-600 text-2xl transition-colors">storefront</span>
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-green-600 transition-colors">Chợ đơn</span>
                            </Link>
                            <Link to="/van-chuyen/chuyen-xe" className="flex flex-col items-center gap-1 group w-14">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-green-600 text-2xl transition-colors">local_shipping</span>
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-green-600 transition-colors">Chuyến đi</span>
                            </Link>
                            <div className="relative -top-6">
                                <Link to="/van-chuyen/checkin" className="h-14 w-14 rounded-full bg-green-600 shadow-lg shadow-green-600/40 flex items-center justify-center text-white hover:scale-105 transition-transform border-4 border-slate-50">
                                    <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                                </Link>
                            </div>
                            <button className="flex flex-col items-center gap-1 group w-14">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-green-600 text-2xl transition-colors">history</span>
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-green-600 transition-colors">Lịch sử</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 group w-14">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-green-600 text-2xl transition-colors">person</span>
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-green-600 transition-colors">Tài khoản</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
