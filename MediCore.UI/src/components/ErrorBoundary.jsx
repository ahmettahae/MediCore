import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Hatayı log servisine veya konsola ilet
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary yakaladı:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle size={24} strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#142A4A] tracking-tight">
                Bir Görüntüleme Hatası Oluştu
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                İşleminiz sırasında beklenmeyen bir arayüz hatası meydana geldi. Lütfen sayfayı yenileyiniz veya ana sayfaya dönünüz.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-left overflow-x-auto text-[11px] font-mono text-slate-700 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={this.handleReload}
                className="h-8 px-4 rounded-lg bg-[#3E5C76] hover:bg-[#2A3F50] text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={13} strokeWidth={2.4} />
                <span>Sayfayı Yenile</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 transition-all"
              >
                <Home size={13} strokeWidth={2.2} />
                <span>Ana Sayfa</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
