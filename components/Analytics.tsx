"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns'
import { cn } from "@/lib/utils"
import { logger } from '@/lib/logger'

type TimeRange = 'day' | 'week' | 'month' | 'year'

interface LogData {
  action: 'added' | 'killed' | 'noshow' | 'edited' | 'deleted'
  timestamp: Date
  userId: string
  userName: string
  bossId: string
  bossName: string
  channel?: string
  details?: {
    oldValue?: string
    newValue?: string
    field?: string
  }
}

interface ChartData {
  name: string
  added: number
  killed: number
  noshow: number
  edited: number
  deleted: number
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getStartDate = useCallback((range: TimeRange) => {
    const now = new Date()

    switch (range) {
      case 'day':
        return startOfDay(now)
      case 'week':
        return startOfWeek(now)
      case 'month':
        return startOfMonth(now)
      case 'year':
        return startOfYear(now)
      default:
        return startOfDay(now)
    }
  }, [])

  const fetchData = useCallback(async (range: TimeRange) => {
    setIsLoading(true)
    try {
      const startDate = getStartDate(range)
      logger.debug('Analytics', 'Start date', { startDate })

      const logsRef = collection(db, 'bossLogs')
      const q = query(
        logsRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay(new Date())))
      )

      const querySnapshot = await getDocs(q)
      logger.debug('Analytics', 'Logs found', { count: querySnapshot.size })

      const logs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as LogData[]

      logger.debug('Analytics', 'Processed logs', { logs })

      // Processar dados para o gráfico
      const data: ChartData[] = [{
        name: 'Ações',
        added: logs.filter(log => log.action === 'added').length,
        killed: logs.filter(log => log.action === 'killed').length,
        noshow: logs.filter(log => log.action === 'noshow').length,
        edited: logs.filter(log => log.action === 'edited').length,
        deleted: logs.filter(log => log.action === 'deleted').length
      }]

      logger.debug('Analytics', 'Chart data', { data })
      setChartData(data)
    } catch (error) {
      logger.error('Analytics', 'Error fetching data', { error })
      logger.error('Analytics', 'Error fetching data', { error })
    } finally {
      setIsLoading(false)
    }
  }, [getStartDate])

  useEffect(() => {
    fetchData(timeRange)
  }, [timeRange, fetchData])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Atividades</CardTitle>
        <div className="flex space-x-2">
          <Button
            onClick={() => setTimeRange('day')}
            variant="outline"
            className={cn(
              timeRange === 'day' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
            )}
          >
            Hoje
          </Button>
          <Button
            onClick={() => setTimeRange('week')}
            variant="outline"
            className={cn(
              timeRange === 'week' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
            )}
          >
            Semana
          </Button>
          <Button
            onClick={() => setTimeRange('month')}
            variant="outline"
            className={cn(
              timeRange === 'month' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
            )}
          >
            Mês
          </Button>
          <Button
            onClick={() => setTimeRange('year')}
            variant="outline"
            className={cn(
              timeRange === 'year' && "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500"
            )}
          >
            Ano
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            Carregando...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={chartData}
              style={{ backgroundColor: 'transparent' }}
              margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151"
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                dy={16}
              />
              <YAxis 
                stroke="#9CA3AF"
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                wrapperStyle={{ 
                  outline: 'none',
                  zIndex: 100
                }}
                isAnimationActive={false}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: '20px'
                }}
              />
              <Bar 
                dataKey="added" 
                fill="#4CAF50" 
                name="Adicionados"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="killed" 
                fill="#9C27B0"
                name="Mortos"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="noshow" 
                fill="#FF9800" 
                name="Não Apareceu"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="edited" 
                fill="#2196F3"
                name="Editados"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="deleted" 
                fill="#F44336" 
                name="Deletados"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}