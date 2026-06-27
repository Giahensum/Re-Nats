import React, { useState, useEffect, useRef } from 'react';

// ── Haversine distance (km) ────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MATERIAL_LABEL = {
  STEEL: 'Sắt thép', ALUMINUM: 'Nhôm', COPPER: 'Đồng', LEAD: 'Chì/Ắc quy',
  PET: 'Nhựa PET', HDPE: 'Nhựa HDPE', PP: 'Nhựa PP', PVC: 'Nhựa PVC',
  CARDBOARD: 'Giấy carton', PAPER: 'Giấy thải', BATTERY: 'Pin Lithium',
  ELECTRONIC_WASTE: 'Điện tử', RUBBER: 'Cao su', OIL: 'Dầu nhớt',
  IRON: 'Sắt vụn', OTHER: 'Khác',
};

const MATERIAL_ICON = {
  STEEL: '⚙️', ALUMINUM: '🔩', COPPER: '🔶', LEAD: '🔋',
  PET: '♻️', HDPE: '🪣', PP: '🛒', PVC: '🧱',
  CARDBOARD: '📦', PAPER: '📄', BATTERY: '⚡', ELECTRONIC_WASTE: '💻',
  RUBBER: '🛞', OIL: '🛢️', IRON: '⚙️', OTHER: '🏭',
};




// ── Simple Leaflet Map (dynamically loaded) ────────────────────────────────────
function FactoryMap({ factories, selectedId, onSelect, depotLat, depotLng }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Load Leaflet CSS nếu chưa có
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let L;
    const initMap = async () => {
      if (!window.L) {
        await new Promise((res) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = res;
          document.head.appendChild(s);
        });
      }
      L = window.L;

      if (leafletRef.current) return; // already inited

      const centerLat = depotLat || factories[0]?.latitude || 10.8;
      const centerLng = depotLng || factories[0]?.longitude || 106.65;

      const map = L.map(mapRef.current).setView([centerLat, centerLng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      leafletRef.current = map;

      // Depot marker
      if (depotLat && depotLng) {
        L.marker([depotLat, depotLng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="background:#1d4ed8;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px #0003;border:2px solid #fff">🏪</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14],
          })
        }).addTo(map).bindPopup('📍 Kho của bạn');
      }
    };

    initMap();
  }, []);

  // Update markers when factories or selectedId changes
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    factories.forEach(f => {
      if (!f.latitude || !f.longitude) return;
      const isSelected = f.id === selectedId;
      const marker = L.marker([f.latitude, f.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div style="background:${isSelected ? '#16a34a' : '#fff'};color:${isSelected ? '#fff' : '#16a34a'};border:2px solid #16a34a;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 8px #0004;cursor:pointer;transition:all 0.2s">${MATERIAL_ICON[f.primaryMaterialType] || '🏭'}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        })
      })
        .addTo(leafletRef.current)
        .bindPopup(`
          <div style="min-width:180px">
            <p style="font-weight:700;margin-bottom:4px">${f.companyName}</p>
            <p style="font-size:12px;color:#64748b">${f.province}</p>
            ${f.distanceKm != null ? `<p style="font-size:12px;color:#16a34a;font-weight:600">📍 ${f.distanceKm} km</p>` : ''}
            <button onclick="window._selectFactory('${f.id}')" style="margin-top:8px;background:#16a34a;color:#fff;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px;width:100%">Chọn nhà máy này</button>
          </div>
        `)
        .on('click', () => onSelect(f));
      markersRef.current.push(marker);
    });

    window._selectFactory = (id) => {
      const f = factories.find(x => x.id === id);
      if (f) onSelect(f);
    };
  }, [factories, selectedId]);

  return (
    <div ref={mapRef} style={{ height: '360px', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }} />
  );
}

