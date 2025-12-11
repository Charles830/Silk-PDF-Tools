import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Github, Moon, Sun, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AuthModal from './AuthModal';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    t,
    user,
    logout,
    setAuthModalOpen,
    setAuthModalTab
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <AuthModal />
      
      {/* Navigation */}
      <nav className={`w-full z-50 transition-all duration-300 ${isHome ? 'bg-transparent py-6' : 'glass-panel sticky top-0 py-3 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <span className="text-2xl font-bold text-black dark:text-white tracking-tight">
              Silk PDF
            </span>
          </Link>
          
          <div className="flex items-center space-x-3 sm:space-x-5">
            {!isHome && (
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1 font-medium">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t.nav.allTools}</span>
              </Link>
            )}
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Language Toggle: Show the OTHER language to switch to */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300 font-medium text-sm"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? '中' : 'EN'}</span>
            </button>
            
            {/* Auth Buttons */}
            {user ? (
               <div className="flex items-center gap-3 pl-2 border-l border-slate-300 dark:border-slate-700">
                 <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                    <UserIcon className="w-4 h-4" />
                    <span>{t.nav.welcome}, {user.username}</span>
                 </div>
                 <button 
                   onClick={logout}
                   className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                   title={t.nav.logout}
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true); }}
                  className="hidden sm:block text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white font-medium px-3 py-2 transition-colors"
                >
                  {t.nav.login}
                </button>
                <button 
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                  className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2 rounded-full font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition-transform active:scale-95 shadow-lg"
                >
                  {t.nav.signup}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 glass-panel border-t border-white/20 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            © {new Date().getFullYear()} Silk PDF Tools. {t.hero.badge}.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-slate-400 hover:text-pink-500 transition-colors"><Github className="w-5 h-5"/></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;