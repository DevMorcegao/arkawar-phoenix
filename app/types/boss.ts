export interface Boss {
  id: string
  name: string
  spawnMap: string
  channel?: string
  appearanceStatus: string
  capturedTime?: string
  spawnTime: string
  status: 'pending' | 'killed' | 'noshow' | 'deleted'
  lastUpdated?: Date | null
  userId?: string
  createdAt?: Date
}

export interface BossData {
  name: string
  spawnMap: string
  searchTerms: string[]
}