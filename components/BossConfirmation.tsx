import React from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Boss } from '@/app/types/boss'

interface BossConfirmationProps {
  boss: Boss
  onConfirm: () => void
  onReject: () => void
}

const BossConfirmation: React.FC<BossConfirmationProps> = ({ boss, onConfirm, onReject }) => {
  const now = new Date()

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-900/40 dark:via-gray-900 dark:to-red-900/40 shadow-[0_0_15px_rgba(251,146,60,0.2)] dark:shadow-[0_0_15px_rgba(251,146,60,0.1)] border-2 border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-500 dark:from-orange-400 dark:via-red-400 dark:to-orange-300 bg-clip-text text-transparent">
          Confirmar Boss Detectado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Nome:</strong>
            <span className="text-gray-800 dark:text-gray-200">{boss.name}</span>
          </p>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Mapa:</strong>
            <span className="text-gray-800 dark:text-gray-200">{boss.spawnMap}</span>
          </p>
          {boss.channel && (
            <p className="flex justify-between items-center">
              <strong className="text-orange-700 dark:text-orange-300">Canal:</strong>
              <span className="text-gray-800 dark:text-gray-200">{boss.channel}</span>
            </p>
          )}
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Tempo Capturado:</strong>
            <span className="text-gray-800 dark:text-gray-200">{boss.appearanceStatus}</span>
          </p>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Horário Atual:</strong>
            <span className="text-gray-800 dark:text-gray-200">{format(now, "dd/MM/yyyy' às 'HH:mm:ss")}</span>
          </p>
          <p className="flex justify-between items-center">
            <strong className="text-orange-700 dark:text-orange-300">Horário de Spawn Calculado:</strong>
            <span className="text-gray-800 dark:text-gray-200">{format(boss.spawnTime, "dd/MM/yyyy' às 'HH:mm")}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={onReject}
          className="bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/30 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
        >
          Rejeitar
        </Button>
        <Button 
          onClick={onConfirm}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 dark:from-orange-600 dark:to-red-600 dark:hover:from-orange-700 dark:hover:to-red-700"
        >
          Confirmar
        </Button>
      </CardFooter>
    </Card>
  )
}

export default BossConfirmation