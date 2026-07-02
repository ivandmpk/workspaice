const Sentry = {
  captureException(_error: unknown) {},
  captureMessage(_message: string, _level?: string) {},
  withScope(
    callback: (scope: {
      setTag: (key: string, value: string) => void
      setContext: (key: string, value: unknown) => void
      setLevel: (level: string) => void
    }) => void
  ) {
    callback({
      setTag(_key: string, _value: string) {},
      setContext(_key: string, _value: unknown) {},
      setLevel(_level: string) {},
    })
  },
}

export default Sentry
