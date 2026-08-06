import { Component, ErrorInfo, ReactNode } from "react";
import { withTranslation, WithTranslation } from "react-i18next";

import { ErrorState } from "@/components/ui";

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  /** Rendered instead of the default ErrorState when the subtree throws. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without a boundary React unmounts the whole tree on a render error and the
 * customer is left with a blank page.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Render error:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { children, fallback, t } = this.props;

    if (!this.state.hasError) return children;
    if (fallback) return fallback;

    return (
      <ErrorState
        title={t("general.error.title")}
        description={t("general.error.somethingWentWrong")}
        retryLabel={t("common.retry")}
        onRetry={this.handleRetry}
      />
    );
  }
}

export default withTranslation()(ErrorBoundary);
