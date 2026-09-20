import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, Loader2, Plus, Bot, User, Gauge, MessageSquareText, Search } from 'lucide-react';
import {
  testSommelier,
  fetchSommelierTests,
  fetchSommelierTestSession,
  fetchSommelierTestStats,
  startNewSession,
  clearSommelierErrors,
} from '../redux/SommelierSlice';
import { fetchCustomers } from '../redux/CustomerSlice';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const newSessionId = () => `admin-${Date.now()}`;

const RECOMMENDATION_LABEL = {
  match: 'Recommended for you',
  suggestion: 'You might also like',
};

const SommelierTester = () => {
  const dispatch = useDispatch();
  const {
    activeSessionId, turns, sending, sendError,
    tests, testsLoading,
    stats, statsLoading,
    replayLoading,
  } = useSelector((state) => state.sommelier);
  const { customers } = useSelector((state) => state.customers || { customers: [] });

  const [prompt, setPrompt] = useState('');
  const [asUserId, setAsUserId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    dispatch(fetchSommelierTests());
    dispatch(fetchSommelierTestStats());
    dispatch(fetchCustomers({ per_page: 200 }));
    if (!activeSessionId) dispatch(startNewSession(newSessionId()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (sendError) {
      toast.error(sendError);
      dispatch(clearSommelierErrors());
    }
  }, [sendError, dispatch]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!prompt.trim() || sending) return;
    dispatch(testSommelier({ prompt: prompt.trim(), session_id: activeSessionId, as_user_id: asUserId || undefined }));
    setPrompt('');
  };

  const handleNewSession = () => {
    dispatch(startNewSession(newSessionId()));
    dispatch(fetchSommelierTests());
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    dispatch(fetchSommelierTestSession(sessionId));
  };

  const lastDiagnostics = [...turns].reverse().find((t) => t.diagnostics)?.diagnostics;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sommelier Tester</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chat with the sommelier to check it works. Test conversations are stored apart from customer
            chats and excluded from customer analytics.
          </p>
        </div>
        <button onClick={handleNewSession}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">
          <Plus size={14} /> New Test Session
        </button>
      </div>

      {stats && !statsLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              ['Turns', stats.turns],
              ['Sessions', stats.sessions],
              ['Avg. latency', stats.avg_latency_ms != null ? `${Math.round(stats.avg_latency_ms)} ms` : '—'],
              ['Avg. retrieved', stats.avg_retrieved != null ? Number(stats.avg_retrieved).toFixed(1) : '—'],
              ['Failures', stats.failures, stats.failures > 0 ? 'text-red-600' : 'text-gray-900'],
              ['Empty retrievals', stats.empty_retrievals, stats.empty_retrievals > 0 ? 'text-yellow-600' : 'text-gray-900'],
            ].map(([label, value, tone]) => (
              <Card key={label}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-bold mt-1 ${tone || 'text-gray-900'}`}>{value ?? '—'}</p>
              </Card>
            ))}
          </div>

          {(stats.by_provider?.length > 0 || stats.by_recommendation_type?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.by_provider?.length > 0 && (
                <Card title="By Provider">
                  <div className="space-y-1.5">
                    {stats.by_provider.map((p) => (
                      <div key={p.provider} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 capitalize">{p.provider}</span>
                        <span className="text-gray-500">{p.turns} turn{p.turns === 1 ? '' : 's'} · {Math.round(p.avg_latency_ms)} ms avg</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {stats.by_recommendation_type?.length > 0 && (
                <Card title="By Recommendation Type">
                  <div className="space-y-1.5">
                    {stats.by_recommendation_type.map((r) => (
                      <div key={r.recommendation_type} className="flex items-center justify-between text-sm">
                        <Badge tone={r.recommendation_type === 'match' ? 'violet' : 'sky'}>
                          {RECOMMENDATION_LABEL[r.recommendation_type] || r.recommendation_type}
                        </Badge>
                        <span className="text-gray-500">{r.turns} turn{r.turns === 1 ? '' : 's'}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-6">
        {/* SESSIONS LIST */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-280px)]">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Past Sessions</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {testsLoading && tests.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={18} /></div>
            ) : tests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 px-3">No test sessions yet — send a message to start one.</p>
            ) : (
              tests.map((t) => {
                const sid = t.session_id || t.id;
                return (
                  <button key={sid} onClick={() => handleSelectSession(sid)}
                    className={`w-full text-left px-4 py-3 transition-colors ${sid === activeSessionId ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                    <p className={`text-xs font-semibold truncate ${sid === activeSessionId ? 'text-violet-700' : 'text-gray-900'}`}>{sid}</p>
                    {t.last_prompt && <p className="text-xs text-gray-400 truncate mt-0.5">{t.last_prompt}</p>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-280px)]">
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 truncate">{activeSessionId}</h3>
            {replayLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {turns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <MessageSquareText size={22} className="text-gray-300" />
                <p className="text-sm">Ask the sommelier something to begin.</p>
              </div>
            ) : (
              turns.map((turn, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2 justify-end">
                    <div className="bg-gray-900 text-white text-sm rounded-lg rounded-tr-sm px-3 py-2 max-w-[80%]">{turn.prompt}</div>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><User size={13} className="text-gray-500" /></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0"><Bot size={13} className="text-violet-600" /></div>
                    <div className="max-w-[80%] space-y-2">
                      <div className="bg-gray-50 border border-gray-100 text-sm text-gray-700 rounded-lg rounded-tl-sm px-3 py-2">
                        {turn.response}
                      </div>
                      {turn.recommendation_type && (
                        <Badge tone={turn.recommendation_type === 'match' ? 'violet' : 'sky'}>
                          {RECOMMENDATION_LABEL[turn.recommendation_type] || turn.recommendation_type}
                        </Badge>
                      )}
                      {turn.recommended_products?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {turn.recommended_products.map((p) => (
                            <div key={p.id} className="border border-gray-100 rounded-md px-2 py-1.5 flex items-center gap-2">
                              {p.primary_image?.image_url ? (
                                <img src={p.primary_image.image_url} alt={p.primary_image.alt_text || p.name}
                                  className="w-8 h-8 rounded object-contain flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                                <p className="text-xs text-gray-400">GHS {Number(p.price ?? 0).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex-shrink-0 flex items-center gap-2">
            <input
              type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="What goes with Waakye?"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <button type="submit" disabled={sending || !prompt.trim()}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
        </div>

        {/* DIAGNOSTICS PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
          <div className="flex items-center gap-2">
            <Gauge size={15} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900">Diagnostics</h3>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Borrow customer profile</label>
            <div className="relative mb-1.5">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full pl-6 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
              />
            </div>
            <select value={asUserId} onChange={(e) => setAsUserId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
              <option value="">None — no profile</option>
              {customers
                ?.filter((c) => !customerSearch || `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''}`.toLowerCase().includes(customerSearch.toLowerCase()))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name || c.name} {c.last_name || ''} — {c.email}
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Loads their taste profile read-only, for the next message.</p>
          </div>
          {!lastDiagnostics ? (
            <p className="text-xs text-gray-400">Send a message to see model diagnostics here.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {[
                ['Provider', lastDiagnostics.provider],
                ['Model', lastDiagnostics.model],
                ['Retrieved', lastDiagnostics.retrieved_count],
                ['Picked by model', lastDiagnostics.picked_by_model],
                ['Profile used', lastDiagnostics.profile_used ? 'Yes' : 'No'],
                ['Latency', lastDiagnostics.latency_ms != null ? `${lastDiagnostics.latency_ms} ms` : null],
              ].filter(([, v]) => v !== null && v !== undefined).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-800">{String(value)}</span>
                </div>
              ))}
              {lastDiagnostics.retrieved_count === 0 && (
                <p className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-md px-2 py-1.5 mt-1">
                  No wines were retrieved — this reply is generic, not personalised.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SommelierTester;
