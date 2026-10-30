"use client";

// The form fields this app uses, all wired to react-hook-form + zod the same way:
//   <XField form={form} name="field" label="Label" description="Hint" optional />
// Labels, hints, errors, "Optional" tags and counters are handled by one shell, so every form looks and behaves the same.
//
// One rule for forms using these: list EVERY field in `defaultValues` (text as "", others as
// undefined). react-hook-form compares the whole object for "dirty", so a missing key reads as a change.

import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { Controller, type FieldValues, type Path, type PathValue, type UseFormReturn } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; description?: string; icon?: LucideIcon };

export type FieldProps<T extends FieldValues> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>;
  name: Path<T>;
  label: string;
  description?: ReactNode;
  /** Shows a quiet "Optional" tag; required is the default and needs no marker. */
  optional?: boolean;
  className?: string;
};

const control = "h-10 text-[16px] md:text-[14px]";

function errorOf<T extends FieldValues>(form: FieldProps<T>["form"], name: Path<T>) {
  const e = name.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], form.formState.errors);
  const message = (e as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
}

const idOf = (name: string) => `f-${name.replaceAll(".", "-")}`;

/** Label row (with optional tag and counter), the control, then the error or the hint. */
function Shell({
  id,
  label,
  optional,
  description,
  error,
  aside,
  className,
  children,
  asLegend,
}: {
  id?: string;
  label: string;
  optional?: boolean;
  description?: ReactNode;
  error?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
  asLegend?: boolean;
}) {
  return (
    <Field data-invalid={!!error} className={cn("gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        {asLegend ? (
          <span id={id} className="text-[13px] leading-snug font-medium">
            {label}
            {optional && <span className="text-muted-foreground ml-1.5 font-normal">Optional</span>}
          </span>
        ) : (
          <FieldLabel htmlFor={id} className="text-[13px]">
            {label}
            {optional && <span className="text-muted-foreground font-normal">Optional</span>}
          </FieldLabel>
        )}
        {aside}
      </div>
      {children}
      {error ? (
        <FieldError className="text-[12px]">{error}</FieldError>
      ) : (
        description && <FieldDescription className="text-[12px] leading-[18px]">{description}</FieldDescription>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------- text-like

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  type = "text",
  icon: Icon,
  prefix,
  suffix,
  ...input
}: FieldProps<T> & {
  type?: "text" | "email" | "url" | "search" | "number";
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
} & Omit<React.ComponentProps<"input">, "form" | "name" | "type" | "prefix">) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
      <div className="relative">
        {(Icon || prefix) && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 flex -translate-y-1/2 items-center text-[14px]">
            {Icon ? <Icon className="size-4" strokeWidth={1.75} /> : prefix}
          </span>
        )}
        <Input
          id={id}
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          aria-invalid={!!error}
          className={cn(control, (Icon || prefix) && "pl-10", suffix && "pr-20")}
          {...input}
          {...form.register(name, type === "number" ? { setValueAs: (v) => (v === "" ? undefined : Number(v)) } : {})}
        />
        {suffix && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[13px]">
            {suffix}
          </span>
        )}
      </div>
    </Shell>
  );
}

export function TextareaField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  maxLength,
  ...textarea
}: FieldProps<T> & Omit<React.ComponentProps<"textarea">, "form" | "name">) {
  const error = errorOf(form, name);
  const id = idOf(name);
  const length = String(form.watch(name) ?? "").length;
  return (
    <Shell
      id={id}
      label={label}
      optional={optional}
      description={description}
      error={error}
      className={className}
      aside={
        maxLength ? (
          <span className={cn("text-[12px] tabular-nums", length > maxLength * 0.9 ? "text-warning" : "text-muted-foreground")}>
            {length}/{maxLength}
          </span>
        ) : undefined
      }
    >
      <Textarea
        id={id}
        aria-invalid={!!error}
        maxLength={maxLength}
        className="min-h-24 text-[16px] md:text-[14px]"
        {...textarea}
        {...form.register(name)}
      />
    </Shell>
  );
}

// ---------------------------------------------------------------- choosing

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  options,
  placeholder = "Choose…",
}: FieldProps<T> & { options: readonly Option[]; placeholder?: string }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
          <Select
            items={options.map((o) => ({ value: o.value, label: o.label }))}
            value={field.value ?? null}
            onValueChange={(v) => field.onChange(v ?? undefined)}
          >
            <SelectTrigger id={id} aria-invalid={!!error} className="w-full" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Shell>
      )}
    />
  );
}

/** One of a few, all visible: pills. */
export function ChoiceField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  options,
}: FieldProps<T> & { options: readonly Option[] }) {
  const error = errorOf(form, name);
  const value = form.watch(name);
  const id = idOf(name);
  return (
    <Shell id={id} label={label} optional={optional} description={description} error={error} className={className} asLegend>
      <div role="radiogroup" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => form.setValue(name, o.value as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true })}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-2",
                on ? "bg-foreground text-background" : "bg-muted hover:bg-secondary",
              )}
            >
              {o.icon && <o.icon className="size-3.5" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

/** One of a few where each needs explaining: cards with an icon, title and line of detail. */
export function RadioCardsField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  options,
  columns = 2,
}: FieldProps<T> & { options: readonly Option[]; columns?: 2 | 3 }) {
  const error = errorOf(form, name);
  const value = form.watch(name);
  const id = idOf(name);
  return (
    <Shell id={id} label={label} optional={optional} description={description} error={error} className={className} asLegend>
      <div role="radiogroup" aria-labelledby={id} className={cn("grid gap-2", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => form.setValue(name, o.value as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true })}
              className={cn(
                "focus-visible:ring-ring bg-card relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-2",
                on ? "border-foreground shadow-[0_0_0_1px_var(--foreground)]" : "border-input hover:border-foreground/30",
              )}
            >
              {o.icon && (
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", on ? "bg-foreground text-background" : "bg-muted")}>
                  <o.icon className="size-4" strokeWidth={1.75} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">{o.label}</span>
                {o.description && <span className="text-muted-foreground mt-0.5 block text-[12px] leading-[18px]">{o.description}</span>}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                  on ? "border-foreground bg-foreground" : "border-input",
                )}
              >
                {on && <span className="bg-background size-1.5 rounded-full" />}
              </span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

/** A yes/no that needs a sentence of explanation (consent, declarations). */
export function CheckboxField<T extends FieldValues>({ form, name, label, description, className }: Omit<FieldProps<T>, "optional">) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field data-invalid={!!error} orientation="horizontal" className={cn("items-start gap-3", className)}>
          <Checkbox
            id={id}
            checked={!!field.value}
            onCheckedChange={(v) => field.onChange(v === true)}
            aria-invalid={!!error}
            className="mt-0.5 size-[18px]"
          />
          <div className="grid gap-1">
            <FieldLabel htmlFor={id} className="text-[14px] leading-5 font-normal">
              {label}
            </FieldLabel>
            {error ? (
              <FieldError className="text-[12px]">{error}</FieldError>
            ) : (
              description && <FieldDescription className="text-[12px] leading-[18px]">{description}</FieldDescription>
            )}
          </div>
        </Field>
      )}
    />
  );
}
