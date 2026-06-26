import React from 'react';
import { useSelector } from 'react-redux';
import { 
  DollarSign, 
  ShoppingBag, 
  Wine, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  Percent 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const { admin } = useSelector((state) => state.auth);

  // Mock metric data for layout visualization
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$24,580.00',
      change: '+12.5% vs last month',
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: 'Active Orders',
      value: '42 Pending',
      change: '8 awaiting fulfillment',
      isPositive: true,
      icon: ShoppingBag,
    },
    {
      title: 'Wine SKU Inventory',
      value: '1,284 Bottles',
      change: '14 low stock alerts',
      isPositive: false,
      icon: Wine,
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: '+0.4% this week',
      isPositive: true,
      icon: TrendingUp,
    },
  ];

  // Mock data representing recent orders queue
  const recentOrders = [
    { id: 'ORD-9482', customer: 'Amara Mensah', bottle: 'Château Margaux 2015', total: '$650.00', status: 'Processing' },
    { id: 'ORD-9481', customer: 'Kwame Asante', bottle: 'Barolo Riserva 2016', total: '$320.00', status: 'Shipped' },
    { id: 'ORD-9480', customer: 'Elena Rostova', bottle: 'Dom Pérignon Vintage', total: '$890.00', status: 'Delivered' },
    { id: 'ORD-9479', customer: 'John Doe', bottle: 'Penfolds Grange Shiraz', total: '$1,200.00', status: 'Pending Payment' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. WELCOME BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-900 tracking-tight">
            Vintner Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Good day, <span className="font-semibold text-zinc-700">{admin?.first_name || 'Admin'}</span>. Here is what is happening across your cellar portal today.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/products')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={14} />
            Add New Wine
          </button>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div 
                  style={{ backgroundColor: '#2c4236' }} 
                  className="p-2 rounded-lg text-white"
                >
                  <Icon size={16} />
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-2xl font-serif font-bold text-zinc-900">{stat.value}</h3>
                <p className={`text-xs font-medium mt-1 ${stat.isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN CONTENTS WORKSPACE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Recent Orders Table (Takes up 2 spans) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-zinc-900 tracking-tight text-base">
                Recent Orders Queue
              </h3>
              <button 
                onClick={() => navigate('/dashboard/orders')}
                className="text-xs font-bold text-[#c4945c] hover:text-[#b0824b] flex items-center gap-1 transition-colors"
              >
                View Queue <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="py-3 px-5">ID</th>
                    <th className="py-3 px-5">Customer</th>
                    <th className="py-3 px-5">Allocation</th>
                    <th className="py-3 px-5">Total</th>
                    <th className="py-3 px-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-zinc-900 font-bold">{order.id}</td>
                      <td className="py-3.5 px-5 font-medium text-zinc-800">{order.customer}</td>
                      <td className="py-3.5 px-5 text-zinc-500 font-light truncate max-w-[160px]">{order.bottle}</td>
                      <td className="py-3.5 px-5 text-zinc-900 font-semibold">{order.total}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                          order.status === 'Delivered' || order.status === 'Shipped'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Admin Console Hub */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-serif font-bold text-zinc-900 tracking-tight text-base pb-2 border-b border-zinc-100">
            Console Shortcuts
          </h3>
          
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => navigate('/dashboard/coupons')}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-[#c4945c]/30 hover:bg-zinc-50 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-[#c4945c] rounded-md">
                  <Percent size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-800">Create Promotion Campaign</h4>
                  <p className="text-[10px] text-zinc-400">Launch a coupon markdown sequence</p>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-[#c4945c] transition-colors" />
            </button>

            <button
              onClick={() => navigate('/dashboard/blogs')}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 hover:border-[#c4945c]/30 hover:bg-zinc-50 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-[#2c4236] rounded-md">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-800">Draft Editorial Post</h4>
                  <p className="text-[10px] text-zinc-400">Publish to the brand winery blog</p>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-[#c4945c] transition-colors" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;