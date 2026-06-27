import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { transportService } from '../../services/transportService';
import { useToast } from '../../context/ToastContext';

const styles = `
  .driver-card {
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .map-btn {
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
    border: 2px solid #e5e7eb;
    transition: all 0.2s;
  }

  .map-btn:active {
    transform: scale(0.98);
    background: #e5e7eb;
  }

  .arrive-btn {
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
    transition: all 0.2s;
  }

  .arrive-btn:active {
    transform: scale(0.98);
    box-shadow: 0 5px 10px -3px rgba(37, 99, 235, 0.3);
  }

  .status-badge {
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .glass-header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .nav-item-active {
    color: #2f7f34;
  }

  .nav-item {
    color: #64748b;
    transition: color 0.2s;
  }

  .qr-btn {
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
  }
`;

export default function CheckinOrderStep2() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [searchParams] = useSearchParams();
    const jobIdParam = searchParams.get('jobId');

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Intermediate checkpoint states
    const [note, setNote] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [savingCheckpoint, setSavingCheckpoint] = useState(false);

    const fetchJob = useCallback(async () => {
        try {
            const myJobs = await transportService.getMyJobs();
            let selectedJob = null;
            if (jobIdParam) {
                selectedJob = myJobs.find(j => j.id === jobIdParam);
            } else {
                selectedJob = myJobs.find(j => j.status === 'ON_THE_WAY') || myJobs.find(j => j.status === 'ASSIGNED');
            }
            setJob(selectedJob || null);
        } catch (err) {
            toast?.error('Không thể tải thông tin hành trình.');
        }
    }, [jobIdParam, toast]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchJob();
            setLoading(false);
        };
        init();
    }, [fetchJob]);

    const handleArriveAtFactory = async () => {
        if (!job) return;
        try {
            setSubmitting(true);
            
            // 1. Cập nhật trạng thái thành DELIVERED (Đã giao hàng)
            await transportService.updateJobStatus(job.id, 'DELIVERED');

            // 2. Check-in tại điểm giao hàng (Nhà máy)
            await transportService.checkin(job.id, {
                type: 'checkin_factory',
                latitude: 10.7231,
                longitude: 106.6124,
                note: 'Tài xế đã đến nhà máy và hoàn thành giao hàng thành công.',
                imageUrl: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=400'
            });

            toast?.success('Đã cập nhật trạng thái đơn: Giao hàng thành công!');
            navigate('/van-chuyen/chuyen-xe?tab=history');
        } catch (err) {
            toast?.error('Lỗi khi cập nhật trạng thái giao hàng.');
        } finally {
            setSubmitting(false);
        }
    };

    const lastLog = job?.trackingLogs && job.trackingLogs.length > 0 
        ? job.trackingLogs[job.trackingLogs.length - 1] 
        : null;
    
    const nextLogType = lastLog?.logType === 'CHECKIN' ? 'CHECKOUT' : 'CHECKIN';

    const handleAddCheckpoint = async () => {
        if (!job) return;
        if (!file) {
            toast?.error('Vui lòng chụp hoặc chọn ảnh minh chứng.');
            return;
        }

        try {
            setUploading(true);
            const uploadRes = await transportService.uploadImage(file);
            const imageUrl = uploadRes.url;
            setUploading(false);

            setSavingCheckpoint(true);
            let lat = 10.7231;
            let lng = 106.6124;

            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.log('Location access error or timeout');
                }
            }

            await transportService.checkin(job.id, {
                type: nextLogType,
                latitude: lat,
                longitude: lng,
                note: note || (nextLogType === 'CHECKIN' ? 'Dừng nghỉ dọc đường' : 'Tiếp tục hành trình'),
                imageUrl: imageUrl
            });

            toast?.success(`Báo cáo ${nextLogType === 'CHECKIN' ? 'Dừng nghỉ' : 'Tiếp tục'} thành công!`);
            
            setNote('');
            setFile(null);
            setPreviewUrl('');
            
            await fetchJob();
        } catch (err) {
            toast?.error(err.message || 'Lỗi khi lưu báo cáo hành trình.');
        } finally {
            setUploading(false);
            setSavingCheckpoint(false);
        }
    };

    const checkinCount = job?.trackingLogs?.filter(log => log.logType === 'CHECKIN').length || 0;
    const checkoutCount = job?.trackingLogs?.filter(log => log.logType === 'CHECKOUT').length || 0;
    const canConfirmArrival = checkinCount >= 2 && checkoutCount >= 2;

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
                    <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">local_shipping</span>
                    <h2 className="text-lg font-bold text-slate-800">Không có chuyến đi đang di chuyển</h2>
                    <p className="text-xs text-slate-400 mt-2">Vui lòng kiểm tra lại trạng thái chuyến xe của bạn trong phần "Chuyến đi".</p>
                    <button
                        onClick={() => navigate('/van-chuyen/chuyen-xe')}
                        className="mt-6 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"
                    >
                        Quay lại danh sách chuyến đi
                    </button>
                </div>
            </div>
        );
    }

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

            <div className="font-sans text-slate-900 min-h-screen flex flex-col items-center bg-[#f0f2f5] pt-20 pb-20">

                {/* Fixed Header */}
                <header className="fixed top-0 left-0 right-0 z-50 glass-header px-4 py-3">
                    <div className="max-w-md mx-auto w-full">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-base font-bold text-slate-800">Chuyến đi #TRIP-{job.id.substring(0, 8).toUpperCase()}</h1>
                            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                                Bước 2/3
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-green-600 h-1.5 rounded-full w-2/3 transition-all duration-500"></div>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="w-full max-w-md mx-auto flex flex-col h-full justify-between p-4 flex-grow">

                    {/* Status row */}
                    <div className="flex items-center justify-between mb-6 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-sm">signal_cellular_alt</span>
                            <span className="text-[10px] font-semibold text-slate-500">GPS Đang Hoạt Động</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-semibold text-green-700">Trực tuyến</span>
                        </div>
                    </div>

                    {/* Hero section */}
                    <div className="mb-6 text-center">
                        <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 rounded-full mb-3 ring-4 ring-blue-50/50">
                            <span className="material-symbols-outlined text-3xl text-blue-600">local_shipping</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 mb-1">Đang di chuyển</h1>
                        <p className="text-slate-500 text-sm">Đến điểm giao hàng</p>
                    </div>

                    {/* Destination card */}
                    <div className="driver-card p-5 mb-6 w-full border border-slate-100 shadow-sm">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="mt-0.5">
                                <span className="material-symbols-outlined text-red-500 text-2xl">location_on</span>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Điểm giao hàng</p>
                                <h2 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                                    {job.factoryName}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Lô B4, KCN Xuyên Á, Đức Hòa, Long An
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                            <div>
                                <p className="text-slate-400">Khoảng cách</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{job.distanceKm} km</p>
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <div>
                                <p className="text-slate-400">Thời gian dự kiến</p>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">~30 phút</p>
                            </div>
                        </div>
                    </div>

                    {/* Báo cáo dọc đường (Check-in/Check-out) */}
                    <div className="driver-card p-5 mb-6 w-full border border-slate-100 shadow-sm bg-white">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-green-600">route</span>
                            <h3 className="font-bold text-slate-800 text-sm">Báo cáo dọc đường (EPR)</h3>
                        </div>

                        {/* Counts and status message */}
                        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 font-semibold mb-1">
                                Tiến độ báo cáo dọc đường:
                            </p>
                            <div className="flex gap-4 text-xs font-bold text-slate-700">
                                <span>Check-in: {checkinCount}/2</span>
                                <span>Check-out: {checkoutCount}/2</span>
                            </div>
                            <div className="mt-2 text-[10px] leading-relaxed">
                                {canConfirmArrival ? (
                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">check_circle</span>
                                        Đã đủ điều kiện để xác nhận đã đến Nhà máy.
                                    </span>
                                ) : (
                                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">warning</span>
                                        Cần tối thiểu 2 lần Check-in và 2 lần Check-out dọc đường.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Checkpoint submission form */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-700">
                                Báo cáo lần tới: <span className="text-blue-600">{nextLogType === 'CHECKIN' ? 'Dừng nghỉ (Check-in)' : 'Tiếp tục di chuyển (Check-out)'}</span>
                            </h4>

                            {/* Image selector */}
                            <div
                                onClick={() => !uploading && !savingCheckpoint && document.getElementById('checkpoint-file-input').click()}
                                className="border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-center relative overflow-hidden"
                            >
                                <input
                                    id="checkpoint-file-input"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                        }
                                    }}
                                />
                                {previewUrl ? (
                                    <div className="relative h-28 w-full">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-semibold">Nhấn để thay đổi ảnh</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-2">
                                        <span className="material-symbols-outlined text-slate-400 text-2xl mb-1">add_a_photo</span>
                                        <p className="text-[10px] text-slate-500 font-medium">Chụp ảnh chứng minh vị trí dọc đường</p>
                                    </div>
                                )}
                            </div>

                            {/* Note input */}
                            <div>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none"
                                    placeholder={nextLogType === 'CHECKIN' ? 'Ghi chú dừng nghỉ (Ví dụ: Trạm dừng chân Đức Hòa)' : 'Ghi chú tiếp tục đi (Ví dụ: Tiếp tục hành trình)'}
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleAddCheckpoint}
                                disabled={uploading || savingCheckpoint || !file}
                                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">send</span>
                                {uploading ? 'Đang upload ảnh...' : savingCheckpoint ? 'Đang lưu báo cáo...' : `Gửi Báo cáo ${nextLogType === 'CHECKIN' ? 'Dừng nghỉ' : 'Tiếp tục'}`}
                            </button>
                        </div>
                    </div>

                    {/* Lịch sử nhật ký hành trình */}
                    {job.trackingLogs && job.trackingLogs.length > 0 && (
                        <div className="driver-card p-5 mb-6 w-full border border-slate-100 shadow-sm bg-white">
                            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-500">timeline</span>
                                Nhật ký hành trình
                            </h3>
                            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                                {job.trackingLogs.map((log) => {
                                    const isCheckin = log.logType === 'CHECKIN';
                                    const isCheckout = log.logType === 'CHECKOUT';
                                    const isDepot = log.logType === 'DEPOT';
                                    const isFactory = log.logType === 'FACTORY';
                                    
                                    let badgeColor = 'bg-slate-100 text-slate-700';
                                    let typeLabel = log.logType;
                                    if (isCheckin) {
                                        badgeColor = 'bg-amber-100 text-amber-700';
                                        typeLabel = 'Check-in';
                                    } else if (isCheckout) {
                                        badgeColor = 'bg-blue-100 text-blue-700';
                                        typeLabel = 'Check-out';
                                    } else if (isDepot) {
                                        badgeColor = 'bg-green-100 text-green-700';
                                        typeLabel = 'Bắt đầu';
                                    } else if (isFactory) {
                                        badgeColor = 'bg-purple-100 text-purple-700';
                                        typeLabel = 'Hoàn thành';
                                    }

                                    return (
                                        <div key={log.id} className="relative">
                                            {/* Bullet dot */}
                                            <div className={`absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                                                isCheckin ? 'bg-amber-500' :
                                                isCheckout ? 'bg-blue-500' :
                                                isDepot ? 'bg-green-500' : 'bg-purple-500'
                                            }`} />
                                            
                                            <div className="text-xs text-left">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>{typeLabel}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 mt-1 font-medium leading-relaxed">{log.note}</p>
                                                {log.imageUrl && (
                                                    <div className="mt-1.5 max-w-[120px] rounded-lg overflow-hidden border border-slate-100 shadow-sm cursor-pointer" onClick={() => window.open(log.imageUrl, '_blank')}>
                                                        <img src={log.imageUrl} alt="evidence" className="w-full h-16 object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 w-full mt-auto mb-6">
                        <a
                            className="map-btn group relative flex items-center justify-center gap-2.5 w-full py-4 rounded-xl text-slate-700 font-bold text-sm"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${job.deliveryLatitude || 10.7231},${job.deliveryLongitude || 106.6124}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <span>Mở bản đồ dẫn đường</span>
                            <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-0.5 transition-transform text-base">
                                arrow_forward
                            </span>
                        </a>

                        <button
                            className="arrive-btn relative w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-base py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={handleArriveAtFactory}
                            disabled={submitting || !canConfirmArrival}
                        >
                            <span className="material-symbols-outlined text-2xl">where_to_vote</span>
                            {submitting ? 'Đang xác nhận...' : 'Xác nhận đã đến Nhà máy'}
                        </button>

                        {!canConfirmArrival && (
                            <p className="text-amber-600 text-center font-semibold text-[10px]">
                                * Vui lòng thực hiện tối thiểu 2 lần check-in và 2 lần check-out dọc đường để mở khóa nút xác nhận.
                            </p>
                        )}
                        <p className="text-center text-slate-400 text-[10px] mt-1">
                            Nhấn "Xác nhận đã đến" khi xe đã đỗ an toàn tại cổng nhà máy
                        </p>
                    </div>
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 pb-safe z-50">
                    <div className="max-w-md mx-auto flex justify-between items-end relative">
                        <Link to="/transport/market" className="nav-item flex flex-col items-center gap-1 p-2 w-16 text-slate-400">
                            <span className="material-symbols-outlined text-2xl">storefront</span>
                            <span className="text-[10px] font-medium">Chợ đơn</span>
                        </Link>
                        <Link to="/van-chuyen/chuyen-xe?tab=active" className="nav-item nav-item-active flex flex-col items-center gap-1 p-2 w-16 text-green-600">
                            <span className="material-symbols-outlined text-2xl font-semibold">local_shipping</span>
                            <span className="text-[10px] font-medium">Chuyến đi</span>
                        </Link>
                        <div className="relative -top-6">
                            <Link to="/van-chuyen/checkin" className="qr-btn bg-green-600 text-white h-14 w-14 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors border-4 border-slate-50">
                                <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                            </Link>
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                                QR Code
                            </span>
                        </div>
                        <Link to="/van-chuyen/chuyen-xe?tab=history" className="nav-item flex flex-col items-center gap-1 p-2 w-16 text-slate-400 font-medium">
                            <span className="material-symbols-outlined text-2xl">history</span>
                            <span className="text-[10px] font-medium">Lịch sử</span>
                        </Link>
                        <button
                            onClick={() => {
                                if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                                    logout();
                                    navigate('/dang-nhap');
                                }
                            }}
                            className="nav-item flex flex-col items-center gap-1 p-2 w-16 text-slate-400"
                        >
                            <span className="material-symbols-outlined text-2xl">logout</span>
                            <span className="text-[10px] font-medium">Đăng xuất</span>
                        </button>
                    </div>
                </nav>

            </div>
        </>
    );
}
