import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 32px", textAlign: "center" }}>
          <h3 style={{ color: "#dc2626", marginBottom: 8 }}>Something went wrong</h3>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: 20 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: "8px 20px", background: "#1a56db", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.84rem",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
