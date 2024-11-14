import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { Boss } from '@/app/types/boss' 
import BossCard from './BossCard'

interface BossListProps {
  bosses: Boss[]
  onSort: () => void
  onRemove: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'killed' | 'noshow') => Promise<void>
}

const BossList: React.FC<BossListProps> = ({ bosses, onSort, onRemove, onUpdateStatus }) => {
  if (bosses.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Bosses Detectados:</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onSort}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          Ordenar por Tempo
        </Button>
      </div>
      <div className="space-y-2">
        {bosses.map((boss) => (
          <BossCard
            key={boss.id}
            boss={boss}
            onRemove={onRemove}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </div>
    </div>
  )
}

export default BossList