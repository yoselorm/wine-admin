import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchWineRegions, 
  createWineRegion, 
  updateWineRegion, 
  deleteWineRegion, 
  clearWineRegionStatus 
} from '../redux/WineRegionSlice';
import { 
  Plus, Search, Loader2, Trash2, Edit3, Globe, 
  ArrowUpDown, AlertTriangle, X, Eye, EyeOff 
} from 'lucide-react';
import toast from '../components/Toast';
import Pagination from '../components/Pagination';

// Debounce hook to manage server-side search calls effectively
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const WineRegions = () => {
  const dispatch = useDispatch();

  // Redux States
  const { regions, pagination, loading, mutationLoading, error, successMessage } = useSelector(s => s.wineRegions);

  // Modal & Overlay Visibility Toggles
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null); // Context for Active Updates / Drops

  // Filtering Options States (Screenshot 2026-06-26 at 10.06.19.png)
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [regionTypeFilter, setRegionTypeFilter] = useState(''); // country, region, subregion
  const [perPage, setPerPage] = useState('15');
  const [sortConfig, setSortConfig] = useState({ sort_by: 'position', sort_order: 'asc' });

  const debouncedSearch = useDebounce(searchInput, 400);

  // Form Initial Schema state mapping the POST specification schema directly
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'region', // Default value fallback
    parent_id: '',
    iso_code: '',
    flag_url: '',
    image_url: '',
    is_published: true,
    position: 1
  });

  // 1. Gather Resource Collection Blocks via Core parameters
  const loadRegions = useCallback(() => {
    dispatch(fetchWineRegions({
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch,
      type: regionTypeFilter || undefined, // Avoid blank string passing
      ...sortConfig
    }));
  }, [currentPage, perPage, debouncedSearch, regionTypeFilter, sortConfig, dispatch]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  // 2. Feedback Status Side-Effects Interceptors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWineRegionStatus());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWineRegionStatus());
      setIsFormModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedRegion(null);
      loadRegions();
    }
  }, [error, successMessage, loadRegions, dispatch]);

  // 3. User Interaction UI Event Mappers
  const handleSort = (field) => {
    setSortConfig(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper utility to make URL slug string updates dynamic as human typists key entries in
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: selectedRegion ? prev.slug : value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  // 4. Submission Operations Lifecycle Exits
  const openCreateModal = () => {
    setSelectedRegion(null);
    setFormData({
      name: '', slug: '', description: '', type: 'region',
      parent_id: '', iso_code: '', flag_url: '', image_url: '',
      is_published: true, position: 1
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (region) => {
    setSelectedRegion(region);
    setFormData({
      name: region.name || '',
      slug: region.slug || '',
      description: region.description || '',
      type: region.type || 'region',
      parent_id: region.parent_id || '',
      iso_code: region.iso_code || '',
      flag_url: region.flag_url || '',
      image_url: region.image_url || '',
      is_published: region.is_published !== undefined ? region.is_published : true,
      position: region.position || 1
    });
    setIsFormModalOpen(true);
  };

  const openDeleteConfirmation = (region) => {
    setSelectedRegion(region);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanPayload = {
      ...formData,
      position: Number(formData.position),
      parent_id: formData.parent_id || null // Strip clean down to API database null specs
    };

    if (selectedRegion) {
      dispatch(updateWineRegion({ id: selectedRegion.id, data: cleanPayload }));
    } else {
      dispatch(createWineRegion(cleanPayload));
    }
  };

  const handleDeleteExecute = () => {
    if (selectedRegion?.id) {
      dispatch(deleteWineRegion(selectedRegion.id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* VIEW PANEL HEADER CONTEXT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">Wine Regions</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organize international classification layouts, territorial nested subregions, regional maps, and visual flag identifiers.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} /> Add Territory Region
        </button>
      </div>

      {/* FILTER CONTROL DECK SYSTEM (Screenshot 2026-06-26 at 10.06.19.png parameters) */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Dynamic Parameter 1: Keyword Engine Match Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search matching regions or slugs..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 text-zinc-700 bg-zinc-50/50"
          />
        </div>

        {/* Dynamic Parameter 2: Explicit Type Layer Filter Dropdown */}
        <div>
          <select
            value={regionTypeFilter}
            onChange={(e) => { setRegionTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="">All Geographical Profiles</option>
            <option value="country">Countries Only</option>
            <option value="region">Regions Only</option>
            <option value="subregion">Subregions Only</option>
          </select>
        </div>

        {/* Dynamic Parameter 3: Page Layout Dimension Cap Matrix Selector */}
        <div className="flex items-center gap-3 justify-end">
          <span className="text-zinc-400 font-medium whitespace-nowrap">Matrix Row Limit:</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-950 text-zinc-700"
          >
            <option value="15">15 rows</option>
            <option value="30">30 rows</option>
            <option value="50">50 rows</option>
          </select>
          {loading && <Loader2 className="animate-spin text-zinc-400 ml-1" size={14} />}
        </div>
      </div>

      {/* REGION REPOSITORIES CORE DATAGRID */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {loading && regions?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={24} />
            <span className="text-xs text-zinc-400">Querying map index topologies...</span>
          </div>
        ) : regions?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <Globe size={20} />
            </div>
            <h3 className="text-xs font-bold text-zinc-700">No matching boundaries registered</h3>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Territory Name / Slug <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('type')}>
                      <div className="flex items-center gap-1.5">Scale Type <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('iso_code')}>
                      <div className="flex items-center gap-1.5">ISO Mapping <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => handleSort('position')}>
                      <div className="flex items-center gap-1.5">Position <ArrowUpDown size={10} /></div>
                    </th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {regions?.map((reg) => (
                    <tr key={reg.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {reg.flag_url ? (
                            <img src={reg.flag_url} alt="Flag" className="w-5 h-3.5 object-cover rounded shadow-xs border border-zinc-200/80" />
                          ) : (
                            <div className="w-5 h-3.5 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[8px] text-zinc-400 font-bold">W</div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-900 flex items-center gap-2">
                              {reg.name}
                              {!reg.is_published && <span className="inline-flex text-[9px] px-1 bg-amber-50 border border-amber-200 text-amber-700 font-normal rounded">Draft</span>}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">/{reg.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                          reg.type === 'country' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          reg.type === 'region' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-zinc-100 text-zinc-700 border border-zinc-200'
                        }`}>
                          {reg.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-zinc-700">
                        {reg.iso_code || <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 font-mono">
                        Idx {reg.position}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(reg)}
                          className="inline-flex p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation(reg)}
                          className="inline-flex p-1.5 text-zinc-400 hover:text-red-600 bg-zinc-50 hover:bg-red-50 border border-zinc-200 hover:border-red-100 rounded-md transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* INTEGRATED PERSISTENT PAGINATION BOX */}
            <div className="px-5 py-4 border-t border-zinc-100">
              <Pagination meta={pagination} onPageChange={handlePageChange} />
            </div>
          </>
        )}
      </div>

      {/* CORE CONTROL FORM MODAL OVERLAY (CREATE & EDIT MODAL SYSTEM) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 shadow-2xl rounded-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {selectedRegion ? 'Modify Wine Region' : 'Register Wine Region'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Define metadata matrices that establish dynamic catalog search dependencies.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs text-zinc-700 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Name and Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Appellation / Region Name *</label>
                  <input
                    type="text" required placeholder="e.g., Bordeaux"
                    value={formData.name} onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">URL Identifier Slug *</label>
                  <input
                    type="text" required placeholder="e.g., bordeaux"
                    value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 bg-zinc-50/50"
                  />
                </div>
              </div>

              {/* Row 2: Type Matrix and Parent Node Map Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Classification Scale Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950"
                  >
                    <option value="country">Country Hierarchy Node</option>
                    <option value="region">Region Appellation Node</option>
                    <option value="subregion">Subregion Localized Node</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Parent Geographical Node</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-zinc-950"
                  >
                    <option value="">No Structural Parent Node (Top Level)</option>
                    {regions
                      ?.filter(r => r.id !== selectedRegion?.id && r.type !== 'subregion')
                      ?.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.type.toUpperCase()})</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Row 3: ISO Code and Weight Placement Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">ISO Alpha Identifier Key</label>
                  <input
                    type="text" placeholder="e.g., FR-B0"
                    value={formData.iso_code} onChange={(e) => setFormData(prev => ({ ...prev, iso_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-700">Sorting Display Weight Order Position *</label>
                  <input
                    type="number" min="1" required
                    value={formData.position} onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                  />
                </div>
              </div>

              {/* Row 4: Image URLs Mapping Context Assets */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Flag URL</label>
                <input
                  type="url" placeholder="https://example.com/flags/france.png"
                  value={formData.flag_url} onChange={(e) => setFormData(prev => ({ ...prev, flag_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700"> Image URL</label>
                <input
                  type="url" placeholder="https://example.com/images/bordeaux.jpg"
                  value={formData.image_url} onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950"
                />
              </div>

              {/* Description Block Field Textarea */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">Contextual Narrative Description Summary</label>
                <textarea
                  rows="3" placeholder="Describe the geographical climate traits, historic context or classification markers..."
                  value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-950 resize-none"
                />
              </div>

              {/* Visibility Active State Checklist */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200/60 rounded-lg">
                <input
                  type="checkbox" id="is_published"
                  checked={formData.is_published} onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 accent-zinc-950"
                />
                <label htmlFor="is_published" className="select-none font-semibold text-zinc-800">
                  Publish this asset to active production index views
                </label>
              </div>

              {/* Active Modal Buttons Execution Dock */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button" onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={mutationLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors"
                >
                  {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                  {selectedRegion ? 'Apply Configurations' : 'Commit Region'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFETY DELETION CONFIRMATION DIALOG OVERLAY */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs" onClick={() => setIsDeleteModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 shadow-2xl rounded-xl p-5 z-10 text-xs text-zinc-700 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Purge Selected Territory Node?</h4>
                <p className="text-zinc-500 leading-relaxed">
                  Are you sure you want to delete **{selectedRegion?.name}**? This removes the region profile index data immediately. Any products linked strictly to this locale will lose their geographic associations. This process cannot be reversed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-zinc-100">
              <button
                type="button" disabled={mutationLoading} onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 border border-zinc-200 rounded-lg font-semibold hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Dismiss
              </button>
              <button
                type="button" disabled={mutationLoading} onClick={handleDeleteExecute}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
              >
                {mutationLoading && <Loader2 size={12} className="animate-spin" />}
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WineRegions;