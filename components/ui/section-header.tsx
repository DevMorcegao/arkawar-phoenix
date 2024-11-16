import React from 'react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
  rightElement?: React.ReactNode
  variant?: 'default' | 'large' | 'small'
}

export function SectionHeader({
  title,
  description,
  className,
  rightElement,
  variant = 'default'
}: SectionHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col space-y-1.5 pb-4',
      variant === 'large' && 'pb-6',
      variant === 'small' && 'pb-2',
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={cn(
            'font-semibold leading-none tracking-tight',
            variant === 'large' && 'text-2xl',
            variant === 'default' && 'text-lg',
            variant === 'small' && 'text-base'
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              'text-sm text-muted-foreground mt-1',
              variant === 'large' && 'text-base'
            )}>
              {description}
            </p>
          )}
        </div>
        {rightElement && (
          <div className="ml-4">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
