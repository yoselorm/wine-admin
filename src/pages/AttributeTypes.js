import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAttributeTypes,
  fetchAttributeType,
  createAttributeType,
  updateAttributeType,
  deleteAttributeType,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  clearWineAttributeStatus,
} from '../redux/WineAttributeSlice';
import { Loader2, Plus, Search, Pencil, Trash2, List, Type } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const humanizeType = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const BEVERAGE_CLASSES = ['shared', 'wine', 'spirit', 'beer', 'non_alcoholic'];

const emptyType = { key: '', label: '', hint: '', applies_to: 'shared', is_enumerated: false };

// The vocabulary behind product attributes: the types, and the values the enumerated ones offer.
//
// This exists because of one operation. A shared value is carried by every product using it, so
// renaming "75CL" to "75 CL" corrects 142 products in a single write. Nothing else on the panel can
// do that, and before this screen there was no way to do it at all — the vocabulary lived in a
// config file on the server and changing it meant a deploy.
const AttributeTypes = () => {
  const dispatch = useDispatch();
  const { types, typeDetail, typeDetailLoading, mutationLoading, error, successMessage } = useSelector((s) => s.wineAttributes);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [newType, setNewType] = useState(emptyType);
  const [showNewType, setShowNewType] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [renaming, setRenaming] = useState(null); // { id, value, products_count }
  const [renameTo, setRenameTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind, id, name, count }

  useEffect(() => {
    dispatch(fetchAttributeTypes());
  }, [dispatch]);

  // The list has no per-value counts, so selecting a type reads it in full.
  useEffect(() => {
    if (selectedId) dispatch(fetchAttributeType(selectedId));
  }, [selectedId, dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearWineAttributeStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineAttributeStatus());
      // A rename moves every product on that value, so nothing here is reconciled locally.
      dispatch(fetchAttributeTypes());
      if (selectedId) dispatch(fetchAttributeType(selectedId));
    }
  }, [error, successMessage, selectedId, dispatch]);

  const filtered = (types || []).filter((t) => {
    const q = search.toLowerCase();
    return !q || t.key.toLowerCase().includes(q) || (t.label || '').toLowerCase().includes(q);
  });

  // Deliberately not the list's copy: its values carry no products_count, and the rename
  // confirmation is built on that number. Showing the list row here would have the dialog say
  // nothing carries a value while it is on 142 products.
  const selected = typeDetail?.id === selectedId ? typeDetail : null;

  const handleCreateType = () => {
    if (!KEY_PATTERN.test(newType.key) || !newType.label.trim()) return;
    dispatch(createAttributeType({ ...newType, hint: newType.hint || null }));
    setNewType(emptyType);
    setShowNewType(false);
  };

  const handleAddValue = () => {
    if (!newValue.trim() || !selected) return;
    dispatch(createAttributeValue({ typeId: selected.id, value: newValue.trim() }));
    setNewValue('');
  };

  const handleRename = () => {
    if (!renameTo.trim() || !renaming) return;
    dispatch(updateAttributeValue({ id: renaming.id, data: { value: renameTo.trim() } }));
    setRenaming(null);
    setRenameTo('');
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'type') {
      await dispatch(deleteAttributeType(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
    } else {
      await dispatch(deleteAttributeValue(deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Attribute Types &amp; Values</h1>
        <p className="text-sm text-gray-500 mt-1">
          The kinds of attribute a product can have, and the shared values behind the ones that offer
          a list. Renaming a value here changes every product carrying it — to change a single
          product, use Product Attributes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search types..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-5 py-3 transition-colors ${selectedId === t.id ? 'bg-violet-50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 text-sm">{t.label || humanizeType(t.key)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-gray-500 bg-gray-100 flex items-center gap-1">
                    {t.is_enumerated ? <><List size={10} /> list</> : <><Type size={10} /> text</>}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs text-gray-400">{t.key}</code>
                  <span className="text-xs text-gray-400">
                    · {t.products_count ?? 0} product{t.products_count === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            ))}
            {!filtered.length && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">No types match.</div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            {!showNewType ? (
              <button onClick={() => setShowNewType(true)}
                className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={14} /> New Type
              </button>
            ) : (
              <div className="space-y-2">
                <input type="text" value={newType.key} placeholder="key, e.g. cask_type"
                  onChange={(e) => setNewType((t) => ({ ...t, key: e.target.value.toLowerCase() }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                {newType.key && !KEY_PATTERN.test(newType.key) && (
                  <p className="text-xs text-red-500">Lowercase letters, numbers and underscores only, starting with a letter.</p>
                )}
                <input type="text" value={newType.label} placeholder="Label, e.g. Cask Type"
                  onChange={(e) => setNewType((t) => ({ ...t, label: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <input type="text" value={newType.hint} placeholder="Hint shown on the product form"
                  onChange={(e) => setNewType((t) => ({ ...t, hint: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                <select value={newType.applies_to}
                  onChange={(e) => setNewType((t) => ({ ...t, applies_to: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                  {BEVERAGE_CLASSES.map((c) => <option key={c} value={c}>{humanizeType(c)}</option>)}
                </select>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={newType.is_enumerated} className="mt-0.5"
                    onChange={(e) => setNewType((t) => ({ ...t, is_enumerated: e.target.checked }))} />
                  <span>
                    Pick from a shared list
                    <span className="block text-xs text-gray-400">
                      Cannot be changed once the type is in use — rows already written point either at
                      a shared value or at their own text.
                    </span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <button onClick={handleCreateType} disabled={mutationLoading}
                    className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50">
                    {mutationLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Create'}
                  </button>
                  <button onClick={() => { setShowNewType(false); setNewType(emptyType); }}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card max-h-[calc(100vh-220px)] overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full py-20 text-sm text-gray-400">
              {selectedId && typeDetailLoading
                ? <Loader2 size={18} className="animate-spin text-gray-300" />
                : 'Select a type to view its values.'}
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selected.label || humanizeType(selected.key)}</h3>
                  <code className="text-xs text-gray-400">{selected.key}</code>
                </div>
                <button onClick={() => setDeleteTarget({ kind: 'type', id: selected.id, name: selected.label || selected.key })}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete type">
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm mt-5">
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Label</label>
                  <input type="text" defaultValue={selected.label} key={`label-${selected.id}`}
                    onBlur={(e) => e.target.value !== selected.label && dispatch(updateAttributeType({ id: selected.id, data: { label: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1.5">Applies To</label>
                  <select defaultValue={selected.applies_to} key={`applies-${selected.id}`}
                    onChange={(e) => dispatch(updateAttributeType({ id: selected.id, data: { applies_to: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-md focus:outline-none focus:border-violet-500">
                    {BEVERAGE_CLASSES.map((c) => <option key={c} value={c}>{humanizeType(c)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-medium text-gray-700 mb-1.5">Hint</label>
                  <input type="text" defaultValue={selected.hint || ''} key={`hint-${selected.id}`}
                    placeholder="Shown as helper text on the product form"
                    onBlur={(e) => e.target.value !== (selected.hint || '') && dispatch(updateAttributeType({ id: selected.id, data: { hint: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                </div>
              </div>

              <div className="mt-7">
                <h4 className="text-sm font-bold text-gray-900">Values</h4>
                {!selected.is_enumerated ? (
                  <p className="text-sm text-gray-400 mt-2">
                    This type stores its own text on each product rather than picking from a list, so
                    it has no shared values.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mt-1 mb-3">
                      Renaming a value changes every product carrying it.
                    </p>
                    <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                      {(selected.values || []).map((v) => (
                        <div key={v.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-900 truncate">{v.value}</p>
                            <p className="text-xs text-gray-400">
                              {v.products_count ?? 0} product{v.products_count === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => { setRenaming(v); setRenameTo(v.value); }}
                              className="p-1.5 text-gray-400 hover:text-violet-600 transition-colors" title="Rename">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteTarget({ kind: 'value', id: v.id, name: v.value, count: v.products_count })}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!(selected.values || []).length && (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No values yet.</div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <input type="text" maxLength={255} value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                        placeholder={selected.hint || 'New value'}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                      <button onClick={handleAddValue} disabled={mutationLoading || !newValue.trim()}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5">
                        {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The rename is the one action here with a blast radius, so it says the number out loud. */}
      {renaming && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900">Rename this value?</h3>
            <p className="text-sm text-gray-500 mt-1">
              {renaming.products_count > 0
                ? <>This changes <strong>{renaming.products_count} product{renaming.products_count === 1 ? '' : 's'}</strong> carrying “{renaming.value}”.</>
                : <>Nothing carries “{renaming.value}” yet.</>}
            </p>
            <input type="text" maxLength={255} value={renameTo} autoFocus
              onChange={(e) => setRenameTo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full mt-4 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setRenaming(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleRename} disabled={mutationLoading || !renameTo.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50">
                {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* The server refuses either delete while anything still carries it, and its 422 names the
          count. Surfaced as a toast rather than pre-empted here, so the message stays the one the
          server actually has the numbers for. */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title={deleteTarget?.kind === 'type' ? 'Remove Attribute Type' : 'Remove Value'}
        message={
          deleteTarget?.kind === 'type'
            ? `Remove "${deleteTarget?.name}"? This is refused while any product still carries it.`
            : `Remove "${deleteTarget?.name}"?${deleteTarget?.count ? ` ${deleteTarget.count} product(s) carry it, so this will be refused — rename it instead.` : ''}`
        }
      />
    </div>
  );
};

export default AttributeTypes;
