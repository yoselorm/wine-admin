import React, { useEffect, useMemo, useState } from 'react';
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
import { fetchCoverage } from '../redux/InsightsSlice';
import { hasPermission } from '../utils/permissions';
import { ArrowUp, ArrowDown, Plus, X, Loader2 } from 'lucide-react';
import toast from '../components/Toast';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const INPUT_TYPES = [
  { value: 'single', label: 'Single choice' },
  { value: 'multi', label: 'Multi choice' },
];

const emptyQuestion = { key: '', prompt: '', help_text: '', input_type: 'single', is_required: true };
const emptyOption = { value: '', label: '' };
const pathTail = (path) => path.split('.').pop().replace(/_/g, ' ');

// One "this answer sets <path> to <value>" chip row, built entirely from the effect-paths
// catalogue (never hardcoded) — adding or removing a chip saves immediately, since a separate
// "Save Effects" step is what let unsaved additions get silently wiped by an unrelated update
// elsewhere on the page (every option's identity used to be rebuilt on any single mutation).
const EffectsRow = ({ option, effectPaths, canManage, saving, onChange }) => {
  const [draftPath, setDraftPath] = useState(effectPaths[0]?.path || '');
  const pathDef = (path) => effectPaths.find((p) => p.path === path);
  const values = pathDef(draftPath)?.values || [];
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    const first = values[0];
    setDraftValue(typeof first === 'object' ? first?.value ?? '' : first ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftPath]);

  const effects = option.effects || [];

  const addEffect = () => {
    if (!draftPath || draftValue === '') return;
    onChange([...effects.filter((e) => e.path !== draftPath), { path: draftPath, value: draftValue }]);
  };
  const removeEffect = (path) => onChange(effects.filter((e) => e.path !== path));

  return (
    <div className="ml-8 mt-2.5">
      {effects.length === 0 ? (
        <p className="text-xs italic text-gray-400">Cosmetic only — this answer changes nothing</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {effects.map((e) => {
            const narrows = pathDef(e.path)?.narrows_catalogue;
            return (
              <span key={e.path} className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded text-xs font-medium ${
                narrows ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="opacity-70">{pathTail(e.path)}</span>{String(e.value)}
                {canManage && (
                  <button type="button" onClick={() => removeEffect(e.path)} disabled={saving} className="opacity-70 hover:opacity-100">
                    <X size={11} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <select value={draftPath} onChange={(e) => setDraftPath(e.target.value)}
            className="h-[34px] px-2.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-[230px]">
            {effectPaths.map((p) => <option key={p.path} value={p.path}>{p.path}</option>)}
          </select>
          {values.length > 0 ? (
            <select value={draftValue} onChange={(e) => setDraftValue(e.target.value)}
              className="h-[34px] px-2.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-[150px]">
              {values.map((v) => {
                const val = typeof v === 'object' ? v.value : v;
                const lbl = typeof v === 'object' ? v.label || v.value : v;
                return <option key={val} value={val}>{lbl}</option>;
              })}
            </select>
          ) : (
            <input value={draftValue} onChange={(e) => setDraftValue(e.target.value)} placeholder="Value"
              className="h-[34px] px-2.5 text-xs border border-gray-200 rounded-md w-[150px] focus:outline-none focus:border-violet-500" />
          )}
          <button type="button" onClick={addEffect} disabled={saving}
            className="h-[30px] px-3 text-xs font-semibold border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50">
            Add Effect
          </button>
        </div>
      )}
    </div>
  );
};

const AnswerCard = ({ option, question, effectPaths, canManage, mutationLoading, reach, onRequestDelete }) => {
  const dispatch = useDispatch();
  const [label, setLabel] = useState(option.label);
  useEffect(() => setLabel(option.label), [option.label]);

  const narrows = option.effects?.some((e) => effectPaths.find((p) => p.path === e.path)?.narrows_catalogue);
  const reachTone = reach == null ? 'neutral' : reach === 0 ? 'red' : 'green';
  const reachLabel = reach == null ? (narrows ? 'Filters' : 'No filter') : reach === 0 ? 'Reaches 0' : `Reaches ${reach}`;

  const saveLabel = () => {
    if (label.trim() && label !== option.label) {
      dispatch(updateQuizOption({ id: option.id, questionId: question.id, optionData: { value: option.value, label } }));
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 p-3 mb-2.5">
      <div className="flex items-center gap-2.5">
        <span className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
          narrows ? 'bg-violet-500 text-white' : 'bg-gray-300 text-gray-700'
        }`}>{option.value}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={saveLabel} disabled={!canManage}
          className="flex-1 min-w-0 h-[34px] px-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 disabled:bg-gray-100" />
        <Badge tone={reachTone} className="flex-shrink-0">{reachLabel}</Badge>
        {canManage && (
          <button type="button" onClick={onRequestDelete} disabled={mutationLoading}
            className="w-[26px] h-[26px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white rounded-md flex-shrink-0">
            <X size={15} />
          </button>
        )}
      </div>

      <EffectsRow
        option={option}
        effectPaths={effectPaths}
        canManage={canManage}
        saving={mutationLoading}
        onChange={(effects) => dispatch(updateOptionEffects({ optionId: option.id, questionId: question.id, effects }))}
      />
    </div>
  );
};

const QuestionCard = ({ question, index, total, effectPaths, canManage, mutationLoading, reachByOption, onMove, onRetire, defaultOpen }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(!!defaultOpen);
  const [draft, setDraft] = useState({
    prompt: question.prompt, help_text: question.help_text || '', input_type: question.input_type,
  });
  useEffect(() => {
    setDraft({ prompt: question.prompt, help_text: question.help_text || '', input_type: question.input_type });
  }, [question.prompt, question.help_text, question.input_type]);

  const [newOption, setNewOption] = useState(emptyOption);
  const [optionToDelete, setOptionToDelete] = useState(null);

  const narrowing = question.options?.some((o) => o.effects?.some((e) => effectPaths.find((p) => p.path === e.path)?.narrows_catalogue));
  const deadCount = question.options?.filter((o) => {
    const r = reachByOption[o.label];
    return o.effects?.length > 0 && r === 0;
  }).length || 0;
  const meta = [
    `${question.options?.length || 0} answer${question.options?.length === 1 ? '' : 's'}`,
    question.help_text ? 'has help text' : null,
    deadCount ? `${deadCount} reach no wines` : null,
  ].filter(Boolean).join(' · ');

  const savePrompt = () => {
    if (draft.prompt.trim() && draft.prompt !== question.prompt) {
      dispatch(updateQuizQuestion({ id: question.id, questionData: { prompt: draft.prompt } }));
    }
  };
  const saveHelpText = () => {
    if (draft.help_text !== (question.help_text || '')) {
      dispatch(updateQuizQuestion({ id: question.id, questionData: { help_text: draft.help_text } }));
    }
  };
  const changeInputType = (input_type) => {
    setDraft((d) => ({ ...d, input_type }));
    dispatch(updateQuizQuestion({ id: question.id, questionData: { input_type } }));
  };

  const addOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) return;
    dispatch(createQuizOption({ questionId: question.id, optionData: newOption }));
    setNewOption(emptyOption);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-card overflow-hidden mb-4 ${!question.is_active ? 'opacity-55' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        {canManage && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button type="button" disabled={index === 0} onClick={() => onMove(question, -1)}
              className="w-[22px] h-4 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 flex items-center justify-center">
              <ArrowUp size={9} />
            </button>
            <button type="button" disabled={index === total - 1} onClick={() => onMove(question, 1)}
              className="w-[22px] h-4 border border-gray-200 rounded text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 flex items-center justify-center">
              <ArrowDown size={9} />
            </button>
          </div>
        )}
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex-1 min-w-0 text-left">
          <div>
            <span className="text-[11px] font-bold text-gray-400 tracking-wide mr-2">Q{index + 1}</span>
            <span className="text-sm font-semibold text-gray-900">{question.prompt}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{meta}</div>
        </button>
        <Badge tone={question.input_type === 'multi' ? 'sky' : 'neutral'} className="flex-shrink-0">{question.input_type === 'multi' ? 'Multi' : 'Single'}</Badge>
        <Badge tone={narrowing ? 'violet' : 'neutral'} className="flex-shrink-0">{narrowing ? 'Filters wines' : 'Wording only'}</Badge>
        {canManage && question.is_active && (
          <button type="button" onClick={() => onRetire(question)} title="Retire question"
            className="w-[26px] h-[26px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-md flex-shrink-0">
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Key</label>
              <input value={question.key} readOnly className="w-full h-[36px] px-3 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400 mt-1">Immutable · answers are submitted under this</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Input Type</label>
              <select value={draft.input_type} disabled={!canManage} onChange={(e) => changeInputType(e.target.value)}
                className="w-full h-[38px] px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 disabled:bg-gray-50">
                {INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Prompt <span className="text-red-500">*</span></label>
              <input value={draft.prompt} disabled={!canManage} onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))} onBlur={savePrompt}
                className="w-full h-[36px] px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 disabled:bg-gray-50" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Help Text</label>
              <textarea rows="2" value={draft.help_text} disabled={!canManage} onChange={(e) => setDraft((d) => ({ ...d, help_text: e.target.value }))} onBlur={saveHelpText}
                placeholder="Why a wine shop is asking this — shown under the prompt"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500 disabled:bg-gray-50" />
            </div>
          </div>

          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Answers</p>
          {question.options?.map((opt) => (
            <AnswerCard
              key={opt.id}
              option={opt}
              question={question}
              effectPaths={effectPaths}
              canManage={canManage}
              mutationLoading={mutationLoading}
              reach={reachByOption[opt.label]}
              onRequestDelete={() => setOptionToDelete(opt)}
            />
          ))}

          {canManage && (
            <div className="flex items-center gap-2 mt-1">
              <input value={newOption.value} onChange={(e) => setNewOption((o) => ({ ...o, value: e.target.value }))}
                placeholder="Value, e.g. E" className="w-24 h-[36px] px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <input value={newOption.label} onChange={(e) => setNewOption((o) => ({ ...o, label: e.target.value }))}
                placeholder="Label" className="flex-1 h-[36px] px-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
              <button type="button" onClick={addOption}
                className="flex items-center gap-1.5 h-[36px] px-3.5 text-sm font-semibold border border-gray-200 rounded-md hover:bg-gray-50">
                <Plus size={13} /> Add Answer
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!optionToDelete}
        isDeleting={mutationLoading}
        onClose={() => setOptionToDelete(null)}
        onConfirm={() => {
          dispatch(deleteQuizOption({ id: optionToDelete.id, questionId: question.id }));
          setOptionToDelete(null);
        }}
        title="Remove Answer"
        message={
          question.options?.length <= 1
            ? 'This is the last answer on this question — the server will reject removing it. Add a replacement first.'
            : `Remove "${optionToDelete?.label}"? Customers who already chose it keep their saved answer.`
        }
      />
    </div>
  );
};

const QuizEditor = () => {
  const dispatch = useDispatch();
  const { questions, effectPaths, loading, mutationLoading, error, successMessage, lastCreatedQuestionKey } = useSelector((s) => s.quizAdmin);
  const { data: coverage } = useSelector((s) => s.insights.coverage);
  const { admin } = useSelector((s) => s.auth);
  const canManage = hasPermission(admin, 'manage-products');

  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState(emptyQuestion);
  const [retireTarget, setRetireTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchQuizQuestions());
    dispatch(fetchEffectPaths());
    dispatch(fetchCoverage());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearQuizAdminStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearQuizAdminStatus()); }
  }, [error, successMessage, dispatch]);

  const sortedQuestions = [...questions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // reachByOption[question.key][option.label] -> wines reached, cross-referenced from
  // /insights/coverage so a dead answer shows "Reaches 0" without hardcoding any numbers here.
  const reachByQuestion = useMemo(() => {
    const map = {};
    (coverage?.questions || []).forEach((q) => {
      map[q.key] = {};
      (q.options || []).forEach((o) => { map[q.key][o.label] = o.wines; });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverage]);

  const handleMove = (question, direction) => {
    const idx = sortedQuestions.findIndex((q) => q.id === question.id);
    const neighbour = sortedQuestions[idx + direction];
    if (!neighbour) return;
    dispatch(updateQuizQuestion({ id: question.id, questionData: { position: neighbour.position } }));
    dispatch(updateQuizQuestion({ id: neighbour.id, questionData: { position: question.position } }));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.key.trim() || !newQuestion.prompt.trim()) return;
    const maxPosition = sortedQuestions.reduce((max, q) => Math.max(max, q.position ?? 0), 0);
    dispatch(createQuizQuestion({ ...newQuestion, position: maxPosition + 1 }));
    setNewQuestion(emptyQuestion);
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quiz Editor</h1>
          <p className="text-sm text-gray-500 mt-1">
            The eight-question taste quiz new customers answer. Edits change what <strong>future</strong> customers
            are shown — saved taste profiles are not rewritten.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-violet-500 rounded-md hover:bg-violet-600">
            <Plus size={14} /> Add Question
          </button>
        )}
      </div>

      <div className="flex gap-6 flex-wrap">
        <span className="flex items-center gap-2 text-xs text-gray-500"><i className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Filters wines — narrows what the sommelier can offer</span>
        <span className="flex items-center gap-2 text-xs text-gray-500"><i className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Wording only — shapes how the sommelier speaks</span>
      </div>

      {showAdd && canManage && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">New Question</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={newQuestion.key} onChange={(e) => setNewQuestion((q) => ({ ...q, key: e.target.value }))}
              placeholder="key, e.g. texture" className="h-[38px] px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <select value={newQuestion.input_type} onChange={(e) => setNewQuestion((q) => ({ ...q, input_type: e.target.value }))}
              className="h-[38px] px-3 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500">
              {INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={newQuestion.prompt} onChange={(e) => setNewQuestion((q) => ({ ...q, prompt: e.target.value }))}
              placeholder="Prompt shown to the customer" className="sm:col-span-2 h-[38px] px-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <textarea rows="2" value={newQuestion.help_text} onChange={(e) => setNewQuestion((q) => ({ ...q, help_text: e.target.value }))}
              placeholder="Help text (optional) — why a wine shop is asking this"
              className="sm:col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <div className="sm:col-span-2 flex items-center justify-between">
              <Switch checked={newQuestion.is_required} onChange={(v) => setNewQuestion((q) => ({ ...q, is_required: v }))} label="Required" italic />
              <button onClick={handleAddQuestion} disabled={mutationLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50">
                {mutationLoading && <Loader2 size={13} className="animate-spin" />} Add Question
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">New questions start with no answers — add them once it's saved; it opens automatically below.</p>
        </div>
      )}

      {loading && questions.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : (
        <div>
          {sortedQuestions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              total={sortedQuestions.length}
              effectPaths={effectPaths}
              canManage={canManage}
              mutationLoading={mutationLoading}
              reachByOption={reachByQuestion[q.key] || {}}
              onMove={handleMove}
              onRetire={(question) => setRetireTarget(question)}
              defaultOpen={q.key === lastCreatedQuestionKey}
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
