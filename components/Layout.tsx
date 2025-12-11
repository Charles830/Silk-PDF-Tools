import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Github, Moon, Sun, Globe, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <AuthModal />
      
      {/* Navigation */}
      <nav className={`w-full z-50 transition-all duration-300 ${isHome ? 'bg-transparent py-4 sm:py-6' : 'glass-panel sticky top-0 py-3 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 z-50 relative select-none">
             <div className="relative">
                <img 
                  src="https://youke2.picui.cn/s1/2025/12/11/693a2fc487b80.png" 
                  alt="Silk Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shadow-sm"
                />
             </div>
            <span className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
              Silk PDF
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-5">
            {!isHome && (
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1 font-medium">
                <Home className="w-4 h-4" />
                <span>{t.nav.allTools}</span>
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

            {/* Language Toggle */}
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
                 <div className="flex items-center gap-2 text-sm font-medium">
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
                  className="text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white font-medium px-3 py-2 transition-colors"
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

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-800 dark:text-white z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
             {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Slide-out Menu */}
        <div className={`fixed inset-0 bg-white dark:bg-slate-900 z-40 transform transition-transform duration-300 ease-in-out pt-24 px-6 flex flex-col gap-6 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {!isHome && (
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-800 dark:text-slate-100 flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <Home className="w-5 h-5" />
                {t.nav.allTools}
              </Link>
            )}
            
            <div className="flex items-center justify-between p-2">
               <span className="text-slate-600 dark:text-slate-300 font-medium">Appearance</span>
               <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {theme === 'light' ? <div className="flex items-center gap-2"><Moon className="w-5 h-5"/> Dark</div> : <div className="flex items-center gap-2"><Sun className="w-5 h-5"/> Light</div>}
              </button>
            </div>

            <div className="flex items-center justify-between p-2">
               <span className="text-slate-600 dark:text-slate-300 font-medium">Language</span>
               <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'Switch to 中文' : 'Switch to English'}</span>
              </button>
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

             {user ? (
               <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3 text-lg font-medium text-slate-800 dark:text-white">
                    <UserIcon className="w-5 h-5" />
                    <span>{t.nav.welcome}, {user.username}</span>
                 </div>
                 <button 
                   onClick={() => { logout(); setMobileMenuOpen(false); }}
                   className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium"
                 >
                   <LogOut className="w-5 h-5" />
                   {t.nav.logout}
                 </button>
               </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold"
                >
                  {t.nav.login}
                </button>
                <button 
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg"
                >
                  {t.nav.signup}
                </button>
              </div>
            )}
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