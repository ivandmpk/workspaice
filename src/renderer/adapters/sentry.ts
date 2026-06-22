import type { SentryAdapter, SentryScope } from '../../shared/utils/sentry_adapter'

/**
 * 渲染进程的 Sentry 适配器实现
 */
export class RendererSentryAdapter implements SentryAdapter {
  captureException(_error: unknown): void {
    return
  }

  withScope(callback: (scope: SentryScope) => void): void {
    callback({
      setTag(_key: string, _value: string): void {},
      setExtra(_key: string, _value: unknown): void {},
    })
  }
}
