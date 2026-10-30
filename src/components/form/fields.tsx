"use client";

// Every input type the kit needs, all wired to react-hook-form + zod the same way:
//   <XField form={form} name="field" label="Label" description="Hint" optional />
// Labels, hints, errors, "Optional" tags and counters are handled by one shell, so every form
// in the app looks and behaves the same. See app/app/kit for each one in use.
//
// One rule for forms using these: list EVERY field in `defaultValues` (text as "", others as
// undefined). react-hook-form compares the whole object for "dirty", so a missing key reads as a change.

import { format } from "date-fns";
import { CalendarDays, Check, Eye, EyeOff, FileText, Upload, X, type LucideIcon } from "lucide-react";
import { useState, type DragEvent, type ReactNode } from "react";
import { Controller, type FieldValues, type Path, type PathValue, type UseFormReturn } from "react-hook-form";

import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { bytes } from "@/lib/format";
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

/** Password with show/hide and a three-step strength hint. */
export function PasswordField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  strength,
  ...input
}: FieldProps<T> & { strength?: boolean } & Omit<React.ComponentProps<"input">, "form" | "name" | "type">) {
  const [shown, setShown] = useState(false);
  const error = errorOf(form, name);
  const id = idOf(name);
  const value = String(form.watch(name) ?? "");
  const score = [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d|[^\w]/.test(value)].filter(Boolean).length;
  const words = ["Too short", "Weak", "Fair", "Strong"];
  return (
    <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={!!error}
          className={cn(control, "pr-12")}
          {...input}
          {...form.register(name)}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-colors"
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {strength && value && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= score ? (score === 3 ? "bg-success" : score === 2 ? "bg-warning" : "bg-danger") : "bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground w-16 text-right text-[12px]">{words[score]}</span>
        </div>
      )}
    </Shell>
  );
}

/** Indian mobile: fixed +91, digits only, shown as "98765 43210", stored as 10 digits. */
export function PhoneField<T extends FieldValues>({ form, name, label, description, optional, className }: FieldProps<T>) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const digits = String(field.value ?? "");
        const shown = digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
        return (
          <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
            <div className="border-input bg-card focus-within:ring-ring/50 focus-within:border-ring flex h-10 items-center rounded-full border transition-colors focus-within:ring-3 aria-invalid:border-destructive" aria-invalid={!!error}>
              <span className="text-muted-foreground border-r pr-3 pl-4 text-[14px] tabular-nums">+91</span>
              <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                aria-invalid={!!error}
                value={shown}
                onBlur={field.onBlur}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="placeholder:text-muted-foreground/60 h-full min-w-0 flex-1 bg-transparent px-3 text-[16px] tabular-nums outline-none md:text-[14px]"
              />
            </div>
          </Shell>
        );
      }}
    />
  );
}

/** Fixed-format codes (PAN, IFSC): uppercase as you type, letter-spaced, length-capped. */
export function CodeField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  length,
  placeholder,
}: FieldProps<T> & { length: number; placeholder?: string }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Shell
          id={id}
          label={label}
          optional={optional}
          description={description}
          error={error}
          className={className}
          aside={
            <span className="text-muted-foreground text-[12px] tabular-nums">
              {String(field.value ?? "").length}/{length}
            </span>
          }
        >
          <Input
            id={id}
            aria-invalid={!!error}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            className={cn(control, "font-medium tracking-[0.18em] uppercase placeholder:tracking-[0.18em]")}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, length))}
          />
        </Shell>
      )}
    />
  );
}

