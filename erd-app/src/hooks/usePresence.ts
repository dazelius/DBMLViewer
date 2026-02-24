import { useState, useEffect } from 'react';

/**
 * /api/presence SSE 를 구독해 현재 접속자 수를 반환합니다.
 * 서버가 SSE를 지원하지 않으면 null 을 반환합니다.
 */
export function usePresence(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let es: EventSource;
    try {
      es = new EventSource('/api/presence');
      es.onmessage = (e) => {
        const n = parseInt(e.data, 10);
        if (!isNaN(n)) setCount(n);
      };
      es.onerror = () => {
        // SSE 미지원 환경(순수 static 서버 등)이면 조용히 무시
        es.close();
      };
    } catch {
      // EventSource 자체가 없는 환경이면 무시
    }
    return () => { es?.close(); };
  }, []);

  return count;
}
