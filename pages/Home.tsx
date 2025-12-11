import React from 'react';
import { Link } from 'react-router-dom';
import { TOOLS, getIcon } from '../constants';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Home: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-20 pt-6 sm:pt-10">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 sm:mb-6">
          {t.hero.title}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed">
          {t.hero.description}
        </p>
      </div>

      {/* Tools Grid - Updated for compact mobile view */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Object.values(TOOLS).map((tool) => {
          const toolData = t.tools[tool.id];
          return (
            <Link
              key={tool.id}
              to={`/tool/${tool.id}`}
              className="group glass-panel p-5 sm:p-8 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-24 sm:p-32 opacity-10 dark:opacity-20 rounded-full blur-3xl -mr-10 -mt-10 sm:-mr-16 sm:-mt-16 transition-colors duration-500 bg-gradient-to-br from-transparent to-current ${tool.color}`}></div>
              
              <div className={`p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform duration-300 ${tool.color}`}>
                {getIcon(tool.icon, "w-6 h-6 sm:w-8 sm:h-8")}
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2">{toolData.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 sm:mb-6 flex-grow line-clamp-2 sm:line-clamp-none">
                {toolData.description}
              </p>
              
              <div className={`flex items-center text-sm font-semibold ${tool.color} opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300`}>
                {t.common.startNow} <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Privacy Badge */}
      <div className="mt-12 sm:mt-20 text-center">
        <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          {t.hero.badge}
        </span>
      </div>
    </div>
  );
};

export default Home;