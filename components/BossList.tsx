import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Clock, Hash, Type } from 'lucide-react'
import { Boss } from '@/app/types/boss'
import BossCard from './BossCard'
import { SectionHeader } from '@/components/ui/section-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BossListProps {
  bosses: Boss[]
  onSort: (sortBy: 'time' | 'name' | 'channel') => void
  onRemove: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'killed' | 'noshow') => Promise<void>
  onEdit: (boss: Boss) => Promise<void>
}

const BossList: React.FC<BossListProps> = ({ bosses, onSort, onRemove, onUpdateStatus, onEdit }) => {
  if (bosses.length === 0) return null

  const sortButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          Ordenar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onSort('time')} className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Por Tempo</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort('name')} className="flex items-center gap-2">
          <Type className="h-4 w-4" />
          <span>Por Nome</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort('channel')} className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          <span>Por Canal</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Lista de Bosses"
          description={`${bosses.length} bosses encontrados`}
          variant="default"
        />
        {sortButton}
      </div>
      <div className="space-y-2">
        {bosses.map((boss) => {
          console.log('BossList: Rendering BossCard for boss:', boss.id)
          return (
            <BossCard
              key={boss.id}
              boss={boss}
              onRemove={onRemove}
              onUpdateStatus={onUpdateStatus}
              onEdit={(updatedBoss) => {
                console.log('BossList: Calling onEdit for boss:', updatedBoss)
                return onEdit(updatedBoss)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default BossList