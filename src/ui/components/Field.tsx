import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}

export function FieldShell({ id, label, help, error, children }: FieldShellProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      <div id={`${id}-help`} className={`field__help ${error ? "field__help--error" : ""}`}>
        {error ?? help ?? "\u00a0"}
      </div>
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  help?: string;
  error?: string;
}

export function TextField({ id, label, help, error, ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} {...props} />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({ id, label, help, error, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} help={help} error={error}>
      <select id={id} aria-invalid={Boolean(error)} aria-describedby={`${id}-help`} {...props}>
        {children}
      </select>
    </FieldShell>
  );
}
