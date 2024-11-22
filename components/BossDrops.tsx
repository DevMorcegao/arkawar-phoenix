'use client'

import { useState, useEffect } from 'react'
import { bossDropData } from '@/app/data/bossDropData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function BossDrops() {
  const [selectedBoss, setSelectedBoss] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    (window as any).openBossDropsModal = () => setIsOpen(true)
  }, [])

  const bosses = Object.keys(bossDropData)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[800px] max-h-[80vh]" data-boss-drops-dialog>
        <DialogHeader>
          <DialogTitle>Drops dos Bosses</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 h-full">
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-[60vh]">
              {bosses.map((boss) => (
                <Button
                  key={boss}
                  variant={selectedBoss === boss ? "secondary" : "ghost"}
                  className="w-full justify-start mb-2"
                  onClick={() => setSelectedBoss(boss)}
                >
                  {boss}
                </Button>
              ))}
            </ScrollArea>
          </div>
          <div className="w-2/3">
            <ScrollArea className="h-[60vh]">
              {selectedBoss && (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedBoss}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Drops Principais:</h3>
                        <ul className="list-disc pl-4 space-y-1">
                          {bossDropData[selectedBoss].mainDrops.map((drop, index) => (
                            <li key={index}>
                              [{drop.quantity}] {drop.item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {bossDropData[selectedBoss].bonusDrops && (
                        <div>
                          <h3 className="font-semibold mb-2">
                            Bonus Drop ({bossDropData[selectedBoss].bonusChance}%):
                          </h3>
                          <ul className="list-disc pl-4 space-y-1">
                            {bossDropData[selectedBoss].bonusDrops?.map((drop, index) => (
                              <li key={index}>
                                [{drop.quantity}] {drop.item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
