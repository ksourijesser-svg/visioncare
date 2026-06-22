'use client'

import dynamic from 'next/dynamic'

const EyeScene = dynamic(() => import('./EyeScene'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '500vh',
        background: 'linear-gradient(150deg, #0a1e2d 0%, #133045 45%, #0d1f2e 100%)',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 60,
              height: 60,
              border: '3px solid rgba(112,177,196,0.3)',
              borderTopColor: '#70B1C4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Chargement…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  ),
})

export default function EyeSceneClient() {
  return <EyeScene />
}
