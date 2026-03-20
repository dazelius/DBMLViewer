import { useState, useEffect, useRef } from 'react';

/**
 * /api/presence SSE 를 구독해 현재 접속자 수를 반환합니다.
 * 연결이 끊기면 지수 백오프(1s→2s→4s→…최대 30s)로 자동 재연결합니다.
 * 엔드포인트가 없으면(404) 재연결을 포기합니다.
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(1000);
  const esRef = useRef<EventSource | null>(null);
  const unmountedRef = useRef(false);
  const gaveUpRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    gaveUpRef.current = false;

    async function connect() {
      if (unmountedRef.current || gaveUpRef.current) return;

      try {
        const probe = await fetch('/api/presence', { method: 'HEAD' }).catch(() => null);
        if (!probe || probe.status === 404) {
          gaveUpRef.current = true;
          return;
        }
      } catch {
        // network error — retry later
      }

      if (unmountedRef.current || gaveUpRef.current) return;

      try {
        const es = new EventSource('/api/presence');
        esRef.current = es;

        es.onopen = () => { delayRef.current = 1000; };

        es.onmessage = (e) => {
          const n = parseInt(e.data, 10);
          if (!isNaN(n)) setCount(n);
        };

        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (unmountedRef.current || gaveUpRef.current) return;
          const delay = Math.min(delayRef.current, 30000);
          delayRef.current = Math.min(delay * 2, 30000);
          retryRef.current = setTimeout(connect, delay);
        };
      } catch {
        // EventSource not available
      }
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      esRef.current?.close();
    };
  }, []);

  return count;
}
