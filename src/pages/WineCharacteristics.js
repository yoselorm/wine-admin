import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Gauge } from 'lucide-react';
import { fetchCatalogueInsights } from '../redux/InsightsSlice';
import { TASTING_AXES } from '../utils/tastingAxes';

const STATUS = (pct) => (pct < 20 ? { label: 'Too thin', tone: 'text-red-600 bg-red-50' } : pct < 50 ? { label: 'Patchy', tone: 'text-yellow-700 bg-yellow-50' } : { label: 'Good', tone: 'text-green-700 bg-green-50' });

// There's no standalone CRUD for tasting scores — the eight axes below are a fixed vocabulary the
// matching logic depends on (quiz coverage, the sommelier, insights), not admin-editable content.
// This page exists to explain what each one means and show real coverage, pulling the same
// numbers as Insights → Catalogue rather than maintaining a second copy of them.
const WineCharacteristics = () => {
  const dispatch = useDispatch();
  const { data } = useSelector((s) => s.insights.catalogue);

  useEffect(() => { dispatch(fetchCatalogueInsights()); }, [dispatch]);

  const totalWines = data?.totals?.wines;
  const axisTop = data?.dimensions?.axis?.top || data?.dimensions?.axis?.values || [];
  const coverageFor = (key) => axisTop.find((a) => (a.label || '').toLowerCase() === key);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wine Characteristics</h1>
        <p className="text-sm text-gray-500 mt-1">
          The eight tasting axes every wine can be scored on, 0–10, from the product form. Fixed by the
          matching logic — not something to add to or rename here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {TASTING_AXES.map((axis) => {
          const cov = coverageFor(axis.key);
          const pct = cov && totalWines ? Math.round((cov.wines / totalWines) * 100) : null;
          const status = pct !== null ? STATUS(pct) : null;
          return (
            <div key={axis.key} className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">{axis.label}</h3>
              </div>
              <div className="p-5 flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">{axis.description}</p>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                {cov ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{cov.wines}{totalWines ? ` of ${totalWines}` : ''} scored{cov.avg != null ? ` · avg ${Number(cov.avg).toFixed(1)}` : ''}</span>
                    {status && <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${status.tone}`}>{status.label}</span>}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 flex items-center gap-1.5"><Gauge size={12} /> Coverage data unavailable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WineCharacteristics;
