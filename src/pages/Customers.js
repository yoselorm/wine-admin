import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProposalNotice from '../components/ui/ProposalNotice';

// NOTE: No customer-directory endpoint is available from the API yet.
// This screen uses placeholder data and can be wired to a real endpoint later.
const MOCK_CUSTOMERS = [
  { id: 1, name: 'Ama Darko', email: 'ama.darko@yahoo.com', joined: '2025-02-10', orders: 24, spent: 41230, wallet: 2840, status: 'active', color: '#8470FF' },
  { id: 2, name: 'Abena Mensah', email: 'abena.mensah@gmail.com', joined: '2025-04-02', orders: 18, spent: 12480, wallet: 615, status: 'active', color: '#67BFFF' },
  { id: 3, name: 'Kwame Mensah-Bonsu', email: 'kwame.mb@gmail.com', joined: '2025-08-18', orders: 11, spent: 9340, wallet: 1200, status: 'active', color: '#3EC972' },
  { id: 4, name: 'Selorm Attah', email: 'selorm@attahventures.com', joined: '2025-11-30', orders: 4, spent: 3105, wallet: 0, status: 'active', color: '#F0BB33' },
  { id: 5, name: 'Efua Boateng', email: 'efua.boateng@gmail.com', joined: '2026-01-14', orders: 9, spent: 4870, wallet: 320, status: 'active', color: '#FF5656' },
  { id: 6, name: 'Kofi Owusu', email: 'kofi.owusu@outlook.com', joined: '2026-03-08', orders: 6, spent: 1240, wallet: 85, status: 'active', color: '#755FF8' },
  { id: 7, name: 'Esi Quartey', email: 'esi.quartey@gmail.com', joined: '2026-05-22', orders: 2, spent: 710, wallet: 0, status: 'active', color: '#56B1F3' },
  { id: 8, name: 'Nii Armah', email: 'nii.armah@gmail.com', joined: '2026-07-01', orders: 6, spent: 623, wallet: 0, status: 'inactive', color: '#9CA3AF' },
];

const formatCedis = (n) => '₵' + Math.round(n).toLocaleString('en-US').replace(/,/g, '.');

const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const Customers = () => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_CUSTOMERS.filter((c) =>
    `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalWallet = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.wallet, 0);
  const avgSpend = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.spent, 0) / MOCK_CUSTOMERS.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
          Customers <span className="text-2xl font-bold text-gray-300">{MOCK_CUSTOMERS.length}</span>
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <ProposalNotice>
        The API does not yet expose a customer-directory endpoint — this screen is a design proposal using placeholder data.
      </ProposalNotice>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{MOCK_CUSTOMERS.length.toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wallet Balances Held</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCedis(totalWallet)}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Lifetime Spend</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCedis(avgSpend)}</p>
        </Card>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Orders</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Wallet</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0" style={{ backgroundColor: c.color }}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {new Date(c.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-700">{c.orders}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-gray-900">{formatCedis(c.spent)}</td>
                  <td className="py-3.5 px-4 text-right text-gray-700">{formatCedis(c.wallet)}</td>
                  <td className="py-3.5 px-6">
                    <Badge tone={c.status === 'active' ? 'green' : 'neutral'}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Customers;
