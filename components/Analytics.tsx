"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay } from 'date-fns'
import { cn } from "@/lib/utils"
import { logger } from '@/lib/logger'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

type TimeRange = 'day' | 'week' | 'month' | 'year'

interface LogEntry {
  id: string
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

interface FilterOptions {
  action: string
  bossName: string
  channel: string
}

const ITEMS_PER_PAGE = 20

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterOptions>({
    action: '',
    bossName: '',
    channel: ''
  })
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

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
      
      // Query base apenas com timestamp
      const baseQuery = query(
        collection(db, 'bossLogs'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay(new Date()))),
        orderBy('timestamp', 'desc')
      )

      // Buscar todos os documentos
      const querySnapshot = await getDocs(baseQuery)
      const allLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as LogEntry[]

      // Aplicar todos os filtros nos dados
      let filteredLogs = allLogs

      // Filtrar por ação
      if (filters.action && filters.action !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action)
      }

      // Filtrar por nome do boss
      if (filters.bossName) {
        filteredLogs = filteredLogs.filter(log => 
          log.bossName?.toLowerCase().includes(filters.bossName.toLowerCase())
        )
      }

      // Filtrar por canal
      if (filters.channel) {
        filteredLogs = filteredLogs.filter(log => 
          log.channel?.toLowerCase().includes(filters.channel.toLowerCase())
        )
      }

      // Calcular total de páginas após filtros
      const totalFilteredDocs = filteredLogs.length
      setTotalPages(Math.ceil(totalFilteredDocs / ITEMS_PER_PAGE))

      // Aplicar paginação nos resultados filtrados
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex)
      
      setLogs(paginatedLogs)

      // Usar logs filtrados para o gráfico
      const data: ChartData[] = [{
        name: 'Ações',
        added: filteredLogs.filter(log => log.action === 'added').length,
        killed: filteredLogs.filter(log => log.action === 'killed').length,
        noshow: filteredLogs.filter(log => log.action === 'noshow').length,
        edited: filteredLogs.filter(log => log.action === 'edited').length,
        deleted: filteredLogs.filter(log => log.action === 'deleted').length
      }]

      setChartData(data)

      // Se a página atual é maior que o total de páginas, voltar para a primeira
      if (currentPage > Math.ceil(totalFilteredDocs / ITEMS_PER_PAGE)) {
        setCurrentPage(1)
      }

    } catch (error) {
      logger.error('Analytics', 'Error fetching data', { error })
    } finally {
      setIsLoading(false)
    }
  }, [getStartDate, currentPage, filters])

  useEffect(() => {
    fetchData(timeRange)
  }, [timeRange, fetchData])

  // Reset página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, timeRange])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Análise de Atividades</CardTitle>
        </div>
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

        <div className="w-full border-t mt-6 mb-6"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              Log de Atividades
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {timeRange === 'day' && 'Hoje'}
            {timeRange === 'week' && 'Esta Semana'}
            {timeRange === 'month' && 'Este Mês'}
            {timeRange === 'year' && 'Este Ano'}
          </span>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="added">Adicionados</SelectItem>
                  <SelectItem value="killed">Mortos</SelectItem>
                  <SelectItem value="noshow">Não apareceu</SelectItem>
                  <SelectItem value="edited">Editados</SelectItem>
                  <SelectItem value="deleted">Removidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Filtrar por boss"
                value={filters.bossName}
                onChange={(e) => setFilters(prev => ({ ...prev, bossName: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Filtrar por canal"
                value={filters.channel}
                onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
              />
            </div>
          </div>
        )}

        <ScrollArea className="h-[300px]">
          <div className="space-y-2 pr-4">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className="text-sm p-2 rounded bg-muted"
                >
                  <span className="text-muted-foreground">
                    {log.timestamp.toLocaleString('pt-BR')}
                  </span>
                  {' - '}
                  <span className="font-medium">{log.userName}</span>
                  {' '}
                  <span>
                    {log.action === 'added' && 'adicionou'}
                    {log.action === 'killed' && 'marcou como morto'}
                    {log.action === 'noshow' && 'marcou como não aparecido'}
                    {log.action === 'edited' && 'editou'}
                    {log.action === 'deleted' && 'removeu'}
                  </span>
                  {' '}
                  <span className="font-medium">
                    {log.bossName}
                  </span>
                  {log.channel && (
                    <span className="text-muted-foreground">
                      {' no '}{log.channel}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground">
                Nenhuma atividade encontrada para este período
              </div>
            )}
          </div>
        </ScrollArea>

        {logs.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}