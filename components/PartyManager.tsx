"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, AlertCircle } from "lucide-react"

interface Character {
  id: string
  name: string
  class: string
  isMain?: boolean
}

interface Party {
  id: string
  members: Character[]
}

export default function PartyManager() {
  const [parties, setParties] = useState<Party[]>([])
  const [availableChars, setAvailableChars] = useState<Character[]>([])
  const [error, setError] = useState<string>("")

  const validateParty = (party: Party) => {
    const hasEE = party.members.some(member => member.class === "EE")
    const hasSM = party.members.some(member => member.class === "SM")
    
    if (!hasEE || !hasSM) {
      return `Party ${party.id} necessita de EE e SM`
    }
    return null
  }

  const onDragEnd = (result: any) => {
    const { source, destination } = result

    if (!destination) return

    const sourceParty = source.droppableId === "available" 
      ? { id: "available", members: availableChars }
      : parties.find(p => p.id === source.droppableId)

    const destParty = destination.droppableId === "available"
      ? { id: "available", members: availableChars }
      : parties.find(p => p.id === destination.droppableId)

    if (!sourceParty || !destParty) return

    const sourceMember = sourceParty.members[source.index]
    const newSourceMembers = [...sourceParty.members]
    newSourceMembers.splice(source.index, 1)

    const newDestMembers = [...destParty.members]
    newDestMembers.splice(destination.index, 0, sourceMember)

    if (source.droppableId === "available") {
      setAvailableChars(newSourceMembers)
    } else {
      setParties(prev => prev.map(p => 
        p.id === source.droppableId ? { ...p, members: newSourceMembers } : p
      ))
    }

    if (destination.droppableId === "available") {
      setAvailableChars(newDestMembers)
    } else {
      setParties(prev => prev.map(p =>
        p.id === destination.droppableId ? { ...p, members: newDestMembers } : p
      ))
    }
  }

  const autoOrganizeParties = () => {
    const allChars = [...availableChars]
    const newParties: Party[] = []
    
    // Primeiro, encontrar o MAIN (DL)
    const mainIndex = allChars.findIndex(char => char.isMain)
    if (mainIndex !== -1) {
      const mainParty = {
        id: `party-${newParties.length + 1}`,
        members: [allChars[mainIndex]]
      }
      allChars.splice(mainIndex, 1)
      newParties.push(mainParty)
    }

    // Organizar as parties restantes
    while (allChars.length > 0 && newParties.length < 6) {
      const party: Party = {
        id: `party-${newParties.length + 1}`,
        members: []
      }

      // Adicionar EE
      const eeIndex = allChars.findIndex(char => char.class === "EE")
      if (eeIndex !== -1) {
        party.members.push(allChars[eeIndex])
        allChars.splice(eeIndex, 1)
      }

      // Adicionar SM
      const smIndex = allChars.findIndex(char => char.class === "SM")
      if (smIndex !== -1) {
        party.members.push(allChars[smIndex])
        allChars.splice(smIndex, 1)
      }

      // Completar party até 5 membros
      while (party.members.length < 5 && allChars.length > 0) {
        const nextChar = allChars.shift()
        if (nextChar) {
          party.members.push(nextChar)
        }
      }

      newParties.push(party)
    }

    setParties(newParties)
    setAvailableChars(allChars)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">PT&apos;S ARKA WAR GUILD PHOENIX</h1>
          <Button onClick={autoOrganizeParties}>Auto-Organizar Parties</Button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parties.map((party) => (
              <Card key={party.id} className="bg-card">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex justify-between items-center">
                    <span>Party {party.id.split("-")[1]}</span>
                    {validateParty(party) && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={party.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[200px] space-y-2"
                      >
                        {party.members.map((member, index) => (
                          <Draggable
                            key={member.id}
                            draggableId={member.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-2 bg-muted rounded-md flex justify-between items-center"
                              >
                                <span>
                                  {member.class} - {member.name}
                                  {member.isMain && " (MAIN)"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setAvailableChars(prev => [...prev, member])
                                    setParties(prev =>
                                      prev.map(p =>
                                        p.id === party.id
                                          ? {
                                              ...p,
                                              members: p.members.filter(
                                                m => m.id !== member.id
                                              ),
                                            }
                                          : p
                                      )
                                    )
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Personagens Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <Droppable droppableId="available">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
                  >
                    {availableChars.map((char, index) => (
                      <Draggable
                        key={char.id}
                        draggableId={char.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-2 bg-muted rounded-md text-sm"
                          >
                            {char.class} - {char.name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </DragDropContext>
      </div>
    </div>
  )
}