/** Rupees with live Indian grouping (₹25,00,000) and the amount in words underneath. */
export function CurrencyField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  placeholder,
}: FieldProps<T> & { placeholder?: string }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw: unknown = field.value;
        const n = typeof raw === "number" ? raw : undefined;
        return (
          <Shell
            id={id}
            label={label}
            optional={optional}
            error={error}
            className={className}
            description={n ? <span className="tabular-nums">{inWords(n)}</span> : description}
          >
            <div className="relative">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[14px]">₹</span>
              <Input
                id={id}
                inputMode="numeric"
                aria-invalid={!!error}
                placeholder={placeholder}
                className={cn(control, "pl-8 tabular-nums")}
                value={n == null ? "" : n.toLocaleString("en-IN")}
                onBlur={field.onBlur}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  field.onChange(digits ? Number(digits) : undefined);
                }}
              />
            </div>
          </Shell>
        );
      }}
    />
  );
}

function inWords(n: number) {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} crore`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} lakh`;
  if (n >= 1e3) return `₹${+(n / 1e3).toFixed(1)} thousand`;
  return `₹${n}`;
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

/** Type to filter a long list (employers, branches, cities). */
export function ComboboxField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  options,
  placeholder = "Type to search",
}: FieldProps<T> & { options: readonly string[]; placeholder?: string }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
          <Combobox items={options} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)}>
            <ComboboxInput id={id} placeholder={placeholder} aria-invalid={!!error} className="w-full" showClear />
            <ComboboxContent>
              <ComboboxEmpty>No match. Check the spelling.</ComboboxEmpty>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
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

/** Several of a few, all visible: toggle pills with a tick. Stores a string[]. */
export function MultiChoiceField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  options,
}: FieldProps<T> & { options: readonly Option[] }) {
  const error = errorOf(form, name);
  const value: string[] = form.watch(name) ?? [];
  const id = idOf(name);
  const toggle = (v: string) =>
    form.setValue(name, (value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) as PathValue<T, Path<T>>, {
      shouldValidate: true,
      shouldDirty: true,
    });
  return (
    <Shell
      id={id}
      label={label}
      optional={optional}
      description={description}
      error={error}
      className={className}
      asLegend
      aside={<span className="text-muted-foreground text-[12px] tabular-nums">{value.length} selected</span>}
    >
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors duration-150 outline-none focus-visible:ring-2",
                on ? "bg-foreground text-background border-foreground" : "bg-card hover:bg-muted border-input",
              )}
            >
              {on && <Check className="size-3.5" strokeWidth={2.5} />}
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

/** A setting that takes effect immediately in spirit: a row with a switch. */
export function SwitchField<T extends FieldValues>({ form, name, label, description, className }: Omit<FieldProps<T>, "optional">) {
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <label
          htmlFor={id}
          className={cn("bg-card border-input flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3", className)}
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-medium">{label}</span>
            {description && <span className="text-muted-foreground block text-[12px] leading-[18px]">{description}</span>}
          </span>
          <Switch id={id} checked={!!field.value} onCheckedChange={field.onChange} />
        </label>
      )}
    />
  );
}

/** A number in a known range where the feel matters more than the exact digit (tenure, years). */
export function SliderField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  min,
  max,
  step = 1,
  formatValue = String,
}: Omit<FieldProps<T>, "optional"> & { min: number; max: number; step?: number; formatValue?: (n: number) => string }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw: unknown = field.value;
        const v = typeof raw === "number" ? raw : min;
        return (
          <Shell
            id={id}
            label={label}
            description={description}
            error={error}
            className={className}
            asLegend
            aside={<span className="text-[14px] font-medium tabular-nums">{formatValue(v)}</span>}
          >
            <div className="pt-1.5">
              <Slider
                aria-labelledby={id}
                min={min}
                max={max}
                step={step}
                value={v}
                onValueChange={(n) => field.onChange(Array.isArray(n) ? n[0] : n)}
              />
              <div className="text-muted-foreground mt-2 flex justify-between text-[12px] tabular-nums">
                <span>{formatValue(min)}</span>
                <span>{formatValue(max)}</span>
              </div>
            </div>
          </Shell>
        );
      }}
    />
  );
}

