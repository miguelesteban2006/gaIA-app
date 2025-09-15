import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; err?: any };

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, err };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-xl font-semibold mb-2">Ha ocurrido un error</h1>
            <p className="text-gray-600 mb-4">
              Intenta recargar la página. Si persiste, vuelve al inicio.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border px-4 py-2"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
