import React, { useState } from 'react';

const InputField = ({ label, type = 'text', name, value, onChange, placeholder, error, required = true }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determine current input type dynamically
  const isPasswordType = type === 'password';
  const currentType = isPasswordType && showPassword ? 'text' : type;

  return (
    <div className="w-full mb-4">
      <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={currentType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-4 pr-12 py-3 bg-white border text-zinc-900 placeholder-zinc-400 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
            error 
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-zinc-200 focus:ring-emerald-800/10 focus:border-emerald-800'
          }`}
        />

        {/* Visibility Toggle Button for Password Fields */}
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-semibold px-2 py-1 select-none transition-colors"
          >
            {showPassword ? 'HIDE' : 'SHOW'}
          </button>
        )}
      </div>
      
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
};

export default InputField;