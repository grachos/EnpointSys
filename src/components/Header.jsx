import React, { useState } from 'react';
import { 
  Globe, 
  Upload, 
  Code2, 
  Settings, 
  Flame, 
  BookOpen,
  Share2,
  SlidersHorizontal,
  Menu,
  Sun,
  Moon,
  Laptop,
  Languages,
  Rows,
  Columns,
  PanelLeftOpen,
  PanelLeftClose,
  Shield,
  User,
  LogOut,
  Key,
  ChevronDown
} from 'lucide-react';
import { translations } from '../i18n/translations';

export default function Header({ 
  environments, 
  activeEnvId, 
  onSelectEnvironment, 
  onOpenEnvModal, 
  onOpenImportExportModal, 
  onOpenCodeSnippetModal,
  onOpenPublishDocsModal,
  activeTabRequest,
  viewMode,
  onToggleViewMode,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  splitMode,
  onToggleSplitMode,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onToggleMobileSidebar,
  currentUser,
  onOpenLoginModal,
  onLogout
}) {
  const t = translations[lang] || translations.en;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-3 md:px-5 z-20 flex-shrink-0 select-none">
      {/* LEFT CLUSTER: Sidebar Toggle, Brand & Environment Selector */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded hover:bg-dark-850 text-slate-400 hover:text-slate-100"
          title="Toggle Mobile Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button (always visible on desktop so the sidebar can be re-expanded) */}
        <button
          onClick={onToggleSidebarCollapse}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-dark-850 text-slate-400 hover:text-slate-100 transition-colors border border-transparent hover:border-dark-800"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-brand-accent" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-accent p-0.5 flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
            <div className="w-full h-full bg-dark-950 rounded-[7px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-brand-accent animate-pulse-subtle" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-0.5">
              {t.appName}<span className="text-brand-accent">{t.appSuffix}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* CENTER CLUSTER: Workspace Mode vs Docs Mode */}
      <div className="flex items-center space-x-1 bg-dark-950 p-1 border border-dark-800 rounded-xl shadow-inner">
        <button
          onClick={() => onToggleViewMode('workspace')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'workspace'
              ? 'bg-brand-500/20 text-brand-accent border border-brand-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.workspaceMode}</span>
        </button>

        <button
          onClick={() => onToggleViewMode('docs')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            viewMode === 'docs'
              ? 'bg-brand-500/20 text-brand-accent border border-brand-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.docsMode}</span>
        </button>
      </div>

      {/* RIGHT CLUSTER: Actions, Display Settings & User Profile */}
      <div className="flex items-center space-x-2">
        {/* Action Buttons Group */}
        <div className="flex items-center space-x-1.5">
          {/* Publish Docs */}
          <button
            onClick={onOpenPublishDocsModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-300 transition-all"
            title={t.publishDocs}
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">{t.publishDocs}</span>
          </button>

          {/* Code Snippet */}
          <button
            onClick={onOpenCodeSnippetModal}
            disabled={!activeTabRequest}
            className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-medium text-slate-300 hover:text-slate-100 transition-all disabled:opacity-40"
          >
            <Code2 className="w-3.5 h-3.5 text-brand-accent" />
            <span>{t.codeSnippet}</span>
          </button>

          {/* Import Catalog */}
          <button
            onClick={() => onOpenImportExportModal('import')}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-dark-700 text-xs font-medium text-slate-300 hover:text-slate-100 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline">{t.importCatalog}</span>
          </button>
        </div>

        {/* Display Settings Toolbar (Split Mode, Language & Theme in 1 Compact Group) */}
        <div className="flex items-center space-x-1 bg-dark-950 border border-dark-800 rounded-xl p-1">
          {/* Split Mode Toggle */}
          {viewMode === 'workspace' && (
            <div className="hidden sm:flex items-center space-x-0.5 border-r border-dark-800 pr-1 mr-0.5">
              <button
                onClick={() => onToggleSplitMode('vertical')}
                className={`p-1 rounded text-xs transition-colors ${
                  splitMode === 'vertical' ? 'bg-brand-500/20 text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Split Top / Bottom (Vertical)"
              >
                <Rows className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToggleSplitMode('horizontal')}
                className={`p-1 rounded text-xs transition-colors ${
                  splitMode === 'horizontal' ? 'bg-brand-500/20 text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Split Left / Right (Horizontal)"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => onToggleLang(lang === 'en' ? 'es' : 'en')}
            className="px-1.5 py-0.5 rounded text-xs font-bold text-brand-accent hover:bg-dark-850 transition-colors flex items-center space-x-1"
            title="Switch Language (EN / ES)"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="text-[11px]">{lang.toUpperCase()}</span>
          </button>

          {/* Theme Selector */}
          <div className="hidden sm:flex items-center space-x-0.5 border-l border-dark-800 pl-1 ml-0.5">
            <button
              onClick={() => onToggleTheme('dark')}
              className={`p-1 rounded text-xs transition-colors ${theme === 'dark' ? 'bg-brand-500/20 text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-100'}`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleTheme('light')}
              className={`p-1 rounded text-xs transition-colors ${theme === 'light' ? 'bg-brand-500/20 text-brand-accent font-bold' : 'text-slate-400 hover:text-slate-100'}`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clean Staff User Menu / Badge */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 bg-dark-950 hover:bg-dark-850 border border-dark-800 rounded-xl px-2.5 py-1 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                )}
              </div>
              <div className="text-xs font-semibold text-slate-200 hidden md:block">
                <span>{currentUser.name}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl py-1 z-50">
                <div className="px-3 py-2 border-b border-dark-800">
                  <div className="text-xs font-bold text-slate-100">{currentUser.name}</div>
                  <div className="text-[10px] text-brand-accent uppercase font-mono font-bold mt-0.5">
                    Role: {currentUser.role}
                  </div>
                </div>

                <button
                  onClick={() => { setIsUserMenuOpen(false); onOpenLoginModal(); }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-dark-800 flex items-center space-x-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.switchRole}</span>
                </button>

                <button
                  onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/20 flex items-center space-x-2 border-t border-dark-800"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.logOut}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{t.staffLogin}</span>
          </button>
        )}
      </div>
    </header>
  );
}
