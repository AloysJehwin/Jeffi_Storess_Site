'use client'

import { useEffect, useState, useCallback } from 'react'

interface Category {
  id: string
  name: string
  parent_category_id: string | null
}

interface PreviewVariant {
  id: string
  variant_name: string
  current: Record<string, number | null>
  projected: Record<string, number | null>
}

interface PreviewProduct {
  id: string
  name: string
  has_variants: boolean
  current: Record<string, number | null>
  projected: Record<string, number | null>
  variants: PreviewVariant[]
}

interface InflationLog {
  id: string
  category_name: string
  percentage: number
  applied_fields: string[]
  product_count: number
  applied_by: string
  applied_at: string
}

const FIELD_LABELS: Record<string, string> = {
  base_price: 'Selling Price',
  mrp: 'MRP',
  sale_price: 'Sale Price',
  wholesale_price: 'Wholesale Price',
  weight_rate: 'Weight Rate',
  length_rate: 'Length Rate',
}

const ALL_FIELDS = Object.keys(FIELD_LABELS)

function fmt(val: number | null): string {
  if (val == null) return '—'
  return `₹${val.toFixed(2)}`
}

export default function InflationClient({ categories }: { categories: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [percentage, setPercentage] = useState('')
  const [selectedFields, setSelectedFields] = useState<string[]>(['base_price', 'mrp'])
  const [preview, setPreview] = useState<PreviewProduct[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<string | null>(null)
  const [logs, setLogs] = useState<InflationLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const subCategories = categories.filter(c => c.parent_category_id)

  const fetchLogs = useCallback(() => {
    setLogsLoading(true)
    fetch('/api/admin/inflation/logs')
      .then(r => r.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function toggleField(f: string) {
    setSelectedFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
    setPreview(null)
  }

  async function handlePreview() {
    if (!selectedCategory || !percentage || selectedFields.length === 0) return
    setPreviewLoading(true)
    setPreviewError(null)
    setPreview(null)
    try {
      const params = new URLSearchParams({
        category_id: selectedCategory.id,
        percentage,
        fields: selectedFields.join(','),
      })
      const res = await fetch(`/api/admin/inflation?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load preview')
      setPreview(data.preview)
    } catch (e: any) {
      setPreviewError(e.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleApply() {
    if (!selectedCategory || !percentage || selectedFields.length === 0 || !preview) return
    setApplying(true)
    setApplyError(null)
    setApplySuccess(null)
    try {
      const res = await fetch('/api/admin/inflation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategory.id,
          category_name: selectedCategory.name,
          percentage: parseFloat(percentage),
          fields: selectedFields,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply inflation')
      setApplySuccess(`+${percentage}% applied to ${data.product_count} product${data.product_count !== 1 ? 's' : ''} in "${selectedCategory.name}".`)
      setPreview(null)
      setPercentage('')
      setSelectedCategory(null)
      fetchLogs()
    } catch (e: any) {
      setApplyError(e.message)
    } finally {
      setApplying(false)
    }
  }

  const pct = parseFloat(percentage)
  const canPreview = !!selectedCategory && !!percentage && pct > 0 && pct <= 100 && selectedFields.length > 0
  const canApply = canPreview && !!preview && preview.length > 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-500 dark:text-foreground">Price Inflation</h1>
        <p className="text-foreground-secondary mt-1">Bulk-increase product prices by percentage, targeted by sub-category</p>
      </div>

      {/* Apply panel */}
      <div className="bg-surface-elevated rounded-lg shadow-sm border border-border-default p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Apply Inflation</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Sub-category *</label>
            <select
              value={selectedCategory?.id || ''}
              onChange={e => {
                const cat = subCategories.find(c => c.id === e.target.value) || null
                setSelectedCategory(cat)
                setPreview(null)
              }}
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
            >
              <option value="">Select a sub-category…</option>
              {subCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1.5">Percentage increase (%) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={percentage}
              onChange={e => { setPercentage(e.target.value); setPreview(null) }}
              placeholder="e.g. 10 for +10%"
              className="w-full px-3 py-2 border border-border-secondary rounded-lg bg-surface text-foreground placeholder:text-foreground-muted focus:ring-2 focus:ring-accent-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground-secondary mb-2">Apply to price fields *</p>
          <div className="flex flex-wrap gap-2">
            {ALL_FIELDS.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => toggleField(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedFields.includes(f)
                    ? 'bg-accent-500 border-accent-500 text-white'
                    : 'bg-surface border-border-secondary text-foreground-secondary hover:border-accent-400'
                }`}
              >
                {FIELD_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview || previewLoading}
            className="px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewLoading ? 'Loading…' : 'Preview Changes'}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply || applying}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? 'Applying…' : `Apply to ${preview.length} product${preview.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {previewError && <p className="text-sm text-red-600 dark:text-red-400">{previewError}</p>}
        {applyError && <p className="text-sm text-red-600 dark:text-red-400">{applyError}</p>}
        {applySuccess && <p className="text-sm text-green-600 dark:text-green-400 font-medium">{applySuccess}</p>}
      </div>

      {/* Preview table */}
      {preview && preview.length > 0 && (
        <div className="bg-surface-elevated rounded-lg shadow-sm border border-border-default overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-border-default flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Preview — {selectedCategory?.name}</h2>
            <span className="text-xs text-foreground-muted bg-surface px-2.5 py-1 rounded-full border border-border-default">+{percentage}%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border-default">
                <tr>
                  <th className="text-left py-2.5 px-4 font-medium text-foreground-secondary">Product / Variant</th>
                  {selectedFields.map(f => (
                    <th key={f} className="text-right py-2.5 px-3 font-medium text-foreground-secondary whitespace-nowrap">{FIELD_LABELS[f]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {preview.map(p => (
                  <>
                    <tr key={p.id} className="bg-surface-elevated/50">
                      <td className="py-2.5 px-4 font-medium text-foreground">{p.name}</td>
                      {selectedFields.map(f => (
                        <td key={f} className="py-2.5 px-3 text-right">
                          {p.has_variants && p.variants.length > 0 ? (
                            <span className="text-foreground-muted text-xs">see variants</span>
                          ) : (
                            <>
                              <span className="text-foreground-muted line-through mr-1.5 text-xs">{fmt(p.current[f])}</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">{fmt(p.projected[f])}</span>
                            </>
                          )}
                        </td>
                      ))}
                    </tr>
                    {p.has_variants && p.variants.map(v => (
                      <tr key={v.id} className="bg-surface">
                        <td className="py-2 px-4 pl-8 text-foreground-secondary text-xs">{v.variant_name}</td>
                        {selectedFields.map(f => (
                          <td key={f} className="py-2 px-3 text-right text-xs">
                            <span className="text-foreground-muted line-through mr-1.5">{fmt(v.current[f])}</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">{fmt(v.projected[f])}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && preview.length === 0 && (
        <p className="text-sm text-foreground-muted bg-surface-elevated border border-border-default rounded-lg px-4 py-3">
          No active products found in this sub-category.
        </p>
      )}

      {/* History */}
      <div className="bg-surface-elevated rounded-lg shadow-sm border border-border-default overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border-default">
          <h2 className="text-base font-semibold text-foreground">Inflation History</h2>
        </div>
        {logsLoading ? (
          <p className="p-6 text-sm text-foreground-muted">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-foreground-muted">No inflation applied yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-border-default">
                <tr>
                  <th className="text-left py-2.5 px-4 font-medium text-foreground-secondary">Category</th>
                  <th className="text-right py-2.5 px-3 font-medium text-foreground-secondary">%</th>
                  <th className="text-left py-2.5 px-3 font-medium text-foreground-secondary">Fields</th>
                  <th className="text-right py-2.5 px-3 font-medium text-foreground-secondary">Products</th>
                  <th className="text-left py-2.5 px-3 font-medium text-foreground-secondary">Applied by</th>
                  <th className="text-left py-2.5 px-3 font-medium text-foreground-secondary">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface transition-colors">
                    <td className="py-2.5 px-4 font-medium text-foreground">{log.category_name}</td>
                    <td className="py-2.5 px-3 text-right text-accent-600 dark:text-accent-400 font-semibold">+{log.percentage}%</td>
                    <td className="py-2.5 px-3 text-foreground-secondary text-xs">{log.applied_fields.map(f => FIELD_LABELS[f] || f).join(', ')}</td>
                    <td className="py-2.5 px-3 text-right text-foreground">{log.product_count}</td>
                    <td className="py-2.5 px-3 text-foreground-secondary">{log.applied_by}</td>
                    <td className="py-2.5 px-3 text-foreground-muted text-xs whitespace-nowrap">
                      {new Date(log.applied_at).toLocaleDateString('en-IN')}{' '}
                      {new Date(log.applied_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
