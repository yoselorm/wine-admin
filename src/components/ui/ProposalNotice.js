import React from 'react';

const ProposalNotice = ({ children }) => (
  <div className="px-5 py-4 rounded-xl bg-violet-50 text-sm text-gray-700">
    <span className="font-bold text-violet-600 mr-1.5">Design proposal</span>
    {children}
  </div>
);

export default ProposalNotice;
