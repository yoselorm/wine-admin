import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { fetchDemand } from '../redux/InsightsSlice';
import toast from '../components/Toast';
import InsightAlert from '../components/InsightAlert';

const DemandTable = ({ title, rowLabel, rows }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">{title}</h3></div>
    {!rows || rows.length === 0 ? (
      <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
    ) : (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 text-xs uppercase tracking-wide bg-gray-50">
            <th className="px-5 py-2.5">{rowLabel}</th>
            <th className="px-4 py-2.5 text-right">Customers</th>
            <th className="px-4 py-2.5 text-right">Wines</th>
            <th className="px-5 py-2.5 text-right">Per Wine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => {
            const ratio = r.customers_per_wine;
            const thin = ratio != null && ratio >= 3;
            return (
              <tr key={r.label}>
                <td className={`px-5 py-2.5 capitalize ${r.unserved ? 'font-semibold text-red-700' : 'font-medium text-gray-700'}`}>{r.label}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{r.customers}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${r.unserved ? 'text-red-700' : 'text-gray-900'}`}>{r.wines}</td>
                <td className={`px-5 py-2.5 text-right ${ratio == null ? 'text-gray-300' : thin ? 'font-semibold text-yellow-600' : 'text-gray-500'}`}>
                  {ratio == null ? '—' : ratio.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);

const Demand = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.demand);

  useEffect(() => { dispatch(fetchDemand()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  const preferenceGroups = Object.entries(data?.preferences || {});
  const unserved = [
    ...(data?.colour || []).filter((r) => r.unserved),
    ...Object.values(data?.preferences || {}).flat().filter((r) => r.unserved),
    ...(data?.budget || []).filter((r) => r.unserved),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Demand</h1>
        <p className="text-sm text-gray-500 mt-1">
          What customers ask for, next to what the cellar can serve.
          {data?.customers_with_a_profile ? ` Built from ${data.customers_with_a_profile} customer taste profiles.` : ''}
        </p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : error ? (
        <InsightAlert title="Couldn't load demand data">{error}</InsightAlert>
      ) : (
        <>
          {unserved.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-red-700 mb-2">Stated preferences nothing can serve</p>
              <div className="space-y-1.5">
                {unserved.map((r) => (
                  <div key={r.label} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 font-medium text-gray-900 capitalize">{r.label}</span>
                    <span className="text-xs text-gray-500">{r.customers} customers</span>
                    <span className="text-xs font-semibold text-red-700">0 wines</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DemandTable title="By Colour" rowLabel="Colour" rows={data?.colour} />
            <DemandTable title="By Budget" rowLabel="Band" rows={data?.budget} />
            {preferenceGroups.map(([group, rows]) => (
              <DemandTable key={group} title={group.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} rowLabel="Preference" rows={rows} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Recommended vs Bought</h3></div>
              {!data?.recommended_against_bought?.top_recommended?.length && !data?.recommended_against_bought?.top_selling?.length ? (
                <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wide bg-gray-50">
                      <th className="px-5 py-2.5">Top Recommended</th><th className="px-2 py-2.5 text-right"></th>
                      <th className="px-4 py-2.5">Top Selling</th><th className="px-5 py-2.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.recommended_against_bought.top_recommended || []).map((w, i) => {
                      const sold = (data.recommended_against_bought.top_selling || [])[i];
                      return (
                        <tr key={w.id || i}>
                          <td className="px-5 py-2.5 text-gray-700 truncate max-w-[160px]">{w.name}</td>
                          <td className="px-2 py-2.5 text-right font-bold text-gray-900">{w.count}</td>
                          <td className="px-4 py-2.5 text-gray-700 truncate max-w-[160px]">{sold?.name || ''}</td>
                          <td className="px-5 py-2.5 text-right font-bold text-gray-900">{sold?.count ?? ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {data?.never_recommended?.count > 0 && (
                <div className="px-5 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{data.never_recommended.count} wines have never been recommended to anyone</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-900">Recommendation Feedback</h3></div>
              <div className="p-5">
                {!data?.feedback ? (
                  <p className="text-sm text-gray-400 text-center py-3">No data yet.</p>
                ) : (
                  <>
                    <div className="flex gap-7 mb-5">
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p><p className="text-2xl font-bold text-gray-900">{data.feedback.total_recommendations}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Liked</p><p className="text-2xl font-bold text-green-600">{data.feedback.liked}</p></div>
                      <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Disliked</p><p className="text-2xl font-bold text-red-600">{data.feedback.disliked}</p></div>
                    </div>
                    <div className="space-y-2">
                      {(data.feedback.by_colour || []).map((c) => {
                        const fillColour = c.approval < 50 ? 'bg-red-500' : c.approval < 70 ? 'bg-yellow-500' : 'bg-green-500';
                        return (
                          <div key={c.colour} className="flex items-center gap-3">
                            <span className="flex-1 text-sm text-gray-700">{c.colour}</span>
                            <span className="w-[140px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <span className={`block h-full rounded-full ${fillColour}`} style={{ width: `${c.approval}%` }} />
                            </span>
                            <span className="text-sm font-semibold text-gray-900 w-12 text-right">{c.approval.toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Demand;
