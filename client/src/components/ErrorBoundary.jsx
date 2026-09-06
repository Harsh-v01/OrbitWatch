import { Component } from "react";

/*
 * Keeps one failing panel from taking down the whole instrument.
 * Wrapped around each independent region of the Sky page, so a
 * bad icon import or an unexpected payload degrades to a small
 * inline notice instead of a blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, message: null };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error, info) {
    /* Surface it for debugging without crashing the tree. */
    console.error(
      `[OrbitWatch] ${this.props.label ?? "component"} failed to render`,
      error,
      info
    );
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="failure-notice" role="alert">
        <strong>{this.props.label ?? "This panel"} could not be displayed</strong>
        <span>
          The rest of OrbitWatch is unaffected. Reload to try this section
          again.
        </span>
        {this.state.message && <code>{this.state.message}</code>}
      </div>
    );
  }
}