// ── Main FactoryPickerModal ────────────────────────────────────────────────────
export default function FactoryPickerModal({ materialType, depotProfile, onSelect, onClose }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const depotLat = depotProfile?.latitude ? parseFloat(depotProfile.latitude) : null;
  const depotLng = depotProfile?.longitude ? parseFloat(depotProfile.longitude) : null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { depotService } = await import('../../services/depotService');
        let data = await depotService.getMatchingFactories(materialType, depotLat, depotLng);
        if (!data) data = [];

        // Tính khoảng cách phía client nếu BE chưa trả về
        const withDist = data.map(f => ({
          ...f,
          distanceKm: f.distanceKm != null
            ? f.distanceKm
            : (depotLat && depotLng && f.latitude && f.longitude
              ? Math.round(haversineKm(depotLat, depotLng, parseFloat(f.latitude), parseFloat(f.longitude)) * 10) / 10
              : null)
        }));
        withDist.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        setFactories(withDist);
      } catch {
        setFactories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [materialType]);


  const handleSelect = (f) => {
    setSelectedId(f.id);
  };

  const handleConfirm = () => {
    const f = factories.find(x => x.id === selectedId);
    if (f) onSelect(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg">Chọn nhà máy tái chế</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Hiển thị nhà máy nhận&nbsp;
              <span className="text-green-700 font-bold">
                {MATERIAL_ICON[materialType]} {MATERIAL_LABEL[materialType] || materialType}
              </span>
              , sắp xếp theo quãng đường gần nhất
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toggle List/Map */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-2">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-base">list</span> Danh sách
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'map' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <span className="material-symbols-outlined text-base">map</span> Bản đồ
          </button>
          <span className="ml-auto text-xs text-slate-400">{factories.length} nhà máy phù hợp</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Đang tìm nhà máy phù hợp...</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3 pt-2">
              {factories.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-4xl mb-2">🏭</p>
                  <p className="font-semibold">Chưa có nhà máy nào đăng ký loại vật liệu này</p>
                </div>
              )}
              {factories.map((f, idx) => {
                const isSelected = f.id === selectedId;
                const isNearest = idx === 0 && f.distanceKm != null;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelect(f)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md ${isSelected ? 'border-green-500 bg-green-50' : isNearest ? 'border-green-300 bg-white' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${isSelected ? 'bg-green-100' : isNearest ? 'bg-green-50' : 'bg-slate-100'}`}>
                        {MATERIAL_ICON[f.primaryMaterialType] || '🏭'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 text-sm">{f.companyName}</p>
                          {isNearest && (
                            <span className="text-[10px] font-extrabold bg-green-600 text-white px-2 py-0.5 rounded-full">🥇 Gần nhất</span>
                          )}
                          {f.isPremium && (
                            <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">⭐ PREMIUM</span>
                          )}
                          {isSelected && (
                            <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">✓ Đã chọn</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{f.address || f.province}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                            {MATERIAL_ICON[f.primaryMaterialType]} {MATERIAL_LABEL[f.primaryMaterialType] || f.primaryMaterialType}
                          </span>
                          {f.capacityPerMonthTon && (
                            <span className="text-xs text-slate-500">🏋️ {f.capacityPerMonthTon.toLocaleString('vi-VN')} tấn/tháng</span>
                          )}
                          {f.minPurityRequired && (
                            <span className="text-xs text-slate-500">🔬 ≥ {f.minPurityRequired}%</span>
                          )}
                          {f.distanceKm != null ? (
                            <span className={`text-xs font-extrabold px-3 py-1 rounded-lg flex items-center gap-1 ${
                              f.distanceKm < 30 ? 'bg-green-100 text-green-700 border border-green-200'
                              : f.distanceKm < 100 ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              <span className="text-[11px]">📍</span> {f.distanceKm} km
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa có tọa độ</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="pt-2">
              <FactoryMap
                factories={factories}
                selectedId={selectedId}
                onSelect={handleSelect}
                depotLat={depotLat}
                depotLng={depotLng}
              />
              {selectedId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-semibold">
                  ✓ Đã chọn: {factories.find(f => f.id === selectedId)?.companyName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition">
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-sm"
          >
            Xác nhận chọn nhà máy
          </button>
        </div>
      </div>
    </div>
  );
}
