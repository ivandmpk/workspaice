import { ActionIcon } from '@mantine/core'
import { IconWorld } from '@tabler/icons-react'
import { forwardRef } from 'react'
import { ScalableIcon } from '../common/ScalableIcon'
import { desktopActionIconProps, mobileActionIconProps } from './actionIconStyles'

interface WebBrowsingButtonProps {
  active: boolean
  onClick: () => void
  isMobile?: boolean
  size?: string | number
  variant?: string
}

export const WebBrowsingButton = forwardRef<HTMLButtonElement, WebBrowsingButtonProps>(
  ({ active, onClick, isMobile = false, size, variant }, ref) => {
    const actionIconProps = isMobile
      ? { ...mobileActionIconProps, color: active ? 'workspaice-brand' : 'workspaice-secondary' }
      : {
          ...desktopActionIconProps,
          size: size || desktopActionIconProps.size,
          variant: variant || desktopActionIconProps.variant,
          color: active ? 'workspaice-brand' : 'workspaice-secondary',
        }

    return (
      <ActionIcon ref={ref} {...actionIconProps} onClick={onClick}>
        <ScalableIcon icon={IconWorld} size={22} strokeWidth={1.8} />
      </ActionIcon>
    )
  }
)

WebBrowsingButton.displayName = 'WebBrowsingButton'
