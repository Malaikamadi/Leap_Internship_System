import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label?: string;
  helperText?: string;
  showLeadingIcon?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  helperText,
  showLeadingIcon = true,
  className,
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {showLeadingIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={cn(
            'block w-full py-2.5 pr-10 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15',
            showLeadingIcon ? 'pl-9' : 'pl-3',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide characters' : 'Show characters'}
          aria-pressed={visible}
          title={visible ? 'Hide' : 'Show'}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helperText && <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
};
