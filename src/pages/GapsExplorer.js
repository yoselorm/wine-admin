import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, AlertTriangle, PlayCircle, Info } from 'lucide-react';
import {
  fetchCoverage,
  simulateCoverage,
  fetchGaps,
  fetchDemand,
  clearSimulation,
} from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const SEVERITY_TONE = { high: 'red', medium: 'yellow', low: 'sky' };

const pct = (n) => `${Math.round((n || 0) * 100) / 1}%`;

const OptionReach = ({ option }) => {
  const reach = Math.round((option.reach || 0) * 100);
  const zero = (option.wines || 0) === 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={zero ? 'text-red-600 font-semibold' : 'text-gray-600'}>{option.label}</span>
        <span className={zero ? 'text-red-600 font-bold' : 'text-gray-500'}>
          {option.wines} wine{option.wines === 1 ? '' : 's'} · {pct(option.reach)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${zero ? 'bg-red-400' : 'bg-violet-500'}`} style={{ width: `${Math.max(reach, zero ? 100 : 0)}%`, opacity: zero ? 0.25 : 1 }} />
      </div>
    </div>
  );
};

const CoverageTab = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.coverage);
  const { data: simResult, loading: simLoading } = useSelector((s) => s.insights.simulation);
  const [answers, setAnswers] = useState({});

  useEffect(() => { dispatch(fetchCoverage()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);
  useEffect(() => () => dispatch(clearSimulation()), [dispatch]);

  if (loading && !data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;
  if (!data) return null;

  const filterableQuestions = data.questions?.filter((q) => q.narrows_catalogue) || [];
  const cosmeticQuestions = data.questions?.filter((q) => !q.narrows_catalogue) || [];

  const runSimulation = () => {
    const cleaned = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== '' && (!Array.isArray(v) || v.length)));
    dispatch(simulateCoverage(cleaned));
  };

  return (
    <div className="space-y-5">
      {data.blind_spots?.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500" />
            <p className="text-sm font-bold text-red-700">{data.blind_spots.length} answers currently reach zero wines</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.blind_spots.map((b, i) => (
              <Badge key={i} tone="red" size="sm">{b.label || b.option_label || b}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filterableQuestions.map((q) => (
          <Card key={q.key} title={q.prompt || q.key}>
            <div className="space-y-3">
              {q.options?.map((o) => <OptionReach key={o.label} option={o} />)}
            </div>
          </Card>
        ))}
      </div>

      {cosmeticQuestions.length > 0 && (
        <Card title="Wording-only questions">
          <p className="text-xs text-gray-400 mb-3">These shape how the sommelier talks, not which wines are shown — they reach the full catalogue by definition, so a percentage here would be misleading.</p>
          <div className="flex flex-wrap gap-2">
            {cosmeticQuestions.map((q) => <Badge key={q.key} tone="sky" size="sm">{q.prompt || q.key}</Badge>)}
          </div>
        </Card>
      )}

      <Card title="Simulator" action={<span className="text-xs text-gray-400">See exactly what a customer with these answers would be shown</span>}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {data.questions?.map((q) => (
            <div key={q.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{q.prompt || q.key}</label>
              <select
                value={answers[q.key] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Not answered</option>
                {q.options?.map((o) => <option key={o.value || o.label} value={o.value || o.label}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={runSimulation} disabled={simLoading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50">
          {simLoading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Run Simulation
        </button>

        {simResult && (
          <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
            <div className="flex gap-6">
              <div><p className="text-xs text-gray-400">Wines shown</p><p className="text-2xl font-bold text-gray-900">{simResult.wines}</p></div>
              <div><p className="text-xs text-gray-400">Within budget</p><p className="text-2xl font-bold text-gray-900">{simResult.within_budget}</p></div>
              <div><p className="text-xs text-gray-400">Personalised</p><Badge tone={simResult.personalised ? 'green' : 'yellow'} size="lg">{simResult.personalised ? 'Yes' : 'No'}</Badge></div>
            </div>

            {simResult.steps?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Funnel</p>
                <div className="space-y-1.5">
                  {simResult.steps.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-md border ${s.applied ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                      <span className="font-medium text-gray-700">{s.constraint}: {Array.isArray(s.value) ? s.value.join(', ') : String(s.value)}</span>
                      <span className={s.applied ? 'text-gray-600' : 'text-gray-400 italic'}>
                        {s.matches} matches {!s.applied && '· dropped'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {simResult.dropped?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <p className="text-xs font-bold text-yellow-800 mb-1.5">Silently dropped — this customer never sees these constraints failed</p>
                {simResult.dropped.map((d, i) => (
                  <p key={i} className="text-xs text-yellow-700">
                    <strong>{d.constraint}: {String(d.value)}</strong> — {d.reason}
                  </p>
                ))}
              </div>
            )}

            {simResult.sample?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sample results</p>
                <div className="flex flex-wrap gap-2">
                  {simResult.sample.map((w) => (
                    <span key={w.id} className="text-xs bg-gray-50 border border-gray-100 rounded-md px-2 py-1">{w.name} · ₵{w.price}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

const HealthTab = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.gaps);
  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => { dispatch(fetchGaps()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  if (loading && !data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;
  if (!data) return null;

  const checks = [...(data.checks || [])].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        {['high', 'medium', 'low'].map((sev) => (
          <div key={sev} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
            <Badge tone={SEVERITY_TONE[sev]} size="lg">{sev}</Badge>
            <span className="text-lg font-bold text-gray-900">{data.summary?.[sev] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {checks.map((check) => {
          const expanded = expandedKey === check.key;
          return (
            <Card key={check.key} action={<Badge tone={SEVERITY_TONE[check.severity] || 'neutral'} size="lg">{check.count}</Badge>}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900">{check.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{check.detail}</p>
                  {check.fix && (
                    <p className="text-xs text-violet-600 mt-2"><strong>Fix:</strong> {check.fix}</p>
                  )}
                </div>
              </div>
              {check.items?.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button onClick={() => setExpandedKey(expanded ? null : check.key)} className="text-xs font-semibold text-gray-500 hover:text-gray-800">
                    {expanded ? 'Hide' : 'Show'} {check.items.length} item{check.items.length === 1 ? '' : 's'}
                  </button>
                  {expanded && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {check.items.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-50 border border-gray-100 rounded-md px-2 py-1 text-gray-600">
                          {typeof item === 'string' ? item : item.name || item.label || JSON.stringify(item)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const DemandRow = ({ row }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${row.unserved ? 'bg-red-50 border border-red-100' : 'border border-transparent'}`}>
    <span className={`font-medium ${row.unserved ? 'text-red-700' : 'text-gray-700'} capitalize`}>{row.label}</span>
    <div className="flex items-center gap-4 text-xs">
      <span className="text-gray-400">{row.customers} customers</span>
      <span className="text-gray-400">{row.wines} wines</span>
      {row.unserved ? (
        <Badge tone="red" size="sm">Unserved</Badge>
      ) : (
        <span className="font-semibold text-gray-800 w-14 text-right">
          {row.customers_per_wine == null ? '—' : `${row.customers_per_wine.toFixed(1)}/wine`}
        </span>
      )}
    </div>
  </div>
);

