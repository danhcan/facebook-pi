import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Zap, Check, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { settingsApi } from '../services/api'

interface LLMSettings {
  provider: string
  baseUrl: string
  apiKey: string
  hasApiKey: boolean
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

export default function Settings() {
  const [settings, setSettings] = useState<LLMSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await settingsApi.getLLM()
      setSettings(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không tải được cấu hình')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    try {
      setSaving(true)
      setError(null)
      await settingsApi.updateLLM({
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey.includes('...') ? undefined : settings.apiKey,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        timeout: settings.timeout,
      })
      setSuccess('Đã lưu cấu hình thành công')
      setTimeout(() => setSuccess(null), 3000)
      loadSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu cấu hình thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      setError(null)
      const result = await settingsApi.testLLM()
      setTestResult(result)
    } catch (err: any) {
      setTestResult(err.response?.data || { success: false, error: err.message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-muted)' }} />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--color-muted)' }}>
        Không tải được cấu hình
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--color-accent-soft)' }}
        >
          <SettingsIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            Cấu hình
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Quản lý cấu hình LLM và hệ thống
          </p>
        </div>
      </div>

      {/* LLM Settings Card */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: 'var(--color-paper-2)',
          border: '1px solid var(--color-paper-4)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
              LLM Provider
            </h2>
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--color-accent-soft)',
              color: 'var(--color-accent)',
            }}
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Test Connection
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Provider
            </label>
            <input
              type="text"
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Model
            </label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* Base URL */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Base URL
            </label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          {/* API Key */}
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Nhập API key mới để thay đổi"
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm font-mono"
                style={{
                  background: 'var(--color-paper)',
                  border: '1px solid var(--color-paper-4)',
                  color: 'var(--color-ink)',
                }}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--color-muted)' }}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings({ ...settings, temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>
              Max Tokens
            </label>
            <input
              type="number"
              value={settings.maxTokens}
              onChange={(e) =>
                setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 500 })
              }
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-paper-4)',
                color: 'var(--color-ink)',
              }}
            />
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: testResult.success
                ? 'var(--color-success-soft)'
                : 'var(--color-danger-soft)',
            }}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-success)' }} />
            ) : (
              <X className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-danger)' }} />
            )}
            <div className="flex-1 text-sm">
              <div style={{ color: 'var(--color-ink)' }}>
                {testResult.success
                  ? `Kết nối thành công! (${testResult.latencyMs}ms)`
                  : 'Kết nối thất bại'}
              </div>
              {testResult.error && (
                <div className="text-xs mt-1 font-mono" style={{ color: 'var(--color-muted)' }}>
                  {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div
            className="rounded-lg p-3 text-sm flex items-center gap-2"
            style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}
          >
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div
            className="rounded-lg p-3 text-sm flex items-center gap-2"
            style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}
          >
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
            }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  )
}
