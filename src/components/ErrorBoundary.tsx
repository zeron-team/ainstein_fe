// src/components/ErrorBoundary.tsx
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "'Inter', system-ui, sans-serif",
            background: "#0f1117",
            color: "#e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              textAlign: "center",
              padding: "2.5rem",
              borderRadius: "1rem",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.25rem", fontWeight: 600 }}>
              Algo salió mal
            </h2>
            <p style={{ margin: "0 0 1.5rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Ocurrió un error inesperado en la aplicación. Podés intentar recargar la página.
            </p>
            {this.state.error && (
              <pre
                style={{
                  margin: "0 0 1.5rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "rgba(239,68,68,0.1)",
                  color: "#f87171",
                  fontSize: "0.75rem",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 120,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
