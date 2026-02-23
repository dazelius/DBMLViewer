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
    if (isRelationshipsTab) return <DocsRelationships />;
    if (isEnumPage && activeEnumName) return <DocsEnumDetail enumName={decodeURIComponent(activeEnumName)} />;
    if (activeTableId) return <DocsTableDetail tableId={decodeURIComponent(activeTableId)} onNavigate={handleSelectTable} />;
    return <DocsOverview onSelectTable={handleSelectTable} />;
  };

  return (
    <div className="flex flex-col h-full w-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-3 h-12 flex-shrink-0 select-none"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}
      >
        {/* Left: Logo + Mode + Sub-tabs */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-1">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent)', boxShadow: '0 1px 4px var(--accent)40' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <span className="font-bold text-[13px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SchemaLens
            </span>
          </div>

          {/* Mode Switch */}
          <div
            className="flex p-[3px] rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
          >
            <ModeTab active={false} onClick={() => navigate('/editor')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              Editor
            </ModeTab>
            <ModeTab active={true} onClick={() => navigate('/docs')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Docs
            </ModeTab>
          </div>

          <div className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

          {/* Docs sub-tabs */}
          <div
            className="flex p-[3px] gap-0.5 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
          >
            <SubTab active={activeTab === 'schema'} onClick={() => setActiveTab('schema')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Schema
            </SubTab>
            <SubTab active={activeTab === 'relationships'} onClick={() => setActiveTab('relationships')}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Relationships
            </SubTab>
          </div>
        </div>

        {/* Right: Search + Theme */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
            style={{
              color: 'var(--text-muted)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              transition: 'border-color 0.15s, box-shadow 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search...
            <kbd
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            >
              ⌘K
            </kbd>
          </button>

          <div className="w-px h-5 mx-0.5 flex-shrink-0" style={{ background: 'var(--border-color)' }} />

          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ color: 'var(--text-muted)', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {theme === 'dark' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
                <p className="text-[12px]" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Write DBML in the Editor first</p>
                <button
                  onClick={() => navigate('/editor')}
                  className="mt-4 text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Go to Editor
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {searchOpen && <DocsSearch onClose={() => setSearchOpen(false)} onSelectTable={handleSelectTable} onSelectEnum={handleSelectEnum} />}
    </div>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-[5px] text-[11px] font-semibold rounded-md cursor-pointer"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.25)' : 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}

function SubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-[4px] text-[11px] font-medium rounded-md cursor-pointer"
      style={{
        background: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.background = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}
