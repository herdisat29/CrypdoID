import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-container" className="h-screen flex items-center justify-center bg-black text-center p-8 select-none">
          <div id="error-boundary-card" className="max-w-md bg-zinc-950 border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <h2 id="error-boundary-title" className="text-3xl font-black text-red-500 mb-4 tracking-tight">
              OOPS! ADA YANG ERROR NIH SENIOR
            </h2>
            <p id="error-boundary-desc" className="text-slate-400 mb-6 text-sm leading-relaxed">
              Sistem mendeteksi masalah koneksi jaringan. Coba refresh halaman untuk sinkronisasi ulang.
            </p>
            <button 
              id="error-boundary-refresh-button"
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.5)] cursor-pointer"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
