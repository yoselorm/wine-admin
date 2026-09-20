import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, PlayCircle } from 'lucide-react';
import { fetchCoverage, simulateCoverage, clearSimulation } from '../redux/InsightsSlice';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';
import InsightAlert from '../components/InsightAlert';

const QuizCoverage = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.insights.coverage);
  const { data: sim, loading: simLoading } = useSelector((s) => s.insights.simulation);
  const [answers, setAnswers] = useState({});

  useEffect(() => { dispatch(fetchCoverage()); }, [dispatch]);
  useEffect(() => { if (error) toast.error(error); }, [error]);
  useEffect(() => () => dispatch(clearSimulation()), [dispatch]);

  const questions = data?.questions || [];
  const blindSpots = data?.blind_spots || [];
  const unrecognized = data && questions.length === 0;

  useEffect(() => {
    if (unrecognized) {
      // eslint-disable-next-line no-console
      console.warn('[QuizCoverage] /insights/coverage responded but no field matched the expected shape:', data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Budget first, then the rest of the narrowing questions — same order the design uses so the
  // funnel reads top to bottom the way a customer actually answers.
  const budgetQ = questions.find((q) => q.key === 'budget');
  const simQuestions = [budgetQ, ...questions.filter((q) => q.narrows_catalogue && q.key !== 'budget')].filter(Boolean);

  const runSimulation = () => {
    const cleaned = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== '' && (!Array.isArray(v) || v.length)));
    dispatch(simulateCoverage(cleaned));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quiz Coverage</h1>
        <p className="text-sm text-gray-500 mt-1">Every quiz answer against the wines it can actually reach.</p>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : error ? (
        <InsightAlert title="Couldn't load quiz coverage">{error}</InsightAlert>
      ) : !data ? (
        <p className="text-sm text-gray-400 py-10 text-center">No coverage data returned yet.</p>
      ) : unrecognized ? (
        <InsightAlert tone="yellow" title="The endpoint responded, but nothing on this page recognised it">
          Expected a <code className="font-mono">questions[]</code> array. The raw response is logged to the console.
        </InsightAlert>
      ) : (
        <>
          {blindSpots.length > 0 && (
            <div className="flex items-start gap-3.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
              <Badge tone="red" size="lg">{blindSpots.length} answers</Badge>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700">Answers that reach no wines at all</p>
                <p className="text-xs text-red-600/80 mt-0.5">{blindSpots.map((b) => b.label || b.option_label || b).join(' · ')}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
            <div className="grid gap-5">
              {questions.map((q) => {
                const narrowing = !!q.narrows_catalogue;
                return (
                  <div key={q.key} className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                      <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900">{q.prompt}</span>
                      <Badge tone={narrowing ? 'violet' : 'neutral'}>{narrowing ? 'Filters wines' : 'Wording only'}</Badge>
                    </div>
                    <div className="py-1.5">
                      {q.options?.map((o) => {
                        const dead = narrowing && (o.wines || 0) === 0;
                        const pct = Math.round((o.reach || 0) * 100);
                        return (
                          <div key={o.label} className="flex items-center gap-3 px-5 py-1.5">
                            <span className={`flex-1 min-w-0 text-sm truncate ${dead ? 'text-red-600 font-semibold' : 'text-gray-700 font-medium'}`}>{o.label}</span>
                            {narrowing ? (
                              <span className="w-[90px] h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                <span className={`block h-full rounded-full ${dead ? 'bg-red-400' : pct < 10 ? 'bg-yellow-400' : 'bg-violet-500'}`}
                                  style={{ width: `${dead ? 100 : pct}%`, opacity: dead ? 0.5 : 1 }} />
                              </span>
                            ) : (
                              <span className="w-[90px] text-center text-xs text-gray-300 flex-shrink-0">—</span>
                            )}
                            <span className="text-xs font-semibold text-gray-800 w-16 text-right flex-shrink-0">{narrowing ? `${o.wines} wines` : '—'}</span>
                            <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">{narrowing ? `${pct}%` : 'n/a'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden sticky top-5">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Simulator</h3>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-500 mb-4">Answer as a customer would and see what the sommelier can actually offer them.</p>

                <div className="grid gap-3 mb-4">
                  {simQuestions.map((q) => (
                    <div key={q.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{q.prompt}</label>
                      <select value={answers[q.key] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                        className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                        <option value="">— skip —</option>
                        {q.options?.map((o) => <option key={o.value || o.label} value={o.value || o.label}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <button onClick={runSimulation} disabled={simLoading}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 mb-4">
                  {simLoading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />} Run Simulation
                </button>

                {sim && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-md px-3.5 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Within Budget</p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">{sim.within_budget}</p>
                      </div>
                      <div className="bg-gray-50 rounded-md px-3.5 py-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Can Be Offered</p>
                        <p className={`text-2xl font-bold mt-0.5 ${sim.wines === 0 ? 'text-red-600' : 'text-green-600'}`}>{sim.wines}</p>
                      </div>
                    </div>

                    {sim.steps?.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Funnel</p>
                        <div className="space-y-1.5 mb-2">
                          {sim.steps.map((st, i) => (
                            <div key={i} className="flex items-center gap-2.5 py-1">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.applied ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="flex-1 min-w-0 text-xs text-gray-700 truncate">{st.constraint}: {Array.isArray(st.value) ? st.value.join(', ') : String(st.value)}</span>
                              <span className={`text-xs font-semibold flex-shrink-0 ${st.applied ? 'text-gray-900' : 'text-red-600'}`}>
                                {st.matches}{!st.applied && ' · dropped'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {sim.dropped?.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-3">
                        <p className="text-xs font-semibold text-red-700 mb-1.5">Silently dropped</p>
                        {sim.dropped.map((d, i) => (
                          <p key={i} className="text-xs text-red-600/90"><strong>{d.constraint}</strong> — {d.reason}</p>
                        ))}
                        <p className="text-xs text-red-600/70 italic mt-1.5">The customer asked for this and was shown something else instead, with no explanation.</p>
                      </div>
                    )}
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

export default QuizCoverage;
