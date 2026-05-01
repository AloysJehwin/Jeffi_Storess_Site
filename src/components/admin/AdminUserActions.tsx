'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_SCOPES } from '@/lib/scopes'

interface AdminUser {
  id: string
  username: string
  role: string
  scopes: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  certificate_status?: string
  cert_expires_at?: string
}

export default function AdminUserActions({
  admin,
  currentAdminId,
  onUpdate,
}: {
  admin: AdminUser
  currentAdminId: string
  onUpdate?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scopes, setScopes] = useState<string[]>(admin.scopes || [])
  const [role, setRole] = useState(admin.role)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isSelf = admin.id === currentAdminId
  const isSuperAdmin = admin.role === 'super_admin'

  function openEdit() {
    setScopes(admin.scopes || [])
    setRole(admin.role)
    setError(null)
    setEditing(true)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopes, role }),
      })
      if (res.ok) {
        setEditing(false)
        onUpdate ? onUpdate() : router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive() {
    if (!confirm(`${admin.is_active ? 'Deactivate' : 'Activate'} ${admin.username}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !admin.is_active }),
      })
      if (res.ok) onUpdate ? onUpdate() : router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${admin.username}? This will revoke their certificates and permanently remove their account.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'DELETE',
      })
      if (res.ok) onUpdate ? onUpdate() : router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {!isSuperAdmin && !isSelf && (
          <>
            <button
              type="button"
              onClick={openEdit}
              className="text-accent-500 hover:text-accent-600 text-xs font-medium"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={loading}
              className={`text-xs font-medium ${
                admin.is_active
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-green-500 hover:text-green-600'
              }`}
            >
              {admin.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 text-xs font-medium"
            >
              Delete
            </button>
          </>
        )}
        {isSelf && <span className="text-xs text-foreground-muted">Current session</span>}
        {isSuperAdmin && !isSelf && <span className="text-xs text-foreground-muted">Super Admin</span>}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={e => { if (e.target === e.currentTarget) setEditing(false) }}
        >
          <div className="bg-surface-elevated rounded-xl shadow-2xl border border-border-default w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
              <h3 className="font-semibold text-foreground">Edit {admin.username}</h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full border border-border-secondary rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
                  disabled={isSuperAdmin}
                  aria-label="Role"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-secondary mb-1.5">Scopes</label>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_SCOPES.map(scope => {
                    const active = scopes.includes(scope.key)
                    return (
                      <button
                        key={scope.key}
                        type="button"
                        onClick={() =>
                          setScopes(prev =>
                            prev.includes(scope.key)
                              ? prev.filter(s => s !== scope.key)
                              : [...prev, scope.key]
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          active
                            ? 'border-accent-500 bg-accent-500 text-white'
                            : 'border-border-default text-foreground-secondary hover:border-accent-400'
                        }`}
                      >
                        {scope.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-default">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm text-foreground-secondary bg-surface-secondary hover:bg-border-default"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 hover:bg-accent-600 text-white disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
