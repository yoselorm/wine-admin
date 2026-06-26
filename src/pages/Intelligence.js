import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIntelligenceAlerts, fetchMarketIndicators, clearIntelligenceError } from '../redux/IntelligenceSlice';
import { AlertTriangle, BarChart3, Bell, Loader2, RefreshCw, Globe, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import toast from '../components/Toast';

const Intelligence = () => {
  const dispatch = useDispatch();
  
  // Get data and states from our Redux store
  const { alerts, indicators, alertsLoading, indicatorsLoading, error } = useSelector(state => state.intelligence);
  
  // Manage rows limit for alerts page query
  const [alertLimit, setAlertLimit] = useState(10);

  // Load datasets from backend
  const loadData = () => {
    dispatch(fetchIntelligenceAlerts({ limit: alertLimit }));
    dispatch(fetchMarketIndicators());
  };

  useEffect(() => {
    loadData();
  }, [alertLimit]);

  // Show error messages if they happen
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearIntelligenceError());
    }
  }, [error, dispatch]);

  // Helper to make dates nice and readable (e.g., Oct 29, 2025)
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Safe JSON list parser for affected varietals array string
  const parseVarietals = (jsonStr) => {
    try {
      if (!jsonStr) return [];
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Intelligence Center</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            View live alerts, emergency notifications, and current global market trackers.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={alertsLoading || indicatorsLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={alertsLoading || indicatorsLoading ? "animate-spin" : ""} />
          Refresh feeds
        </button>
      </div>

      {/* Main Grid splitting alerts and indicators */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* 1. Alerts Pane */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Active Alerts</h2>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">Rows:</span>
              <select
                value={alertLimit}
                onChange={(e) => setAlertLimit(Number(e.target.value))}
                className="px-2 py-1 border border-zinc-200 rounded-md bg-white focus:outline-none text-zinc-700 font-medium"
              >
                <option value={10}>10 records</option>
                <option value={25}>25 records</option>
                <option value={50}>50 records</option>
              </select>
            </div>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {alertsLoading && alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 text-xs py-20">
                <Loader2 size={20} className="animate-spin" />
                <span>Reading active alert feeds...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-24 text-zinc-400 text-xs space-y-2">
                <AlertTriangle size={24} className="text-zinc-300 mx-auto" />
                <p>No warning notifications listed at this time.</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const varietals = parseVarietals(alert.affected_varietals);
                const isCritical = alert.severity === 'critical';

                return (
                  <div 
                    key={alert.id} 
                    className={`p-4 border rounded-xl space-y-3 relative overflow-hidden transition-all ${
                      isCritical ? 'border-red-200 bg-red-50/10' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    {/* Severity & Info Badges row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded ${
                          isCritical ? 'bg-red-600 text-white' : 'bg-zinc-950 text-white'
                        }`}>
                          {alert.severity || 'Normal'}
                        </span>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                          Type: {alert.type}
                        </span>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded flex items-center gap-1">
                          <Globe size={10} /> {alert.region}
                        </span>
                      </div>
                      <span className="text-zinc-400 font-medium lowercase">
                        {formatReadableDate(alert.published_at || alert.created_at)}
                      </span>
                    </div>

                    {/* Alert Title & Main description context */}
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-zinc-900 leading-snug">{alert.title}</h3>
                      <p className="text-zinc-600 text-xs leading-relaxed font-medium">{alert.content}</p>
                    </div>

                    {/* Meta breakdowns: Actions, Impact Windows & Varietals chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] border-t border-dashed border-zinc-100 text-zinc-600">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-zinc-400">Action Plan:</span>
                        <p className="font-medium text-zinc-800">{alert.recommended_action || 'None assigned'}</p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-zinc-400">Timeframe Window / Impact:</span>
                        <p className="font-medium text-zinc-800">
                          {alert.urgency_window || 'N/A'} <span className="text-zinc-400 mx-1">•</span> {alert.import_impact || 'No impact logs'}
                        </p>
                      </div>
                    </div>

                    {/* Footer bar for chips lists & external linking profiles */}
                    <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                      <div className="flex flex-wrap items-center gap-1">
                        {varietals.map((v, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-zinc-100 text-zinc-500 rounded">
                            #{v}
                          </span>
                        ))}
                      </div>

                      {alert.source_url && (
                        <a 
                          href={alert.source_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          View source <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Indicators Pane */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Market Trackers</h2>
            </div>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {indicatorsLoading && indicators.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 text-xs py-20">
                <Loader2 size={20} className="animate-spin" />
                <span>Reading live market changes...</span>
              </div>
            ) : indicators.length === 0 ? (
              <div className="text-center py-24 text-zinc-400 text-xs">
                <BarChart3 size={24} className="text-zinc-300 mx-auto mb-2" />
                <p>No active market indicators found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-600 min-w-[500px]">
                  <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-28">Symbol / Code</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Value (Unit)</th>
                      <th className="py-2.5 px-3 text-right w-24">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                    {indicators.map((indicator) => {
                      const changeNum = parseFloat(indicator.percentage_change || 0);
                      const isPositive = changeNum >= 0;

                      return (
                        <tr key={indicator.id} className="hover:bg-zinc-50/40 transition-colors">
                          <td className="py-3.5 px-3 font-bold font-mono text-zinc-950">
                            {indicator.symbol}
                          </td>
                          <td className="py-3.5 px-3 text-zinc-900 capitalize">
                            {indicator.name}
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                            <span className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-200/60 rounded">
                              {indicator.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-zinc-900">
                            {parseFloat(indicator.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-[10px] text-zinc-400 font-medium font-sans ml-1">
                              {indicator.currency_or_unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-[11px] rounded-md px-1.5 py-0.5 ${
                              isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'
                            }`}>
                              {isPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                              {Math.abs(changeNum).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Intelligence;