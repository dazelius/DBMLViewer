import { useState, useEffect, useRef } from 'react';

/**
 * /api/presence SSE 를 구독해 현재 접속자 수를 반환합니다.
 * 최대 2회 재연결 시도 후 포기합니다 (프록시 환경에서 무한 504 방지).
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const unmountedRef = useRef(false);
  const failCountRef = useRef(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      try {
        const es = new EventSource('/api/presence');
        esRef.current = es;

        es.onopen = () => { failCountRef.current = 0; };

        es.onmessage = (e) => {
          const n = parseInt(e.data, 10);
          if (!isNaN(n)) setCount(n);
        };

        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (unmountedRef.current) return;
          failCountRef.current++;
          if (failCountRef.current > MAX_RETRIES) return;
          const delay = Math.min(1000 * 2 ** failCountRef.current, 30000);
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