const DemandTab = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.demand);

  useEffect(() => { dispatch(fetchDemand()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);

  if (loading && !data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>;

  const isEmpty = !data || (data.customers_with_a_profile === 0 && !data.colour?.length);

  if (isEmpty) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-400">
          <Info size={22} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">No demand data yet.</p>
          <p className="text-xs mt-1">Orders, recommendations and customer profiles only exist in production — this fills in once live.</p>
        </div>
      </Card>
    );
  }

  const preferenceGroups = Object.entries(data.preferences || {});

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="By colour">
          <div className="space-y-1">{data.colour?.map((r) => <DemandRow key={r.label} row={r} />)}</div>
        </Card>
        <Card title="By budget">
          <div className="space-y-1">{data.budget?.map((r) => <DemandRow key={r.label} row={r} />)}</div>
        </Card>
      </div>

      {preferenceGroups.map(([group, rows]) => (
        <Card key={group} title={group.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
          <div className="space-y-1">{rows.map((r) => <DemandRow key={r.label} row={r} />)}</div>
        </Card>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Recommended by the sommelier">
          {data.recommended_against_bought?.top_recommended?.length ? (
            <div className="space-y-1.5">
              {data.recommended_against_bought.top_recommended.map((w) => (
                <div key={w.id} className="text-sm text-gray-700 flex justify-between"><span>{w.name}</span><span className="text-gray-400">{w.count}×</span></div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No recommendations yet.</p>}
        </Card>
        <Card title="Actually bought">
          {data.recommended_against_bought?.top_selling?.length ? (
            <div className="space-y-1.5">
              {data.recommended_against_bought.top_selling.map((w) => (
                <div key={w.id} className="text-sm text-gray-700 flex justify-between"><span>{w.name}</span><span className="text-gray-400">{w.count}×</span></div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No sales yet.</p>}
        </Card>
      </div>

      {data.feedback && (
        <Card title="Recommendation feedback">
          <div className="flex gap-6 mb-4">
            <div><p className="text-xs text-gray-400">Total</p><p className="text-xl font-bold text-gray-900">{data.feedback.total_recommendations}</p></div>
            <div><p className="text-xs text-gray-400">Liked</p><p className="text-xl font-bold text-green-600">{data.feedback.liked}</p></div>
            <div><p className="text-xs text-gray-400">Disliked</p><p className="text-xl font-bold text-red-600">{data.feedback.disliked}</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.feedback.by_colour?.map((c) => (
              <Badge key={c.colour} tone="neutral" size="sm">{c.colour}: {c.approval}% approval</Badge>
            ))}
          </div>
        </Card>
      )}

      {data.never_recommended?.count > 0 && (
        <Card title={`Never recommended to anyone (${data.never_recommended.count})`}>
          <div className="flex flex-wrap gap-1.5">
            {data.never_recommended.wines?.map((w) => (
              <span key={w.id || w.name} className="text-xs bg-gray-50 border border-gray-100 rounded-md px-2 py-1 text-gray-600">{w.name}</span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const GapsExplorer = () => {
  const [tab, setTab] = useState('coverage');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gaps Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">What's missing — a to-do list, not a browse screen.</p>
      </div>

      <div className="flex gap-1.5 border-b border-gray-200">
        {[['coverage', 'Quiz Coverage'], ['health', 'Data Health'], ['demand', 'Demand']].map(([key, lbl]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>{lbl}</button>
        ))}
      </div>

      {tab === 'coverage' && <CoverageTab />}
      {tab === 'health' && <HealthTab />}
      {tab === 'demand' && <DemandTab />}
    </div>
  );
};

export default GapsExplorer;
