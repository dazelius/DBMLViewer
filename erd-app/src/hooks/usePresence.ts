import { useState, useEffect, useRef } from 'react';

/**
 * /api/presence SSE 를 구독해 현재 접속자 수를 반환합니다.
 * 첫 연결 성공 후 끊기면 지수 백오프(1s→2s→4s→…최대 30s)로 재연결합니다.
 * 한 번도 연결된 적 없이 에러가 나면 엔드포인트 미지원으로 간주하고 포기합니다.
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(1000);
  const esRef = useRef<EventSource | null>(null);
  const unmountedRef = useRef(false);
  const everConnectedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      try {
        const es = new EventSource('/api/presence');
        esRef.current = es;

        es.onopen = () => {
          everConnectedRef.current = true;
          delayRef.current = 1000;
        };

        es.onmessage = (e) => {
          const n = parseInt(e.data, 10);
          if (!isNaN(n)) setCount(n);
        };

        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (unmountedRef.current) return;
          if (!everConnectedRef.current) return;
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
