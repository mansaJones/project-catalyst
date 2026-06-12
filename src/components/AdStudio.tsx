import { useEffect, useState } from 'react'
import type { CreativeBrief } from '../types'
import { AD_FORMATS, AD_DIMENSIONS, buildAdCopy, type AdCopy, type AdFormatId } from '../adFormats'
import { LLM_ENABLED, expandCopy, designAd, type CopyFields } from '../ads/adClient'

type Source = 'template' | 'copy' | 'design'

interface Props {
  hookText: string
  brief: CreativeBrief
  image: string | null
  onClose: () => void
}

const SOURCES: { id: Source; label: string; llm: boolean }[] = [
  { id: 'template', label: 'Template', llm: false },
  { id: 'copy', label: 'Claude copy', llm: true },
  { id: 'design', label: 'AI design', llm: true },
]

// tallest format drives the stage height so the panel doesn't jump between formats
const STAGE_HEIGHT = Math.max(...Object.values(AD_DIMENSIONS).map((d) => d.h)) + 56

export function AdStudio({ hookText, brief, image, onClose }: Props) {
  const [format, setFormat] = useState<AdFormatId>('google')
  const [source, setSource] = useState<Source>('template')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [regen, setRegen] = useState(0)

  // cache generated results per "source|format" so revisiting a tab is instant
  const [copyByKey, setCopyByKey] = useState<Record<string, CopyFields>>({})
  const [designByKey, setDesignByKey] = useState<Record<string, string>>({})

  const key = `${source}|${format}`

  useEffect(() => {
    if (source === 'template' || !LLM_ENABLED) return
    const cached = source === 'copy' ? key in copyByKey : key in designByKey
    if (cached) return // already generated → show cached, no new call
    let cancelled = false
    async function run() {
      setBusy(true)
      setErr(null)
      try {
        if (source === 'copy') {
          const c = await expandCopy(hookText, brief, format)
          if (!cancelled) setCopyByKey((m) => ({ ...m, [key]: c }))
        } else {
          const h = await designAd(hookText, brief, format)
          if (!cancelled) setDesignByKey((m) => ({ ...m, [key]: h }))
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Generation failed.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [source, format, hookText, brief, key, regen, copyByKey, designByKey])

  const regenerate = () => {
    if (source === 'copy') setCopyByKey((m) => { const n = { ...m }; delete n[key]; return n })
    else if (source === 'design') setDesignByKey((m) => { const n = { ...m }; delete n[key]; return n })
    setRegen((n) => n + 1)
  }

  const base = buildAdCopy(hookText, brief)
  const cachedCopy = copyByKey[key]
  const cachedDesign = designByKey[key]
  const ad: AdCopy = source === 'copy' && cachedCopy ? { ...base, ...cachedCopy } : base
  const dims = AD_DIMENSIONS[format]

  let stage: React.ReactNode
  if (source !== 'template' && busy) {
    stage = <span className="self-center text-sm text-[var(--color-muted)]">Generating with Claude…</span>
  } else if (source !== 'template' && err) {
    stage = <span className="self-center text-sm" style={{ color: 'var(--color-orange-deep)' }}>{err}</span>
  } else if (source === 'design') {
    stage = cachedDesign ? (
      <iframe title="AI-designed ad" sandbox="" srcDoc={cachedDesign}
        width={dims.w} height={dims.h} style={{ border: '1px solid #ccc', background: '#fff' }} />
    ) : (
      <span className="self-center text-sm text-[var(--color-muted)]">Generating with Claude…</span>
    )
  } else {
    stage = (
      <>
        {format === 'google' && <GoogleSearchAd ad={ad} />}
        {format === 'meta' && <MetaFeedPost ad={ad} image={image} />}
        {format === 'banner' && <DisplayBanner ad={ad} />}
      </>
    )
  }

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">03 · Ad Studio</p>
          <h2 className="panel-title mt-1">Bespoke Ad</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close ad studio"
          className="px-2 py-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-orange-deep)]"
          style={{ border: '1px solid var(--color-light)' }}>✕</button>
      </div>

      <p className="mt-2 text-sm text-[var(--color-text)]">
        From hook: <span className="text-[var(--color-ink)]">“{hookText || 'empty'}”</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {AD_FORMATS.map((f) => (
          <Chip key={f.id} on={f.id === format} onClick={() => setFormat(f.id)}>{f.label}</Chip>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {SOURCES.map((s) => {
          const disabled = s.llm && !LLM_ENABLED
          return (
            <Chip key={s.id} on={s.id === source} disabled={disabled}
              title={disabled ? 'Enable the Claude backend (VITE_USE_LLM=true) to use this' : undefined}
              onClick={() => !disabled && setSource(s.id)}>{s.label}</Chip>
          )
        })}
        {!LLM_ENABLED && (
          <span className="text-[11px] text-[var(--color-muted)]">Claude modes need the backend running</span>
        )}
        {source !== 'template' && LLM_ENABLED && (
          <button type="button" onClick={regenerate} disabled={busy}
            className="ml-auto px-3 py-1 text-xs"
            style={{
              fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
              border: '1px solid var(--color-orange-btn)', background: 'var(--color-white)',
              color: 'var(--color-orange-btn)', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
            }}>↻ Regenerate</button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center"
        style={{ background: '#e9e9e9', padding: '28px 16px', border: '1px solid var(--color-light)', minHeight: STAGE_HEIGHT }}>
        {stage}
      </div>

      <p className="mt-3 text-[11px] text-[var(--color-muted)]">
        {source === 'template' && 'Copy is auto-generated from the hook (deterministic — works offline).'}
        {source === 'copy' && 'Templates filled with Claude-written, format-fit copy. Cached per format — use Regenerate to refresh.'}
        {source === 'design' && 'A bespoke layout generated by Claude, rendered in a sandboxed frame (scripts disabled). Use Regenerate for a new take.'}
      </p>
    </section>
  )
}

function Chip({ on, disabled, title, onClick, children }: { on: boolean; disabled?: boolean; title?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className="px-3 py-1 text-xs"
      style={{
        fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
        border: '1px solid ' + (on ? 'var(--color-orange-btn)' : 'var(--color-light)'),
        background: on ? 'var(--color-orange-btn)' : 'var(--color-white)',
        color: on ? 'var(--color-white)' : disabled ? '#cbcbcb' : 'var(--color-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}>{children}</button>
  )
}

const initial = (s: string) => (s.trim().charAt(0) || 'A').toUpperCase()

function GoogleSearchAd({ ad }: { ad: AdCopy }) {
  return (
    <div style={{ width: '100%', maxWidth: 600, background: '#fff', border: '1px solid #dadce0', borderRadius: 8, padding: 14, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111', color: '#CF4500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{initial(ad.brand)}</div>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontSize: 14, color: '#202124' }}>{ad.brand}</div>
          <div style={{ fontSize: 12, color: '#5f6368' }}>Sponsored · {ad.domain}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 20, lineHeight: 1.3, color: '#1a0dab' }}>{ad.headline}</div>
      <div style={{ marginTop: 2, fontSize: 14, lineHeight: 1.4, color: '#4d5156' }}>{ad.description}</div>
    </div>
  )
}

function MetaFeedPost({ ad, image }: { ad: AdCopy; image: string | null }) {
  return (
    <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, overflow: 'hidden', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#CF4500', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{initial(ad.brand)}</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{ad.brand.toLowerCase().replace(/\s+/g, '')}</div>
          <div style={{ fontSize: 12, color: '#8e8e8e' }}>Sponsored</div>
        </div>
      </div>
      <div style={{ padding: '0 12px 10px', fontSize: 14, lineHeight: 1.4, color: '#262626' }}>{ad.primaryText}</div>
      {image ? (
        <img src={image} alt="Ad creative" style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '1 / 1', background: 'linear-gradient(135deg, #111 0%, #CF4500 140%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 3, fontSize: 24 }}>{ad.brand}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#efefef', padding: '10px 12px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8e8e8e', textTransform: 'uppercase', letterSpacing: 0.4 }}>{ad.domain}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.headline}</div>
        </div>
        <span style={{ flex: '0 0 auto', fontSize: 13, fontWeight: 600, color: '#262626', background: '#dfe1e5', borderRadius: 6, padding: '8px 12px' }}>{ad.cta}</span>
      </div>
    </div>
  )
}

function DisplayBanner({ ad }: { ad: AdCopy }) {
  return (
    <div style={{ position: 'relative', width: 336, height: 280, background: '#111', border: '1px solid #ccc', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20 }}>
      <div style={{ position: 'absolute', right: -44, top: -44, width: 150, height: 150, background: '#CF4500', opacity: 0.18, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: '#CF4500', fontWeight: 600 }}>{ad.brand}</div>
        <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', fontWeight: 700, fontSize: 26, lineHeight: 1.05, color: '#fff', marginTop: 10 }}>{ad.headline}</div>
      </div>
      <button type="button" style={{ position: 'relative', alignSelf: 'flex-start', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, fontWeight: 500, color: '#fff', background: '#C03C00', border: '1px solid #fff', padding: '10px 20px', cursor: 'default' }}>{ad.cta}</button>
    </div>
  )
}
