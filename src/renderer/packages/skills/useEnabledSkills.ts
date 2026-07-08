import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { featureFlags } from '@/utils/feature-flags'
import { skillsController } from './controller'

export interface EnabledSkill {
  name: string
  description: string
}

// Enabled skills available for `/slash` invocation in the composer.
// Reacts to the Settings enable/disable toggles; re-discovers when they change.
export function useEnabledSkills(): EnabledSkill[] {
  const enabledNames = useSettingsStore((s) => s.skills?.enabledSkillNames)
  const [skills, setSkills] = useState<EnabledSkill[]>([])

  useEffect(() => {
    if (!featureFlags.skills || !enabledNames || enabledNames.length === 0) {
      setSkills([])
      return
    }
    let cancelled = false
    skillsController
      .discoverSkills()
      .then((all) => {
        if (cancelled) return
        setSkills(
          all.filter((s) => enabledNames.includes(s.name)).map((s) => ({ name: s.name, description: s.description }))
        )
      })
      .catch(() => {
        if (!cancelled) setSkills([])
      })
    return () => {
      cancelled = true
    }
  }, [enabledNames])

  return skills
}
