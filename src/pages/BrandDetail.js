import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchBrandById, clearCurrentBrand } from '../redux/BrandSlice';
import { ArrowLeft, Loader2, Calendar, FileText, LayoutGrid } from 'lucide-react';

const BrandDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentBrand, loading } = useSelector((state) => state.brands);

  useEffect(() => {
    dispatch(fetchBrandById(id));
    return () => { dispatch(clearCurrentBrand()); };
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#c4945c]" size={28} />
        <span className="text-xs text-zinc-400 font-medium tracking-wide">Resolving winery profiles...</span>
      </div>
    );
  }

  if (!currentBrand) {
    return (
      <div className="text-center py-20 bg-white border border-zinc-200 rounded-xl shadow-xs">
        <h3 className="text-sm font-bold text-zinc-700">Winery Identity Unresolved</h3>
        <button onClick={() => navigate('/dashboard/brands')} className="mt-4 px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-lg shadow-sm">Return to Ledger</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ACTION HEADER ROW */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/brands')} className="p-2 border border-zinc-200 rounded-lg hover:bg-zinc-100 bg-white transition-colors"><ArrowLeft size={16} /></button>
        <div>
          <span className="text-[10px] font-bold text-[#c4945c] uppercase tracking-wider">Overview </span>
          <h1 className="text-xl font-serif font-bold text-zinc-900 tracking-tight">{currentBrand.name}</h1>
        </div>
      </div>

      {/* CORE DATA LAYOUT WRAPPER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROFILE METRICS CARD */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs h-fit space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-zinc-100">
            <div className="w-24 h-24 rounded-xl bg-zinc-50 border border-zinc-100 p-2 overflow-hidden flex items-center justify-center shadow-xs">
              {currentBrand.logo_url ? (
                <img src={currentBrand.logo_url} alt={currentBrand.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-serif text-zinc-400 font-bold">{currentBrand.name?.[0]}</span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">{currentBrand.name}</h2>
              <p className="text-[10px] font-mono bg-zinc-50 border border-zinc-200/60 text-zinc-400 px-2 py-0.5 rounded-full mt-1 inline-block">{currentBrand.slug}</p>
            </div>
          </div>

          {/* META INFO GROUPS */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Unique Index ID</span>
              <span className="font-mono font-bold text-zinc-700 bg-zinc-50 px-2 py-0.5 border border-zinc-100 rounded text-[10px]">{currentBrand.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium flex items-center gap-1.5"><Calendar size={13} /> Created on</span>
              <span className="text-zinc-700 font-semibold">{currentBrand.created_at ? new Date(currentBrand.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE TEXT DETAILS BLOCK */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c4945c] flex items-center gap-2"><FileText size={14}/> Description</h3>
            <p className="text-xs font-light text-zinc-600 leading-relaxed whitespace-pre-wrap">
              {currentBrand.description || "No customized background biography profile narrative has been logged for this winery brand asset node."}
            </p>
          </div>

          {/* EMPTY SUB-MODULE INJECTORS FOR PRODUCT CORRELATIONS */}
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center">
            <div className="w-10 h-10 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 mx-auto mb-2"><LayoutGrid size={16}/></div>
            <h4 className="text-xs font-bold text-zinc-700">Linked Inventory </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">Product entities tied to this brand profile node automatically appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetail;