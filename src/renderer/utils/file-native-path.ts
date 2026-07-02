const FILE_NATIVE_PATH_PROPERTY = '__workspaiceNativePath'

type FileWithRememberedNativePath = File & {
  [FILE_NATIVE_PATH_PROPERTY]?: string
}

// Electron <32 exposed a non-standard `path` on renderer File objects; the
// runtime property is gone, but some inputs (tests, older persisted shapes)
// may still carry it. Electron 42's types dropped the global augmentation.
export type FileWithLegacyPath = File & { path?: string }

export function rememberFileNativePath(file: File, nativePath: string): string {
  if (nativePath) {
    Object.defineProperty(file, FILE_NATIVE_PATH_PROPERTY, {
      value: nativePath,
      configurable: true,
    })
  }
  return nativePath
}

export function getBestEffortFileNativePath(file: File): string {
  return (file as FileWithRememberedNativePath)[FILE_NATIVE_PATH_PROPERTY] || (file as FileWithLegacyPath).path || ''
}
