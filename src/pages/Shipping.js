import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  clearShippingZoneStatus
} from '../redux/ShippingZoneSlice';
import {
  fetchShippingRates,
  createShippingRate,
  deleteShippingRate,
  clearShippingRateStatus,
} from '../redux/ShippingRateSlice';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from '../components/Toast';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Button from '../components/ui/Button';

const emptyDetail = { name: '', description: '' };
const emptyRate = { min_weight: '0.0', max_weight: '5.0', price: '10.00' };

const Shipping = () => {
  const dispatch = useDispatch();
  const { shippingZones: zones, loading, mutationLoading, error, successMessage } = useSelector((s) => s.shippingZones);
  const {
    shippingRates: rates,
    mutationLoading: rateMutationLoading,
    error: rateError,
    successMessage: rateSuccessMessage,
  } = useSelector((s) => s.shippingRates);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [newZoneName, setNewZoneName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rateDeleteTarget, setRateDeleteTarget] = useState(null);
  const [rateDraft, setRateDraft] = useState(emptyRate);

  useEffect(() => {
    dispatch(fetchShippingZones({ per_page: 200 }));
    dispatch(fetchShippingRates({ per_page: 500 }));
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId && zones?.length) setSelectedId(zones[0].id);
  }, [zones, selectedId]);

  useEffect(() => {
    const zone = zones?.find((z) => z.id === selectedId);
    if (zone) setDetail({ name: zone.name || '', description: zone.description || '' });
  }, [selectedId, zones]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearShippingZoneStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearShippingZoneStatus());
      // createShippingZone/updateShippingZone don't merge into local state, so refetch to reflect changes
      dispatch(fetchShippingZones({ per_page: 200 }));
    }
  }, [error, successMessage, dispatch]);

  useEffect(() => {
    if (rateError) { toast.error(rateError); dispatch(clearShippingRateStatus()); }
    if (rateSuccessMessage) {
      toast.success(rateSuccessMessage);
      dispatch(clearShippingRateStatus());
      dispatch(fetchShippingRates({ per_page: 500 }));
    }
  }, [rateError, rateSuccessMessage, dispatch]);

  const handleAddZone = () => {
    if (!newZoneName.trim()) return;
    dispatch(createShippingZone({ name: newZoneName, description: '' }));
    setNewZoneName('');
  };

  const handleSaveZone = () => {
    if (selectedId) dispatch(updateShippingZone({ id: selectedId, data: detail }));
  };

  const executeDeleteZone = async () => {
    if (deleteTarget) {
      await dispatch(deleteShippingZone(deleteTarget.id));
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    }
  };

  const handleAddRate = () => {
    if (!selectedId) return;
    dispatch(createShippingRate({
      shipping_zone_id: selectedId,
      min_weight: parseFloat(rateDraft.min_weight),
      max_weight: parseFloat(rateDraft.max_weight),
      price: parseFloat(rateDraft.price),
    }));
  };

  const executeDeleteRate = async () => {
    if (rateDeleteTarget) {
      await dispatch(deleteShippingRate(rateDeleteTarget.id));
      setRateDeleteTarget(null);
    }
  };

  const selected = zones?.find((z) => z.id === selectedId);
  const zoneRates = rates?.filter((r) => r.shipping_zone_id === selectedId) || [];

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Shipping</h1>
        <p className="text-sm text-gray-500 mt-1">Delivery zones and their weight-band rates. Checkout picks the rate whose band covers the order's total weight.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
        {/* LIST PANEL */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-card flex flex-col max-h-[calc(100vh-220px)]">
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900">Zones</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && zones.length === 0 ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
            ) : (
              zones.map((zone) => {
                const count = rates?.filter((r) => r.shipping_zone_id === zone.id).length || 0;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedId(zone.id)}
                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                      selectedId === zone.id ? 'bg-violet-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${selectedId === zone.id ? 'text-violet-700' : 'text-gray-900'}`}>{zone.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{zone.description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{count} rate{count !== 1 ? 's' : ''}</span>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(zone); }} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Zone</p>
            <input
              type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="Name, e.g. West Africa"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-violet-500"
            />
            <button onClick={handleAddZone} disabled={mutationLoading}
              className="w-full py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
              {mutationLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add Zone
            </button>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div className="space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-card flex items-center justify-center py-20 text-sm text-gray-400">
              Select a zone to view details.
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Zone Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                    <input type="text" value={detail.name} onChange={(e) => setDetail((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5">Description</label>
                    <input type="text" value={detail.description} onChange={(e) => setDetail((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Suburbs covered, delivery window..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-violet-500" />
                  </div>
                </div>
                <div className="flex justify-end mt-5">
                  <button onClick={handleSaveZone} disabled={mutationLoading}
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                    {mutationLoading && <Loader2 size={14} className="animate-spin" />} Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Rates</h3>
                <div className="flex items-center gap-2 mb-4">
                  <input type="number" step="0.1" min="0" placeholder="Min kg" value={rateDraft.min_weight}
                    onChange={(e) => setRateDraft((r) => ({ ...r, min_weight: e.target.value }))}
                    className="w-24 px-2 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
                  <span className="text-gray-400">→</span>
                  <input type="number" step="0.1" min="0" placeholder="Max kg" value={rateDraft.max_weight}
                    onChange={(e) => setRateDraft((r) => ({ ...r, max_weight: e.target.value }))}
                    className="w-24 px-2 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
                  <input type="number" step="0.01" min="0" placeholder="Price ₵" value={rateDraft.price}
                    onChange={(e) => setRateDraft((r) => ({ ...r, price: e.target.value }))}
                    className="w-28 px-2 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-violet-500" />
                  <Button type="button" size="sm" appearance="secondary" disabled={rateMutationLoading} onClick={handleAddRate}>
                    {rateMutationLoading ? <Loader2 size={13} className="animate-spin" /> : 'Add Rate'}
                  </Button>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Weight Band</span>
                    <span>Price</span>
                  </div>
                  {zoneRates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-gray-700">{Number(rate.min_weight).toFixed(0)} – {Number(rate.max_weight).toFixed(0)} kg</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">₵{Number(rate.price).toFixed(0)}</span>
                        <button onClick={() => setRateDeleteTarget(rate)} className="text-gray-300 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {zoneRates.length === 0 && <p className="text-sm text-gray-400 py-3">No rates configured for this zone yet.</p>}
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
        onConfirm={executeDeleteZone}
        title="Delete Shipping Zone"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? Its rates will stop applying.`}
      />
      <ConfirmDeleteModal
        isOpen={!!rateDeleteTarget}
        isDeleting={rateMutationLoading}
        onClose={() => setRateDeleteTarget(null)}
        onConfirm={executeDeleteRate}
        title="Delete Rate"
        message={rateDeleteTarget ? `Remove the ${Number(rateDeleteTarget.min_weight).toFixed(0)}–${Number(rateDeleteTarget.max_weight).toFixed(0)} kg rate?` : ''}
      />
    </div>
  );
};

export default Shipping;
