import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchQuizQuestions,
  fetchEffectPaths,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  createQuizOption,
  updateQuizOption,
  deleteQuizOption,
  updateOptionEffects,
  clearQuizAdminStatus,
} from '../redux/QuizAdminSlice';
import { hasPermission } from '../utils/permissions';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Plus, Trash, Loader2, MessageCircleQuestion, Filter } from 'lucide-react';
import toast from '../components/Toast';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const INPUT_TYPES = [
  { value: 'single', label: 'Single choice' },
  { value: 'multi', label: 'Multi choice' },
];

const emptyQuestion = { key: '', prompt: '', help_text: '', input_type: 'single', is_required: true };
const emptyOption = { value: '', label: '' };

// A single "this answer sets <path> to <value>" row, built from the effect-paths catalogue —
// never hardcoded, since the fields and their allowed values are defined server-side.
const EffectEditor = ({ option, effectPaths, canManage, onSave, saving }) => {
  const [effects, setEffects] = useState(option.effects || []);
  const [draftPath, setDraftPath] = useState(effectPaths[0]?.path || '');
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    setEffects(option.effects || []);
  }, [option.effects]);

  useEffect(() => {
    const pathDef = effectPaths.find((p) => p.path === draftPath);
    const firstValue = pathDef?.values?.[0];
    setDraftValue(typeof firstValue === 'object' ? firstValue?.value ?? '' : firstValue ?? '');
  }, [draftPath, effectPaths]);

  const pathDef = (path) => effectPaths.find((p) => p.path === path);
  const dirty = JSON.stringify(effects) !== JSON.stringify(option.effects || []);

  const addEffect = () => {
    if (!draftPath || draftValue === '') return;
    setEffects((prev) => [...prev.filter((e) => e.path !== draftPath), { path: draftPath, value: draftValue }]);
  };

  const removeEffect = (path) => setEffects((prev) => prev.filter((e) => e.path !== path));

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2.5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Effects</p>

      {effects.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Purely cosmetic — this answer changes nothing about which wines are shown.</p>
      ) : (
        <div className="space-y-1.5">
          {effects.map((e) => {
            const def = pathDef(e.path);
            const narrows = def?.narrows_catalogue;
            return (
              <div key={e.path} className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-md px-2.5 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge tone={narrows ? 'violet' : 'sky'} size="sm">{narrows ? 'Filters wines' : 'Wording only'}</Badge>
                  <span className="text-xs text-gray-700 font-medium truncate">{def?.label || e.path}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <span className="text-xs font-semibold text-gray-900">{String(e.value)}</span>
                </div>
                {canManage && (
                  <button type="button" onClick={() => removeEffect(e.path)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                    <Trash size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        <>
          <div className="flex items-center gap-2">
            <select value={draftPath} onChange={(e) => setDraftPath(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
              {effectPaths.map((p) => (
                <option key={p.path} value={p.path}>{p.label || p.path} {p.narrows_catalogue ? '(filters)' : '(wording)'}</option>
              ))}
            </select>
            {pathDef(draftPath)?.values ? (
              <select value={draftValue} onChange={(e) => setDraftValue(e.target.value)}
                className="w-36 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                {pathDef(draftPath).values.map((v) => {
                  const val = typeof v === 'object' ? v.value : v;
                  const label = typeof v === 'object' ? v.label || v.value : v;
                  return <option key={val} value={val}>{label}</option>;
                })}
              </select>
            ) : (
              <input type="text" value={draftValue} onChange={(e) => setDraftValue(e.target.value)}
                placeholder="Value" className="w-36 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            )}
            <button type="button" onClick={addEffect} disabled={!draftPath}
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-white disabled:opacity-50">
              <Plus size={12} />
            </button>
          </div>
          <div className="flex justify-end">
            <button type="button" disabled={!dirty || saving} onClick={() => onSave(effects)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-40">
              {saving && <Loader2 size={11} className="animate-spin" />} Save Effects
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const OptionRow = ({ option, question, effectPaths, canManage, mutationLoading, onDeleteOption }) => {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ value: option.value, label: option.label });

  const saveOption = () => {
    dispatch(updateQuizOption({ id: option.id, optionData: draft }));
    setEditing(false);
  };

  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
              placeholder="Value" className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              placeholder="Label" className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <button onClick={saveOption} className="text-xs font-semibold text-violet-600">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <span className="text-xs font-mono text-gray-400 mr-2">{option.value}</span>
              <span className="text-sm text-gray-800">{option.label}</span>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-violet-600">Edit</button>
                <button onClick={() => onDeleteOption(option, question)} className="text-gray-300 hover:text-red-500">
                  <Trash size={13} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <EffectEditor
        option={option}
        effectPaths={effectPaths}
        canManage={canManage}
        saving={mutationLoading}
        onSave={(effects) => dispatch(updateOptionEffects({ optionId: option.id, questionId: question.id, effects }))}
      />
    </div>
  );
};

const QuestionCard = ({ question, index, total, effectPaths, canManage, mutationLoading, onMove, onRetire }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    key: question.key, prompt: question.prompt, help_text: question.help_text || '',
    input_type: question.input_type, is_required: !!question.is_required,
  });
  const [newOption, setNewOption] = useState(emptyOption);

  const saveQuestion = () => {
    dispatch(updateQuizQuestion({ id: question.id, questionData: draft }));
    setEditing(false);
  };

  const addOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) return;
    dispatch(createQuizOption({ questionId: question.id, optionData: newOption }));
    setNewOption(emptyOption);
  };

  const [optionToDelete, setOptionToDelete] = useState(null);

  return (
    <Card padded={false} className={!question.is_active ? 'opacity-60' : ''}>
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {canManage && (
          <div className="flex flex-col gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button disabled={index === 0} onClick={() => onMove(question, -1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
              <ArrowUp size={13} />
            </button>
            <button disabled={index === total - 1} onClick={() => onMove(question, 1)} className="text-gray-300 hover:text-gray-600 disabled:opacity-20">
              <ArrowDown size={13} />
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">{question.prompt}</p>
            <Badge tone="neutral" size="sm">{question.key}</Badge>
            <Badge tone={question.input_type === 'multi' ? 'sky' : 'violet'} size="sm">{question.input_type}</Badge>
            {!question.is_active && <Badge tone="red" size="sm">Retired</Badge>}
          </div>
          {question.help_text && <p className="text-xs text-gray-400 mt-0.5 truncate">{question.help_text}</p>}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          {editing ? (
            <div className="space-y-2.5 bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2">
                <input value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                  placeholder="key" className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <select value={draft.input_type} onChange={(e) => setDraft((d) => ({ ...d, input_type: e.target.value }))}
                  className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
                  {INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <input value={draft.prompt} onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
                placeholder="Prompt" className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <textarea rows="2" value={draft.help_text} onChange={(e) => setDraft((d) => ({ ...d, help_text: e.target.value }))}
                placeholder="Help text — why a wine shop is asking this"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <div className="flex items-center justify-between">
                <Switch checked={draft.is_required} onChange={(v) => setDraft((d) => ({ ...d, is_required: v }))} label="Required" italic />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="text-xs text-gray-400">Cancel</button>
                  <button onClick={saveQuestion} disabled={mutationLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
                </div>
              </div>
            </div>
          ) : canManage && (
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(true)} className="text-xs font-semibold text-violet-600">Edit question</button>
              {question.is_active && (
                <button onClick={() => onRetire(question)} className="text-xs font-semibold text-red-500">Retire question</button>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Answers</p>
            {(question.options || []).map((opt) => (
              <OptionRow
                key={opt.id}
                option={opt}
                question={question}
                effectPaths={effectPaths}
                canManage={canManage}
                mutationLoading={mutationLoading}
                onDeleteOption={(o, q) => setOptionToDelete({ option: o, question: q })}
              />
            ))}

            {canManage && (
              <div className="flex items-center gap-2 pt-1">
                <input value={newOption.value} onChange={(e) => setNewOption((o) => ({ ...o, value: e.target.value }))}
                  placeholder="Value, e.g. E" className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <input value={newOption.label} onChange={(e) => setNewOption((o) => ({ ...o, label: e.target.value }))}
                  placeholder="Label" className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <button onClick={addOption} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50">
                  <Plus size={12} /> Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!optionToDelete}
        isDeleting={mutationLoading}
        onClose={() => setOptionToDelete(null)}
        onConfirm={() => {
          dispatch(deleteQuizOption({ id: optionToDelete.option.id, questionId: optionToDelete.question.id }));
          setOptionToDelete(null);
        }}
        title="Remove Answer"
        message={
          question.options?.length <= 1
            ? 'This is the last answer on this question — the server will reject removing it. Add a replacement first.'
            : `Remove "${optionToDelete?.option?.label}"? Customers who already chose it keep their saved answer.`
        }
      />
    </Card>
  );
};

const QuizEditor = () => {
  const dispatch = useDispatch();
  const { questions, effectPaths, loading, mutationLoading, error, successMessage } = useSelector((s) => s.quizAdmin);
  const { admin } = useSelector((s) => s.auth);
  const canManage = hasPermission(admin, 'manage-products');

  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);
  const [retireTarget, setRetireTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchQuizQuestions());
    dispatch(fetchEffectPaths());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearQuizAdminStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearQuizAdminStatus()); }
  }, [error, successMessage, dispatch]);

  const activeQuestions = [...questions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Swap this question's position with its neighbour's — reordering is a PUT with the new position.
  const handleMove = (question, direction) => {
    const idx = activeQuestions.findIndex((q) => q.id === question.id);
    const neighbour = activeQuestions[idx + direction];
    if (!neighbour) return;
    dispatch(updateQuizQuestion({ id: question.id, questionData: { position: neighbour.position } }));
    dispatch(updateQuizQuestion({ id: neighbour.id, questionData: { position: question.position } }));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.key.trim() || !newQuestion.prompt.trim()) return;
    dispatch(createQuizQuestion({ ...newQuestion, position: activeQuestions.length + 1 }));
    setNewQuestion(emptyQuestion);
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quiz Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reword the onboarding quiz and control what each answer does. Editing changes what
            future customers are shown — it never rewrites a profile someone has already saved.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800">
            <Plus size={14} /> Add Question
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
        <Filter size={15} className="text-violet-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-violet-700">
          <Badge tone="violet" size="sm" className="mr-1.5">Filters wines</Badge> effects narrow the catalogue a customer is shown.
          <Badge tone="sky" size="sm" className="mx-1.5">Wording only</Badge> effects just change how the sommelier talks — nothing is excluded.
        </p>
      </div>

      {showAdd && canManage && (
        <Card title="New Question">
          <div className="grid grid-cols-2 gap-3">
            <input value={newQuestion.key} onChange={(e) => setNewQuestion((q) => ({ ...q, key: e.target.value }))}
              placeholder="key, e.g. texture" className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <select value={newQuestion.input_type} onChange={(e) => setNewQuestion((q) => ({ ...q, input_type: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
              {INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={newQuestion.prompt} onChange={(e) => setNewQuestion((q) => ({ ...q, prompt: e.target.value }))}
              placeholder="Prompt shown to the customer" className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <textarea rows="2" value={newQuestion.help_text} onChange={(e) => setNewQuestion((q) => ({ ...q, help_text: e.target.value }))}
              placeholder="Help text (optional) — why a wine shop is asking this"
              className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <div className="col-span-2 flex items-center justify-between">
              <Switch checked={newQuestion.is_required} onChange={(v) => setNewQuestion((q) => ({ ...q, is_required: v }))} label="Required" italic />
              <button onClick={handleAddQuestion} disabled={mutationLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50">
                {mutationLoading && <Loader2 size={13} className="animate-spin" />} Add Question
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">New questions start with no answers — add them once it's saved.</p>
        </Card>
      )}

      {loading && questions.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : activeQuestions.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <MessageCircleQuestion size={22} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No quiz questions yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              total={activeQuestions.length}
              effectPaths={effectPaths}
              canManage={canManage}
              mutationLoading={mutationLoading}
              onMove={handleMove}
              onRetire={(question) => setRetireTarget(question)}
            />
          ))}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!retireTarget}
        isDeleting={mutationLoading}
        onClose={() => setRetireTarget(null)}
        onConfirm={() => {
          dispatch(deleteQuizQuestion(retireTarget.id));
          setRetireTarget(null);
        }}
        title="Retire Question"
        message={`"${retireTarget?.prompt}" will stop showing to new customers. Customers who already answered it keep that answer on their profile — it is not deleted.`}
      />
    </div>
  );
};

export default QuizEditor;
