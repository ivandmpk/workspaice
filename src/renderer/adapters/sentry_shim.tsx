import React from 'react'

interface SentryScopeLike {
  setTag(_key: string, _value: string | number | boolean): void
  setExtra(_key: string, _value: unknown): void
  setLevel(_level: string): void
  setContext(_name: string, _context: Record<string, unknown>): void
}

function createScope(): SentryScopeLike {
  return {
    setTag() {},
    setExtra() {},
    setLevel() {},
    setContext() {},
  }
}

export function captureException(_error: unknown): void {
  return
}

export function captureMessage(_message: string, _level?: string): void {
  return
}

export function getCurrentScope(): SentryScopeLike {
  return createScope()
}

interface ErrorBoundaryFallbackProps {
  error: Error | null
  resetError: () => void
  componentStack?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps> | React.ReactNode
  beforeCapture?: (scope: SentryScopeLike, error: Error | null, componentStack?: string) => void
  showDialog?: boolean
}

interface ErrorBoundaryState {
  error: Error | null
  componentStack: string | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: null }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const componentStack = info?.componentStack ?? null
    this.setState({ componentStack })
    try {
      this.props.beforeCapture?.(createScope(), error, componentStack ?? undefined)
    } catch {
      // ignore
    }
  }

  resetError = (): void => {
    this.setState({ error: null, componentStack: null })
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (error) {
      const Fallback = this.props.fallback
      const fallbackProps: ErrorBoundaryFallbackProps = {
        error,
        resetError: this.resetError,
        componentStack: this.state.componentStack ?? undefined,
      }
      if (typeof Fallback === 'function') {
        return <Fallback {...fallbackProps} />
      }
      if (Fallback != null) {
        return Fallback
      }
      return null
    }
    return this.props.children
  }
}

export function withErrorBoundary<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  _options?: { fallback?: React.ReactNode; beforeCapture?: ErrorBoundaryProps['beforeCapture'] }
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={_options?.fallback} beforeCapture={_options?.beforeCapture}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
