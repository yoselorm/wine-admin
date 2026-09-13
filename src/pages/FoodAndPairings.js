import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFoodDishes,
  createFoodDish,
  updateFoodDish,
  deleteFoodDish,
  clearFoodDishStatus
} from '../redux/FoodDishSlice';
import {
  fetchFoodAttributes,
  createFoodAttribute,
  deleteFoodAttribute,
  clearFoodAttributeStatus,
} from '../redux/FoodAttributeSlice';
import {
  fetchWineFoodPairings,
  createWineFoodPairing,
  deleteWineFoodPairing,
  clearPairingStatus,
} from '../redux/WineFoodPairingSlice';
import { fetchProducts } from '../redux/ProductSlice';
import { Loader2, Plus, X } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import Pagination from '../components/Pagination';
import { paginateLocal } from '../utils/paginateLocal';

const ATTRIBUTE_TYPES = ['flavour', 'texture', 'aroma', 'colour', 'finish', 'pairing'];

const emptyDetail = { name: '', origin: '', description: '', image_url: '', is_local: false };
const PER_PAGE = 10;

const FoodAndPairings = () => {
  const dispatch = useDispatch();
  // GET /admin/food-dishes is the flat paginator shape (data IS the array, no meta) — fetch
  // everything once and paginate the dishes list client-side.
  const { foodDishes: dishes, loading, mutationLoading, error, successMessage } = useSelector((s) => s.foodDishes);
  const {
    foodAttributes,
    mutationLoading: attrMutationLoading,
    error: attrError,
    successMessage: attrSuccessMessage,
  } = useSelector((s) => s.foodAttributes);
  const {
    pairings,
    mutationLoading: pairingMutationLoading,
    error: pairingError,
    successMessage: pairingSuccessMessage,
  } = useSelector((s) => s.wineFoodPairings);
  const { items: products } = useSelector((s) => s.products || { items: [] });
  const { admin } = useSelector((s) => s.auth);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newDish, setNewDish] = useState({ name: '', origin: '', is_local: false });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attrDeleteTarget, setAttrDeleteTarget] = useState(null);
  const [pairingDeleteTarget, setPairingDeleteTarget] = useState(null);
  const [attrDraft, setAttrDraft] = useState({ type: 'flavour', value: '5' });
  const [pairingDraft, setPairingDraft] = useState({ product_id: '', reason: '', pairing_type: 'international' });
  const [currentPage, setCurrentPage] = useState(1);

  const { items: pagedDishes, meta: pagination } = paginateLocal(dishes || [], currentPage, PER_PAGE);

  useEffect(() => {
    dispatch(fetchFoodDishes({ per_page: 500 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchFoodAttributes({ per_page: 500 }));
    dispatch(fetchWineFoodPairings({ per_page: 500 }));
    dispatch(fetchProducts({ per_page: 200 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId && dishes?.length) setSelectedId(dishes[0].id);
  }, [dishes, selectedId]);

  useEffect(() => {
    const dish = dishes?.find((d) => d.id === selectedId);
    if (dish) {
      setDetail({ name: dish.name || '', origin: dish.origin || '', description: dish.description || '', image_url: dish.image_url || '', is_local: !!dish.is_local });
      // Default the pairing type to match the dish, since local dishes are paired with local-type wines far more often.
      setPairingDraft((p) => ({ ...p, pairing_type: dish.is_local ? 'local' : 'international' }));
    }
    if (products?.length) setPairingDraft((p) => ({ ...p, product_id: p.product_id || products[0].id }));
  }, [selectedId, dishes, products]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearFoodDishStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearFoodDishStatus());
      // createFoodDish/updateFoodDish don't merge into local state, so refetch to reflect changes
      dispatch(fetchFoodDishes({ per_page: 500 }));
    }
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (attrError) { toast.error(attrError); dispatch(clearFoodAttributeStatus()); }
    if (attrSuccessMessage) {
      toast.success(attrSuccessMessage);
      dispatch(clearFoodAttributeStatus());
      dispatch(fetchFoodAttributes({ per_page: 500 }));
    }
  }, [attrError, attrSuccessMessage, dispatch]);

  useEffect(() => {
    if (pairingError) { toast.error(pairingError); dispatch(clearPairingStatus()); }
    if (pairingSuccessMessage) {
      toast.success(pairingSuccessMessage);
      dispatch(clearPairingStatus());
      dispatch(fetchWineFoodPairings({ per_page: 500 }));
    }
  }, [pairingError, pairingSuccessMessage, dispatch]);

  const handleAddDish = () => {
    if (!newDish.name.trim()) return;
    dispatch(createFoodDish({ name: newDish.name, origin: newDish.origin, is_local: newDish.is_local, description: '', image_url: '' }));
    setNewDish({ name: '', origin: '', is_local: false });
  };

  const handleSaveDish = () => {
    if (selectedId) dispatch(updateFoodDish({ id: selectedId, data: detail }));
  };

  const executeDeleteDish = async () => {
    if (deleteTarget) {
      await dispatch(deleteFoodDish(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const handleAddAttribute = () => {
    if (!selectedId) return;
    dispatch(createFoodAttribute({ dish_id: selectedId, attribute_type: attrDraft.type, value: attrDraft.value }));
  };

  const executeDeleteAttribute = async () => {
    if (attrDeleteTarget) {
      await dispatch(deleteFoodAttribute(attrDeleteTarget.id));
      setAttrDeleteTarget(null);
    }
  };

  const handleAddPairing = () => {
    if (!selectedId || !pairingDraft.product_id) return;
    dispatch(createWineFoodPairing({
      dish_id: selectedId,
      product_id: pairingDraft.product_id,
      reason: pairingDraft.reason,
      pairing_type: pairingDraft.pairing_type,
      admin_id: admin?.id || admin?.uuid || 'system_admin',
    }));
    setPairingDraft((p) => ({ ...p, reason: '' }));
  };

  const executeDeletePairing = async () => {
    if (pairingDeleteTarget) {
      await dispatch(deleteWineFoodPairing(pairingDeleteTarget.id));
      setPairingDeleteTarget(null);
    }
  };

  const selected = dishes?.find((d) => d.id === selectedId);
  const dishAttributes = foodAttributes?.filter((a) => a.dish_id === selectedId) || [];
  const dishPairings = pairings?.filter((p) => p.dish_id === selectedId) || [];

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Food &amp; Pairings</h1>
        <p className="text-sm text-gray-500 mt-1">Dishes the Sommelier can pair against, their taste attributes, and curated wine pairings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Dishes</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && dishes.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : dishes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No dishes yet — add one below.</p>
            ) : (
              pagedDishes.map((dish) => {
                const count = pairings?.filter((p) => p.dish_id === dish.id).length || 0;
                return (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedId(dish.id)}
                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                      selectedId === dish.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedId === dish.id ? 'text-violet-700' : 'text-gray-900'}`}>{dish.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        {dish.origin || '—'}
                        <Badge tone={dish.is_local ? 'green' : 'sky'} size="sm">{dish.is_local ? 'Local' : 'Intl'}</Badge>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                      {count > 0 && <span className="text-xs text-gray-400 whitespace-nowrap">{count} pairing{count !== 1 ? 's' : ''}</span>}
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(dish); }} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {pagination && (
            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
              <Pagination meta={pagination} onPageChange={setCurrentPage} compact />
            </div>
          )}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Dish</p>
            <input
              type="text" value={newDish.name} onChange={(e) => setNewDish((d) => ({ ...d, name: e.target.value }))}
              placeholder="Name, e.g. Fufu & Palm Nut Soup"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <input
              type="text" value={newDish.origin} onChange={(e) => setNewDish((d) => ({ ...d, origin: e.target.value }))}
              placeholder="Origin, e.g. Ghana (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs text-gray-600">Ghanaian / local dish</span>
              <Switch checked={newDish.is_local} onChange={(val) => setNewDish((d) => ({ ...d, is_local: val }))} />
            </div>
            <button onClick={handleAddDish} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Dish
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-card flex items-center justify-center py-20 text-sm text-gray-400">
              Select a dish to view details.
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Dish Details</h3>
                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:border-violet-300 text-center overflow-hidden">
                      {detail.image_url && typeof detail.image_url === 'string' ? (
                        <img src={detail.image_url} alt="" className="w-full h-full object-cover" />
                      ) : 'Upload photo'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setDetail((p) => ({ ...p, image_url: e.target.files[0] }))} />
                    </label>
                    <span className="block text-center text-xs text-violet-600 font-medium mt-1.5">Change</span>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                      <input type="text" value={detail.name} onChange={(e) => setDetail((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1.5">Origin</label>
                      <input type="text" value={detail.origin} onChange={(e) => setDetail((p) => ({ ...p, origin: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                    </div>
                    <div className="col-span-2 flex items-center justify-between px-0.5">
                      <span className="font-medium text-gray-700">Ghanaian / local dish</span>
                      <Switch checked={detail.is_local} onChange={(val) => setDetail((p) => ({ ...p, is_local: val }))} />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea rows="2" value={detail.description} onChange={(e) => setDetail((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:border-violet-500" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-5">
                  <button onClick={handleSaveDish} disabled={mutationLoading}
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                    {mutationLoading && <Loader2 size={14} className="animate-spin" />} Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Taste Attributes</h3>
                <p className="text-xs text-gray-400 mb-4">Scored 0–10 · used by the Sommelier to match wines to this dish.</p>
                <div className="flex items-center gap-2 mb-4">
                  <select value={attrDraft.type} onChange={(e) => setAttrDraft((d) => ({ ...d, type: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500">
                    {ATTRIBUTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" min="0" max="10" placeholder="0–10" value={attrDraft.value}
                    onChange={(e) => setAttrDraft((d) => ({ ...d, value: e.target.value }))}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
                  <Button type="button" size="sm" appearance="secondary" disabled={attrMutationLoading} onClick={handleAddAttribute}>
                    {attrMutationLoading ? <Loader2 size={13} className="animate-spin" /> : 'Add'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dishAttributes.map((attr) => (
                    <span key={attr.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                      {attr.attribute_type} {attr.value}
                      <button onClick={() => setAttrDeleteTarget(attr)} className="text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {dishAttributes.length === 0 && <p className="text-sm text-gray-400">No attributes scored yet.</p>}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Wine Pairings</h3>
                <div className="flex items-center gap-2 mb-4">
                  <select value={pairingDraft.product_id} onChange={(e) => setPairingDraft((d) => ({ ...d, product_id: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500 min-w-[160px]">
                    {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={pairingDraft.pairing_type} onChange={(e) => setPairingDraft((d) => ({ ...d, pairing_type: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:border-violet-500">
                    <option value="local">Local</option>
                    <option value="international">International</option>
                  </select>
                  <input type="text" placeholder="Why it works (optional)" value={pairingDraft.reason}
                    onChange={(e) => setPairingDraft((d) => ({ ...d, reason: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
                  <Button type="button" size="sm" appearance="secondary" disabled={pairingMutationLoading} onClick={handleAddPairing}>
                    {pairingMutationLoading ? <Loader2 size={13} className="animate-spin" /> : 'Add'}
                  </Button>
                </div>
                <div className="divide-y divide-gray-100">
                  {dishPairings.map((pair) => (
                    <div key={pair.id} className="flex items-start justify-between py-3 first:pt-0">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                          {products?.find((p) => p.id === pair.product_id)?.name || pair.product_id}
                          {pair.pairing_type && <Badge tone={pair.pairing_type === 'local' ? 'green' : 'sky'} size="sm">{pair.pairing_type}</Badge>}
                        </p>
                        {pair.reason && <p className="text-sm text-gray-600 mt-0.5">{pair.reason}</p>}
                        <p className="text-xs text-gray-400 italic mt-1">
                          {/* A null admin_id means this pairing came from the supplier-corpus importer, which will
                              overwrite it on the next import — a human-authored one never gets clobbered. */}
                          {pair.admin_id ? `Edited by ${pair.admin_name || 'an admin'}` : 'From supplier notes'}
                        </p>
                      </div>
                      <button onClick={() => setPairingDeleteTarget(pair)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {dishPairings.length === 0 && <p className="text-sm text-gray-400 py-2">No wine pairings yet.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteDish}
        title="Delete Dish"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? This also removes its attributes and pairings.`}
      />
      <ConfirmDeleteModal
        isOpen={!!attrDeleteTarget}
        isDeleting={attrMutationLoading}
        onClose={() => setAttrDeleteTarget(null)}
        onConfirm={executeDeleteAttribute}
        title="Remove Attribute"
        message={`Remove "${attrDeleteTarget?.attribute_type} ${attrDeleteTarget?.value}" from this dish?`}
      />
      <ConfirmDeleteModal
        isOpen={!!pairingDeleteTarget}
        isDeleting={pairingMutationLoading}
        onClose={() => setPairingDeleteTarget(null)}
        onConfirm={executeDeletePairing}
        title="Remove Pairing"
        message="Remove this wine pairing from the dish?"
      />
    </div>
  );
};

export default FoodAndPairings;
