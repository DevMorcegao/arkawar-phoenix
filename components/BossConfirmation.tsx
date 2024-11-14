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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirmar Boss Detectado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Nome:</strong> {boss.name}</p>
          <p><strong>Mapa:</strong> {boss.spawnMap}</p>
          {boss.channel && <p><strong>Canal:</strong> {boss.channel}</p>}
          <p><strong>Tempo Capturado:</strong> {boss.appearanceStatus}</p>
          <p><strong>Horário Atual:</strong> {format(now, "dd/MM/yyyy' às 'HH:mm:ss")}</p>
          <p><strong>Horário de Spawn Calculado:</strong> {format(boss.spawnTime, "dd/MM/yyyy' às 'HH:mm")}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onReject}>Rejeitar</Button>
        <Button onClick={onConfirm}>Confirmar</Button>
      </CardFooter>
    </Card>
  )
}

export default BossConfirmation