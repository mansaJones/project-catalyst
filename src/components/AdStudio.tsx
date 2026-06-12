import { useState } from 'react'
import type { CreativeBrief } from '../types'
import { AD_FORMATS, buildAdCopy, type AdCopy, type AdFormatId } from '../adFormats'

interface Props {
  hookText: string
  brief: CreativeBrief
  image: string | null
  onClose: () => void
}

export function AdStudio({ hookText, brief, image, onClose }: Props) {
  const [format, setFormat] = useState<AdFormatId>('google')
  const ad = buildAdCopy(hookText, brief)

  return (
    <section className="panel p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">03 · Ad Studio</p>
          <h2 className="panel-title mt-1">Bespoke Ad</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ad studio"
          className="px-2 py-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-orange-deep)]"
          style={{ border: '1px solid var(--color-light)' }}
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-sm text-[var(--color-text)]">
        From hook: <span className="text-[var(--color-ink)]">“{hookText || 'empty'}”</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {AD_FORMATS.map((f) => {
          const on = f.id === format
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className="px-3 py-1 text-xs"
              style={{
                fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '1px',
                border: '1px solid ' + (on ? 'var(--color-orange-btn)' : 'var(--color-light)'),
                background: on ? 'var(--color-orange-btn)' : 'var(--color-white)',
                color: on ? 'var(--color-white)' : 'var(--color-muted)',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div
        className="mt-4 flex justify-center"
        style={{ background: '#e9e9e9', padding: '28px 16px', border: '1px solid var(--color-light)' }}
      >
        {format === 'google' && <GoogleSearchAd ad={ad} />}
        {format === 'meta' && <MetaFeedPost ad={ad} image={image} />}
        {format === 'banner' && <DisplayBanner ad={ad} />}
      </div>

      <p className="mt-3 text-[11px] text-[var(--color-muted)]">
        Copy is auto-generated from the hook (deterministic). Enable the Claude backend to expand it
        into richer, format-fit copy.
      </p>
    </section>
  )
}

const initial = (s: string) => (s.trim().charAt(0) || 'A').toUpperCase()

function GoogleSearchAd({ ad }: { ad: AdCopy }) {
  return (
    <div style={{ width: '100%', maxWidth: 560, background: '#fff', border: '1px solid #dadce0', borderRadius: 8, padding: 14, fontFamily: 'Arial, sans-serif' }}>
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
    <div style={{ width: '100%', maxWidth: 380, background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, overflow: 'hidden', fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#CF4500', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{initial(ad.brand)}</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{ad.brand.toLowerCase().replace(/\s+/g, '')}</div>
          <div style={{ fontSize: 12, color: '#8e8e8e' }}>Sponsored</div>
        </div>
      </div>
      <div style={{ padding: '0 12px 10px', fontSize: 14, lineHeight: 1.4, color: '#262626' }}>{ad.primaryText}</div>
      {image ? (
        <img src={image} alt="Ad creative" style={{ display: 'block', width: '100%', aspectRatio: '1.91 / 1', objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '1.91 / 1', background: 'linear-gradient(135deg, #111 0%, #CF4500 140%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 3, fontSize: 22 }}>{ad.brand}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#efefef', padding: '10px 12px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8e8e8e', textTransform: 'uppercase', letterSpacing: 0.4 }}>{ad.domain}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.headline}</div>
        </div>
        <button type="button" style={{ flex: '0 0 auto', fontSize: 13, fontWeight: 600, color: '#262626', background: '#dfe1e5', border: 'none', borderRadius: 6, padding: '8px 12px', cursor: 'default' }}>{ad.cta}</button>
      </div>
    </div>
  )
}

function DisplayBanner({ ad }: { ad: AdCopy }) {
  return (
    <div style={{ position: 'relative', width: 300, height: 250, background: '#111', border: '1px solid #ccc', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 18 }}>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, background: '#CF4500', opacity: 0.18, transform: 'rotate(45deg)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, color: '#CF4500', fontWeight: 600 }}>{ad.brand}</div>
        <div style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', fontWeight: 700, fontSize: 24, lineHeight: 1.05, color: '#fff', marginTop: 8 }}>{ad.headline}</div>
      </div>
      <button type="button" style={{ position: 'relative', alignSelf: 'flex-start', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12, fontWeight: 500, color: '#fff', background: '#C03C00', border: '1px solid #fff', padding: '9px 18px', cursor: 'default' }}>{ad.cta}</button>
    </div>
  )
}
