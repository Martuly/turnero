import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

const baseField =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...rest }, ref) => {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input ref={ref} id={inputId} className={`${baseField} h-10 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`} {...rest} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className = '', id, children, ...rest }, ref) => {
  const selectId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select ref={ref} id={selectId} className={`${baseField} h-10 ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`} {...rest}>
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = '', id, ...rest }, ref) => {
  const textareaId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea ref={ref} id={textareaId} className={`${baseField} py-2 ${error ? 'border-red-400' : ''} ${className}`} {...rest} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
Textarea.displayName = 'Textarea';
