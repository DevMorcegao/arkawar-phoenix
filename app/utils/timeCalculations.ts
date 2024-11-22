import { addHours, addMinutes, subMinutes } from 'date-fns'

export const calculateSpawnTime = (hours: number, minutes: number): Date => {
  const now = new Date()
  let spawnTime = addHours(now, hours)
  spawnTime = addMinutes(spawnTime, minutes)
  // Subtrai 5 minutos para considerar o tempo entre o spawn e a morte do boss
  return subMinutes(spawnTime, 5)
}
