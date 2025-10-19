import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Left: Branding */}
            <div className="text-xl font-bold text-gray-800">
              {t('nav.branding')}
            </div>

            {/* Center: Navigation Links */}
            <div className="flex gap-8">
              <Link
                to="/"
                className={`text-base font-medium transition ${
                  location.pathname === '/'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('nav.courses')}
              </Link>
              <Link
                to="/edit"
                className={`text-base font-medium transition ${
                  location.pathname === '/edit'
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('nav.admin')}
              </Link>
            </div>

            {/* Right: Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
