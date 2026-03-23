import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 프록시 환경 지원: /api/* 절대경로를 상대경로로 변환
// 플랫폼 리버스 프록시가 /api/v1/ai-tools/{id}/proxy/* 로 포워딩하므로
// 절대경로 /api/... 는 프록시를 타지 않아 404 발생
;(() => {
  const basePath = window.location.pathname.replace(/\/?$/, '/')

  const _fetch = window.fetch
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = basePath + input.slice(1)
    }
    return _fetch.call(this, input, init)
  }

  const _EventSource = window.EventSource
  window.EventSource = class extends _EventSource {
    constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
      if (typeof url === 'string' && url.startsWith('/api/')) {
        url = basePath + url.slice(1)
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