/** Calendar in a popover. `birthDate` switches to month/year dropdowns for far-back dates. */
export function DateField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  birthDate,
  disabled,
}: FieldProps<T> & { birthDate?: boolean; disabled?: (d: Date) => boolean }) {
  const [open, setOpen] = useState(false);
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw: unknown = field.value;
        const value = raw instanceof Date ? raw : undefined;
        return (
          <Shell id={id} label={label} optional={optional} description={description} error={error} className={className}>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger
                id={id}
                aria-invalid={!!error}
                className={cn(
                  "border-input bg-card focus-visible:ring-ring/50 focus-visible:border-ring flex h-10 w-full items-center gap-2.5 rounded-full border px-4 text-left text-[14px] transition-colors outline-none focus-visible:ring-3 aria-invalid:border-destructive",
                  !value && "text-muted-foreground/70",
                )}
              >
                <CalendarDays className="text-muted-foreground size-4" strokeWidth={1.75} />
                <span className="flex-1 tabular-nums">{value ? format(value, "d MMM yyyy") : "Pick a date"}</span>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  mode="single"
                  selected={value}
                  defaultMonth={value ?? (birthDate ? new Date(1990, 0) : undefined)}
                  captionLayout={birthDate ? "dropdown" : "label"}
                  startMonth={birthDate ? new Date(1940, 0) : undefined}
                  // Only evaluated once opened (in the browser), never while prerendering.
                  endMonth={birthDate && open ? new Date() : undefined}
                  disabled={disabled}
                  onSelect={(d) => {
                    field.onChange(d);
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Shell>
        );
      }}
    />
  );
}

/** Drop or choose files; listed with size and a remove button. Stores File[]. */
export function FileField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  className,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxFiles = 5,
}: FieldProps<T> & { accept?: string; maxFiles?: number }) {
  const [dragging, setDragging] = useState(false);
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => {
        const files: File[] = field.value ?? [];
        const add = (list: FileList | null) => {
          if (!list) return;
          field.onChange([...files, ...Array.from(list)].slice(0, maxFiles));
        };
        const onDrop = (e: DragEvent) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        };
        return (
          <Shell
            id={id}
            label={label}
            optional={optional}
            description={description}
            error={error}
            className={className}
            aside={<span className="text-muted-foreground text-[12px] tabular-nums">{files.length}/{maxFiles}</span>}
          >
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "focus-within:ring-ring/50 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-4 transition-colors focus-within:ring-3",
                dragging ? "border-foreground bg-muted" : "border-input bg-card hover:bg-muted/50",
                error && "border-destructive",
              )}
            >
              <input id={id} type="file" multiple accept={accept} className="sr-only" onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
              <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-full">
                <Upload className="size-4" strokeWidth={1.75} />
              </span>
              <span className="text-[13px]">
                <span className="font-medium">Drop files</span> <span className="text-muted-foreground">or click to choose</span>
                <span className="text-muted-foreground block text-[12px]">{accept.replaceAll(",", " ").toUpperCase()}</span>
              </span>
            </label>
            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="bg-muted flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13px]">
                    <FileText className="text-muted-foreground size-4 shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-muted-foreground tabular-nums">{bytes(f.size)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => field.onChange(files.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-foreground grid size-6 place-items-center rounded-full transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Shell>
        );
      }}
    />
  );
}

/** One-time code: six boxes, digits only, paste-friendly. */
export function OtpField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  length = 6,
}: Omit<FieldProps<T>, "optional"> & { length?: number }) {
  const error = errorOf(form, name);
  const id = idOf(name);
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Shell id={id} label={label} description={description} error={error} className={className}>
          <InputOTP
            id={id}
            maxLength={length}
            pattern="^[0-9]*$"
            inputMode="numeric"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!error}
          >
            <InputOTPGroup>
              {Array.from({ length }).map((_, i) => (
                <InputOTPSlot key={i} index={i} aria-invalid={!!error} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Shell>
      )}
    />
  );
}
