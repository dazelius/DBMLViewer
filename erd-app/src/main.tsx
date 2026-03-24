import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 프록시 환경 지원: /api/* 절대경로를 올바른 base path 기준으로 변환
// window.location.pathname은 라우트 세그먼트를 포함할 수 있으므로 (예: /TableMaster/editor/)
// Vite가 빌드 시 주입하는 import.meta.env.BASE_URL을 사용
;(() => {
  const viteBase = import.meta.env.BASE_URL || './'
  // './' → 현재 페이지 기준 상대경로, '/path/' → 절대경로
  const basePath = viteBase === './' ? viteBase : viteBase.replace(/\/?$/, '/')

  const _fetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = basePath === './' ? '.' + input : basePath + input.slice(1)
    }
    return _fetch.call(this, input, init)
  }

  const _EventSource = window.EventSource
  window.EventSource = class extends _EventSource {
    constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        url = basePath === './' ? '.' + url : basePath + url.slice(1)
      }
      super(url, eventSourceInitDict)
    }
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
