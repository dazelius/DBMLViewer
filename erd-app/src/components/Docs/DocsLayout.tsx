import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import DocsSidebar from './DocsSidebar.tsx';
import DocsOverview from './DocsOverview.tsx';
import DocsTableDetail from './DocsTableDetail.tsx';
import DocsEnumDetail from './DocsEnumDetail.tsx';
import DocsSearch from './DocsSearch.tsx';

interface DocsLayoutProps {
  activeTableId: string | null;
  activeEnumName: string | null;
}

export default function DocsLayout({ activeTableId, activeEnumName }: DocsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const schema = useSchemaStore((s) => s.schema);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelectTable = useCallback((tableId: string) => {
    navigate(`/docs/${encodeURIComponent(tableId)}`);
  }, [navigate]);

  const handleSelectEnum = useCallback((enumName: string) => {
    navigate(`/docs/enum/${encodeURIComponent(enumName)}`);
  }, [navigate]);

  const handleOverview = useCallback(() => {
    navigate('/docs');
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isEnumPage = location.pathname.startsWith('/docs/enum/');

  const renderContent = () => {
    if (isEnumPage && activeEnumName) return <DocsEnumDetail enumName={decodeURIComponent(activeEnumName)} />;
    if (activeTableId) return <DocsTableDetail tableId={decodeURIComponent(activeTableId)} onNavigate={handleSelectTable} />;
    return <DocsOverview onSelectTable={handleSelectTable} />;
  };

  return (
    <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <DocsSidebar
        activeTableId={activeTableId ? decodeURIComponent(activeTableId) : null}
        activeEnumName={isEnumPage && activeEnumName ? decodeURIComponent(activeEnumName) : null}
        onSelectTable={handleSelectTable}
        onSelectEnum={handleSelectEnum}
        onOverview={handleOverview}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
        {schema ? renderContent() : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.4 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>No schema loaded</p>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>ERD에서 스키마를 먼저 불러오세요</p>
              <button
                onClick={() => navigate('/editor')}
                className="mt-4 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
                style={{ background: 'var(--accent)', color: '#fff', transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                ERD로 이동
              </button>
            </div>
          </div>
        )}
      </main>

      {searchOpen && (
        <DocsSearch
          onClose={() => setSearchOpen(false)}
          onSelectTable={handleSelectTable}
          onSelectEnum={handleSelectEnum}
        />
      )}
    </div>
  );
}
