import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIntelligenceAlerts, fetchMarketIndicators, clearIntelligenceError } from '../redux/IntelligenceSlice';
import { AlertTriangle, Loader2, BarChart3 } from 'lucide-react';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const SEVERITY_TONE = { high: 'red', critical: 'red', medium: 'yellow', low: 'sky' };
const SEVERITIES = ['high', 'medium', 'low'];

const formatReadableDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const Intelligence = () => {
  const dispatch = useDispatch();
  const { alerts, indicators, alertsLoading, indicatorsLoading, error } = useSelector((state) => state.intelligence);
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    dispatch(fetchIntelligenceAlerts({ limit: 10, severity: severity || undefined, is_active: true }));
  }, [dispatch, severity]);

  useEffect(() => {
    dispatch(fetchMarketIndicators());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearIntelligenceError());
    }
  }, [error, dispatch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated market alerts and indicators for import decisions. Read-only feed.</p>
        </div>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {indicatorsLoading && indicators.length === 0 ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
      ) : indicators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {indicators.map((ind) => {
            const change = parseFloat(ind.percentage_change ?? 0);
            const isPositive = change >= 0;
            return (
              <Card key={ind.id || ind.symbol}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{ind.name}</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {ind.currency_or_unit && !/^[a-z%]/i.test(ind.currency_or_unit) ? ind.currency_or_unit : ''}
                    {parseFloat(ind.current_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    {ind.currency_or_unit && /^[a-z%]/i.test(ind.currency_or_unit) ? ind.currency_or_unit : ''}
                  </p>
                  <Badge tone={isPositive ? 'green' : 'red'} size="lg">{isPositive ? '+' : ''}{change}%</Badge>
                </div>
                {ind.type && <p className="text-xs text-gray-400 mt-1">{ind.type}</p>}
              </Card>
            );
          })}
        </div>
      ) : null}

      {alertsLoading && alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle size={22} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active alerts right now.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts?.map((alert) => (
            <Card key={alert.id}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <Badge tone={SEVERITY_TONE[alert.severity?.toLowerCase()] || 'neutral'} size="lg">{alert.severity}</Badge>
                  <h3 className="text-base font-bold text-gray-900">{alert.title}</h3>
                </div>
                <span className="text-sm text-gray-400 flex-shrink-0">{formatReadableDate(alert.published_at || alert.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{alert.content}</p>
              {alert.recommended_action && (
                <p className="text-sm text-gray-700 mt-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Recommended</span>
                  {alert.recommended_action}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {!indicatorsLoading && indicators.length === 0 && !alertsLoading && alerts.length === 0 && (
        <Card>
          <div className="text-center py-8 text-gray-400">
            <BarChart3 size={22} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No intelligence data available yet.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Intelligence;
