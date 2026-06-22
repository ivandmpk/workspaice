import { useState, useEffect } from 'react'
import platform from '../platform'

export default function useVersion() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    const handler = async () => {
      const v = await platform.getVersion()
      setVersion(v)
    }
    handler()
  }, [])

  return {
    version,
    versionLoaded: !!version,
  }
}
