import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
import DocsSidebar from './DocsSidebar.tsx';
import DocsOverview from './DocsOverview.tsx';
import DocsTableDetail from './DocsTableDetail.tsx';
import DocsEnumDetail from './DocsEnumDetail.tsx';
import DocsRelationships from './DocsRelationships.tsx';
import DocsSearch from './DocsSearch.tsx';

interface DocsLayoutProps {
  activeTableId: string | null;
  activeEnumName: string | null;
}

type DocsTab = 'schema' | 'relationships';

export default function DocsLayout({ activeTableId, activeEnumName }: DocsLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const schema = useSchemaStore((s) => s.schema);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark'
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DocsTab>('schema');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleSelectTable = useCallback((tableId: string) => {
    setActiveTab('schema');
    navigate(`/docs/${encodeURIComponent(tableId)}`);
  }, [navigate]);

  const handleSelectEnum = useCallback((enumName: string) => {
    setActiveTab('schema');
    navigate(`/docs/enum/${encodeURIComponent(enumName)}`);
  }, [navigate]);

  const handleOverview = useCallback(() => {
    setActiveTab('schema');
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

  const isRelationshipsTab = activeTab === 'relationships';
  const isEnumPage = location.pathname.startsWith('/docs/enum/');

  const renderContent = () => {
    if (isRelationshipsTab) {
      return <DocsRelationships />;
    }
    if (isEnumPage && activeEnumName) {
      return <DocsEnumDetail enumName={decodeURIComponent(activeEnumName)} />;
    }
    if (activeTableId) {
      return <DocsTableDetail tableId={decodeURIComponent(activeTableId)} onNavigate={handleSelectTable} />;
    }
    return <DocsOverview onSelectTable={handleSelectTable} />;
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 h-12 flex-shrink-0 select-none"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--accent)' }}>
            ERD Studio
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Docs</span>

          <div className="flex ml-5 gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
            <TabButton active={activeTab === 'schema'} onClick={() => setActiveTab('schema')}>
              Schema
            </TabButton>
            <TabButton active={activeTab === 'relationships'} onClick={() => setActiveTab('relationships')}>
              Relationships
            </TabButton>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search</span>
            <kbd className="ml-1 px-1 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              Ctrl+K
            </kbd>
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-color)' }} />

          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Editor</span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {!isRelationshipsTab && (
          <DocsSidebar
            activeTableId={activeTableId ? decodeURIComponent(activeTableId) : null}
            activeEnumName={isEnumPage && activeEnumName ? decodeURIComponent(activeEnumName) : null}
            onSelectTable={handleSelectTable}
            onSelectEnum={handleSelectEnum}
            onOverview={handleOverview}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}
        <main className="flex-1 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
          {schema ? renderContent() : (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: 'var(--text-muted)' }}>No schema loaded. Write DBML in the Editor first.</p>
            </div>
          )}
        </main>
      </div>

      {searchOpen && <DocsSearch onClose={() => setSearchOpen(false)} onSelectTable={handleSelectTable} onSelectEnum={handleSelectEnum} />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      {children}
    </button>
  );
}
