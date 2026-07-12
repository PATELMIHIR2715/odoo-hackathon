import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle size={28} />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h1>
            <p className="mt-3 text-xs text-muted-foreground font-medium">
              An unexpected error occurred in the application. Please reload or return to safety.
            </p>

            {this.state.error && (
              <details className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-left">
                <summary className="cursor-pointer text-[10px] font-semibold text-muted-foreground uppercase select-none">
                  Error Details
                </summary>
                <p className="mt-2 font-mono text-[10px] leading-normal text-destructive overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </details>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReset}
                className="rounded-xl w-full sm:w-auto py-5 bg-primary text-primary-foreground hover:bg-primary/95"
              >
                <RotateCcw size={14} className="mr-2" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
