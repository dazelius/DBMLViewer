import { useState, useEffect, useRef } from 'react';

/**
 * /api/presence SSE 를 구독해 현재 접속자 수를 반환합니다.
 * 연결이 끊기면 지수 백오프(1s→2s→4s→…최대 30s)로 자동 재연결합니다.
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(1000); // 재연결 초기 딜레이 1s
  const esRef = useRef<EventSource | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;
      try {
        const es = new EventSource('/api/presence');
        esRef.current = es;

        es.onopen = () => {
          delayRef.current = 1000; // 연결 성공 시 딜레이 리셋
        };

        es.onmessage = (e) => {
          const n = parseInt(e.data, 10);
          if (!isNaN(n)) setCount(n);
        };

        es.onerror = () => {
          es.close();
          esRef.current = null;
          if (unmountedRef.current) return;
          // 지수 백오프 재연결 (최대 30초)
          const delay = Math.min(delayRef.current, 30000);
          delayRef.current = Math.min(delay * 2, 30000);
          retryRef.current = setTimeout(connect, delay);
        };
      } catch {
        // EventSource 자체가 없는 환경이면 무시
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
