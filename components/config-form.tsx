"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { IllustrativeBadge } from "@/components/data-badge"
import { materialsByCategory } from "@/lib/materials"
import { CLIMATE_DEFAULTS, CLIMATES, FIELD_RULES, validateForm, type FormErrors } from "@/lib/scenarios"
import type { Climate, FormState, MaterialCategory } from "@/lib/types"

type Props = {
  form: FormState
  onChange: (patch: Partial<FormState>) => void
  onSubmit: () => void
  busy: boolean
}

type NumericKey = keyof FormErrors

export function ConfigForm({ form, onChange, onSubmit, busy }: Props) {
  const errors = validateForm(form)
  const errorKeys = Object.keys(errors) as NumericKey[]
  const hasErrors = errorKeys.length > 0

  const handleClimate = (climate: Climate) => {
    const defaults = CLIMATE_DEFAULTS[climate]
    onChange({
      climate,
      outdoorTempC: String(defaults.outdoorTempC),
      targetIndoorTempC: String(defaults.targetIndoorTempC),
    })
  }

  const numberField = (key: NumericKey, step = "any") => (
    <NumberField
      id={key}
      label={FIELD_RULES[key].label}
      unit={FIELD_RULES[key].unit}
      value={form[key]}
      error={errors[key]}
      step={step}
      onChange={(value) => onChange({ [key]: value })}
    />
  )

  return (
    <form
      noValidate
      aria-label="Shelter configuration"
      onSubmit={(e) => {
        e.preventDefault()
        if (!hasErrors && !busy) onSubmit()
      }}
      className="flex flex-col gap-6"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/65">Climate</legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="climate">Climate</Label>
          <Select
            items={CLIMATES.map((c) => ({ value: c, label: CLIMATE_DEFAULTS[c].label }))}
            value={form.climate}
            onValueChange={(value) => value && handleClimate(value as Climate)}
          >
            <SelectTrigger id="climate" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIMATES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CLIMATE_DEFAULTS[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {numberField("outdoorTempC")}
        {numberField("targetIndoorTempC")}
        <p className="flex flex-wrap items-center gap-2 text-xs text-white/65 sm:col-span-2 lg:col-span-3">
          <IllustrativeBadge />
          Illustrative design-day temperature, not live weather.
        </p>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/65">Size and use</legend>
        {numberField("lengthM")}
        {numberField("widthM")}
        {numberField("heightM")}
        {numberField("occupants", "1")}
        {numberField("openingAreaM2")}
        {numberField("budgetINR", "1000")}
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/65">Materials</legend>
        <MaterialSelect
          id="wallMaterialId"
          label="Wall material"
          category="wall"
          value={form.wallMaterialId}
          onChange={(v) => onChange({ wallMaterialId: v })}
        />
        <MaterialSelect
          id="roofMaterialId"
          label="Roof material"
          category="roof"
          value={form.roofMaterialId}
          onChange={(v) => onChange({ roofMaterialId: v })}
        />
        <MaterialSelect
          id="insulationMaterialId"
          label="Insulation material"
          category="insulation"
          value={form.insulationMaterialId}
          onChange={(v) => onChange({ insulationMaterialId: v })}
        />
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between">
            <Label id="insulation-thickness-label">Insulation thickness</Label>
            <output htmlFor="insulation-thickness" className="text-sm font-medium tabular-nums text-white/95">
              {form.insulationThicknessMm} mm
            </output>
          </div>
          <Slider
            id="insulation-thickness"
            thumbLabel="Insulation thickness in millimetres"
            min={0}
            max={200}
            step={5}
            value={[form.insulationThicknessMm]}
            onValueChange={(v) => onChange({ insulationThicknessMm: Array.isArray(v) ? v[0] : (v as number) })}
            className="py-3"
          />
          <div className="flex justify-between text-xs text-white/65" aria-hidden="true">
            <span>0 mm</span>
            <span>200 mm</span>
          </div>
        </div>
      </fieldset>

      {hasErrors && (
        <Alert variant="destructive" className="border-red-400/40 bg-red-500/10">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Please fix these fields to compare designs</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errorKeys.map((key) => (
                <li key={key}>
                  <a href={`#${key}`} className="underline underline-offset-2">
                    {FIELD_RULES[key].label}
                  </a>
                  : {errors[key]}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <button
        type="submit"
        disabled={hasErrors || busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-8 text-base font-semibold text-white shadow-[0_8px_30px_-8px_rgba(124,92,255,0.7)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-auto md:self-end"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {busy ? "Comparing…" : "Compare Designs"}
      </button>
    </form>
  )
}

function NumberField({
  id,
  label,
  unit,
  value,
  error,
  step,
  onChange,
}: {
  id: string
  label: string
  unit: string
  value: string
  error?: string
  step: string
  onChange: (value: string) => void
}) {
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label} <span className="text-white/65">({unit})</span>
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11"
      />
      {error && (
        <p id={errorId} className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

function MaterialSelect({
  id,
  label,
  category,
  value,
  onChange,
}: {
  id: string
  label: string
  category: MaterialCategory
  value: string
  onChange: (value: string) => void
}) {
  const options = materialsByCategory(category)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        items={options.map((m) => ({ value: m.id, label: m.name }))}
        value={value}
        onValueChange={(v) => v && onChange(v as string)}
      >
        <SelectTrigger id={id} className="h-11 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
