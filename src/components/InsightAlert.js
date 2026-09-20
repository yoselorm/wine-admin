import React from 'react';
import { AlertTriangle } from 'lucide-react';

const TONES = {
  red: { box: 'bg-red-50 border-red-100', title: 'text-red-700', body: 'text-red-600/80', icon: 'text-red-500' },
  yellow: { box: 'bg-yellow-50 border-yellow-100', title: 'text-yellow-800', body: 'text-yellow-700/80', icon: 'text-yellow-600' },
};

// Shared by the /insights/* pages so "request failed" and "request succeeded but the
// response didn't match what this page expects" never render as a silent blank screen.
const InsightAlert = ({ tone = 'red', title, children }) => {
  const t = TONES[tone];
  return (
    <div className={`flex items-start gap-3 border rounded-xl px-5 py-4 ${t.box}`}>
      <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${t.icon}`} />
      <div>
        <p className={`text-sm font-semibold ${t.title}`}>{title}</p>
        {children && <div className={`text-xs mt-0.5 ${t.body}`}>{children}</div>}
      </div>
    </div>
  );
};

export default InsightAlert;
