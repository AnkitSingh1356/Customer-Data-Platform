import { Component } from "react";

// Class component required because React error boundaries must use lifecycle methods.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  // Triggers on any uncaught render error in the subtree; switches to fallback UI.
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Logs the full component stack for debugging; does not affect render path.
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  // Clears error state so the child subtree re-mounts and retries rendering.
  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrap">
          <h3 className="error-boundary-title">Something went wrong</h3>
          <p className="error-boundary-msg">
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
