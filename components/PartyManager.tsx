/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, AlertCircle, Plus, Crown, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { where, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, doc } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast, Toaster } from 'react-hot-toast'
import { logger } from '@/lib/logger'

interface Character {
  id: string
  name: string
  class: string
  isMain: boolean
}

interface Party {
  id: string
  members: Character[]
  active?: boolean
  createdAt?: Date
  createdBy?: string
  updatedAt?: Date
}

interface LogEntry {
  id: string
  userId: string
  userName: string
  action: string
  timestamp: Date | null
  cleared: boolean
}

interface PartyDocument {
  id: string
  members: Character[]
  active: boolean
  createdAt: Date
  createdBy: string
  updatedAt: Date
}

const classAbbreviations = [
  "SM", "BK", "AE", "EE", "SUM", "IK", "GL", "KD", "LM", "GC", "SL", "ARF", "EMG", "SMG", "RW", "DL"
]

export default function PartyManager() {
  const [parties, setParties] = useState<Party[]>([])
  const [availableChars, setAvailableChars] = useState<Character[]>([])
  const [error, setError] = useState<string>("")
  const [newCharName, setNewCharName] = useState("")
  const [newCharClass, setNewCharClass] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isEditMode, setIsEditMode] = useState(false) // Inicializa como false para mostrar "Editar Parties" primeiro
  const [importText, setImportText] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    fetchLogs()
    fetchRegisteredParties()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      clearLogs()
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    if (!user) return
    
    const logsQuery = query(
      collection(db, "logs"), 
      where("cleared", "==", false),
      orderBy("timestamp", "desc")
    )

    const logsSnapshot = await getDocs(logsQuery)
    const fetchedLogs: LogEntry[] = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        cleared: data.cleared
      };
    })
    setLogs(fetchedLogs)
  }

  const fetchRegisteredParties = async () => {
    if (!user) return

    const partiesQuery = query(
      collection(db, "parties"),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    )

    try {
      const partiesSnapshot = await getDocs(partiesQuery)
      const fetchedParties: Party[] = []
      const availableCharacters: Character[] = []
      
      partiesSnapshot.docs.forEach(doc => {
        const data = doc.data() as PartyDocument
        if (data.members && data.members.length > 0) {
          fetchedParties.push({
            id: `party-${fetchedParties.length + 1}`, // Gera um novo ID sequencial
            members: data.members,
            active: data.active,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            updatedAt: data.updatedAt
          })
        } else {
          data.members.forEach((member: Character) => {
            availableCharacters.push(member)
          })
        }
      })

      if (fetchedParties.length > 0) {
        setParties(fetchedParties)
        setIsEditMode(false)
      }
      
      if (availableCharacters.length > 0) {
        setAvailableChars(availableCharacters)
      }
    } catch (error) {
      logger.error('PartyManager', 'Error fetching parties', { error })
      setError("Erro ao carregar as parties. Por favor, tente novamente.")
    }
  }

  const addLogEntry = async (action: string) => {
    if (!user) return

    const logEntry = {
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown User",
      action,
      timestamp: serverTimestamp(),
      cleared: false
    }

    await addDoc(collection(db, "logs"), logEntry)
    fetchLogs()
  }

  const clearLogs = async () => {
    const batch = writeBatch(db)
    
    logs.forEach(log => {
      const logRef = doc(db, "logs", log.id)
      batch.update(logRef, { cleared: true })
    })
    
    await batch.commit()
    setLogs([])
  }

  const validateParty = (party: Party) => {
    const hasEE = party.members.some(member => member.class === "EE")
    const hasSM = party.members.some(member => member.class === "SM")
    
    if (party.members.length > 5) {
      return "Party não pode ter mais de 5 membros"
    }
    
    if (!hasEE && !hasSM) {
      return "Faltam EE e SM nesta party"
    } else if (!hasEE) {
      return "Falta EE nesta party"
    } else if (!hasSM) {
      return "Falta SM nesta party"
    }
    return null
  }

  const onDragEnd = (result: any) => {
    const { source, destination } = result
  
    // If there's no destination, the item was dropped outside a valid droppable area
    if (!destination) return
  
    const sourceParty = source.droppableId === "available" 
      ? { id: "available", members: availableChars }
      : parties.find(p => p.id === source.droppableId)
  
    const destParty = destination.droppableId === "available"
      ? { id: "available", members: availableChars }
      : parties.find(p => p.id === destination.droppableId)
  
    if (!sourceParty || !destParty) return
  
    // If the source and destination are the same, and the indices are the same, nothing to do
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
  
    // Create new arrays to avoid mutating state directly
    const newSourceMembers = Array.from(sourceParty.members)
    const newDestMembers = Array.from(destParty.members)
  
    // Remove the dragged item from the source
    const [movedMember] = newSourceMembers.splice(source.index, 1)
  
    // Insert the dragged item into the destination
    newDestMembers.splice(destination.index, 0, movedMember)
  
    // Ensure no duplicates in the destination
    const uniqueDestMembers = Array.from(new Set(newDestMembers.map(m => m.id))).map(id => 
      newDestMembers.find(m => m.id === id)
    ).filter((m): m is Character => m !== undefined)
  
    // Update the state based on where the item was dragged from and to
    if (source.droppableId === "available") {
      setAvailableChars(newSourceMembers)
    } else {
      setParties(prev => prev.map(party => 
        party.id === source.droppableId ? { ...party, members: newSourceMembers } : party
      ))
    }
  
    if (destination.droppableId === "available") {
      setAvailableChars(uniqueDestMembers)
    } else {
      setParties(prev => prev.map(party =>
        party.id === destination.droppableId ? { ...party, members: uniqueDestMembers } : party
      ))
    }
  
    // If the character was moved to a different party, remove it from the source party
    if (source.droppableId !== destination.droppableId) {
      if (source.droppableId === "available") {
        setAvailableChars(prev => prev.filter(char => char.id !== movedMember.id))
      } else {
        setParties(prev => prev.map(party =>
          party.id === source.droppableId ? { ...party, members: party.members.filter(char => char.id !== movedMember.id) } : party
        ))
      }
    }
  
    addLogEntry(`Moved ${movedMember.name} from ${sourceParty.id} to ${destParty.id}`)
  }

  const autoOrganizeParties = () => {
    const allChars = [...availableChars]
    let newParties = [...parties]
    
    // If there are no parties, create 6 empty ones
    if (newParties.length === 0) {
      for (let i = 0; i < 6; i++) {
        newParties.push({ id: `party-${i + 1}`, members: [] })
      }
    }
    
    // Clear existing parties
    newParties = newParties.map(party => ({ ...party, members: [] }))
    
    // Find the MAIN (DL) character
    const mainDLIndex = allChars.findIndex(char => char.isMain && char.class === "DL")
    
    if (mainDLIndex !== -1) {
      // If there's a main DL, add it to the first party
      const mainChar = allChars.splice(mainDLIndex, 1)[0]
      newParties[0].members.push(mainChar)
      
      // Prioritize EE, SM, KD, BK for main party
      const priorityClasses = ["EE", "SM", "KD", "BK"]
      priorityClasses.forEach(className => {
        const charIndex = allChars.findIndex(char => char.class === className)
        if (charIndex !== -1) {
          newParties[0].members.push(allChars.splice(charIndex, 1)[0])
        }
      })
    }
  
    // Organize remaining parties
    newParties.forEach((party, index) => {
      if (index === 0 && party.members.length > 0) return // Skip main party if it's already organized
  
      // Add EE
      const eeIndex = allChars.findIndex(char => char.class === "EE")
      if (eeIndex !== -1) {
        party.members.push(allChars.splice(eeIndex, 1)[0])
      }
  
      // Add SM
      const smIndex = allChars.findIndex(char => char.class === "SM")
      if (smIndex !== -1) {
        party.members.push(allChars.splice(smIndex, 1)[0])
      }
  
      // Add KD if available (and avoid SUM if KD is present)
      const kdIndex = allChars.findIndex(char => char.class === "KD")
      if (kdIndex !== -1) {
        party.members.push(allChars.splice(kdIndex, 1)[0])
      }
  
      // Fill remaining slots
      while (party.members.length < 5 && allChars.length > 0) {
        let nextCharIndex = -1
        
        if (party.members.some(member => member.class === "KD")) {
          // If party has KD, avoid adding SUM unless no other option
          nextCharIndex = allChars.findIndex(char => 
            char.class !== "SUM" && !["EE", "SM", "KD"].includes(char.class)
          )
        }
        
        if (nextCharIndex === -1) {
          nextCharIndex = allChars.findIndex(char => 
            !["EE", "SM", "KD"].includes(char.class)
          )
        }
  
        if (nextCharIndex !== -1) {
          party.members.push(allChars.splice(nextCharIndex, 1)[0])
        } else {
          const nextChar = allChars.shift()
          if (nextChar) {
            party.members.push(nextChar)
          }
        }
      }
    })
  
    setParties(newParties)
    setAvailableChars(allChars)
    addLogEntry("Auto-organized parties")
  }

  const addNewCharacter = () => {
    if (newCharName && newCharClass) {
      if (availableChars.some(char => char.name.toLowerCase() === newCharName.toLowerCase())) {
        toast.error("Um personagem com este nome já existe.", { duration: 5000, });
        return;
      }
      const newChar: Character = {
        id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newCharName,
        class: newCharClass,
        isMain: newCharClass === "DL" && !availableChars.some(char => char.isMain)
      }
      setAvailableChars(prev => [...prev, newChar])
      setNewCharName("")
      setNewCharClass("")
      addLogEntry(`Added new character: ${newChar.name} (${newChar.class})`)
      toast.success(`Personagem ${newChar.name} adicionado com sucesso!`, { duration: 5000, })
    }
  }


  const removeCharacter = (charId: string, partyId: string) => {
    if (partyId === "available") {
      setAvailableChars(prev => prev.filter(char => char.id !== charId))
    } else {
      const removedChar = parties.find(party => party.id === partyId)
        ?.members.find(char => char.id === charId)
      
      if (removedChar) {
        setAvailableChars(prev => [...prev, removedChar])
        setParties(prev => prev.map(party => 
          party.id === partyId
            ? { ...party, members: party.members.filter(char => char.id !== charId) }
            : party
        ))
      }
    }
    addLogEntry(`Removed character ${charId} from ${partyId}`)
  }

  const addNewParty = () => {
    if (parties.length < 6) {
      const partyNumber = parties.length + 1
      const newParty: Party = {
        id: `party-${partyNumber}`,
        members: []
      }
      setParties(prev => [...prev, newParty])
      addLogEntry(`Added new party: ${newParty.id}`)
      toast.success(`Nova party ${partyNumber} adicionada!`, { duration: 5000, })
    } else {
      toast.error("Máximo de 6 parties atingido", { duration: 5000, })
    }
  }


  const registerParties = async () => {
    if (!user) return

    const batch = writeBatch(db)
    
    // Marca parties antigas como inativas
    const oldPartiesQuery = query(
      collection(db, "parties"),
      where("active", "==", true)
    )
    
    const oldPartiesSnapshot = await getDocs(oldPartiesQuery)
    oldPartiesSnapshot.docs.forEach(partyDoc => {
      batch.update(doc(db, "parties", partyDoc.id), { 
        active: false,
        updatedAt: serverTimestamp()
      })
    })
    
    // Adiciona novas parties
    parties.forEach(party => {
      const partyRef = doc(collection(db, "parties"))
      batch.set(partyRef, {
        members: party.members,
        active: true,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
    setIsEditMode(false)
    addLogEntry("Parties registered")
  }

  const editParties = () => {
    setIsEditMode(true)
    addLogEntry("Parties editing mode activated")
  }

  const importCharacters = () => {
    const lines = importText.split('\n');
    const newChars: Character[] = lines
      .map(line => {
        const [classAbbr, name] = line.split('-').map(s => s.trim());
        
        // Handle "Main" prefix
        if (classAbbr.toLowerCase() === 'main') {
          return {
            id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            class: 'DL',
            isMain: true
          };
        }
        
        if (classAbbr && name && classAbbreviations.includes(classAbbr)) {
          return {
            id: `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            class: classAbbr,
            isMain: false
          };
        }
        return null;
      })
      .filter((char): char is Character => char !== null);

    // Check for duplicate names before adding
    const uniqueNewChars = newChars.filter(newChar => 
      !availableChars.some(existingChar => existingChar.name.toLowerCase() === newChar.name.toLowerCase())
    );

    setAvailableChars(prev => [...prev, ...uniqueNewChars]);
    addLogEntry(`Imported ${uniqueNewChars.length} characters`);
    if (uniqueNewChars.length === 0) {
      toast.error("Nenhum novo personagem importado. Verifique por nomes duplicados ou formato incorreto.", { duration: 5000, });
    } else {
      toast.success(`${uniqueNewChars.length} personagens importados com sucesso!`, { duration: 5000, });
    }
    setIsImportDialogOpen(false);
    setImportText("");
  };

  const toggleMainCharacter = (charId: string) => {
    setAvailableChars(prev => prev.map(char => ({
      ...char,
      isMain: char.id === charId ? !char.isMain : false
    })));
  };

  const deleteParty = (partyId: string) => {
    const partyToDelete = parties.find(p => p.id === partyId);
    if (partyToDelete) {
      setAvailableChars(prev => [...prev, ...partyToDelete.members]);
      setParties(prev => prev.filter(p => p.id !== partyId));
      addLogEntry(`Deleted party: ${partyId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 rounded-lg">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 gap-4 bg-card rounded-lg p-6">
          <h1 className="text-3xl font-bold text-primary text-center">PT&apos;S ARKA WAR GUILD PHOENIX</h1>
          {isAdmin && (
            <>
              {isEditMode ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    onClick={autoOrganizeParties}
                    className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Auto-Organizar Parties
                  </Button>
                  <Button 
                    onClick={addNewParty}
                    className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Adicionar Nova Party
                  </Button>
                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                      >
                        Importar Personagens
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Importar Personagens</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Textarea
                          placeholder={`Importe a lista de personagens aqui, seguindo o exemplo:

CLASSE - NOME DO PERSONAGEM

Ex:

MAIN - Morcegao
SM - Pelesz
EE - TonEE
DL - DamiDL
BK - Safada1
KD - Tomberry`}
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          className="h-[200px]"
                        />
                        <Button onClick={importCharacters}>Importar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    onClick={registerParties}
                    className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Registrar Parties
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button 
                    onClick={editParties}
                    className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Editar Parties
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {error && <div className="text-red-500 text-center">{error}</div>}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parties.map((party) => (
              <Card key={party.id} className="bg-card min-w-[300px]">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex justify-between items-center">
                    <span>Party {party.id.replace("party-", "")}</span>
                    {validateParty(party) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{validateParty(party)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {isAdmin && isEditMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteParty(party.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={party.id} isDropDisabled={!isEditMode}>
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
                            isDragDisabled={!isEditMode}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 rounded-md flex justify-between items-center w-full ${
                                  member.isMain ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-muted'
                                }`}
                              >
                                <span className="flex items-center truncate mr-2 min-w-0 flex-1">
                                  <span className="truncate">{member.class} - {member.name}</span>
                                  {member.isMain && <Crown className="h-4 w-4 ml-2 flex-shrink-0 text-yellow-500" />}
                                </span>
                                {isAdmin && isEditMode && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0"
                                    onClick={() => removeCharacter(member.id, party.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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

          {availableChars.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Personagens Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="available" isDropDisabled={!isEditMode}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                    >
                      {availableChars.map((char, index) => (
                        <Draggable
                          key={char.id}
                          draggableId={char.id}
                          index={index}
                          isDragDisabled={!isEditMode}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                width: snapshot.isDragging ? '300px' : 'auto'
                              }}
                              className={`p-2 rounded-md flex justify-between items-center w-full ${
                                char.isMain ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-muted'
                              }`}
                            >
                              <span className="flex items-center truncate mr-2 min-w-0 flex-1">
                                <span className="truncate">{char.class} - {char.name}</span>
                                {char.isMain && <Crown className="h-4 w-4 ml-2 flex-shrink-0 text-yellow-500" />}
                              </span>
                              {isAdmin && isEditMode && (
                                <div className="flex space-x-1">
                                  {char.class === 'DL' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleMainCharacter(char.id)}
                                    >
                                      <Crown className={`h-4 w-4 ${char.isMain ? 'text-yellow-500' : 'text-gray-500'}`} />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCharacter(char.id, "available")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
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
          )}
        </DragDropContext>

        {isAdmin && isEditMode && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Adicionar Novo Personagem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="newCharName">Nome</Label>
                  <Input
                    id="newCharName"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="Nome do personagem"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="newCharClass">Classe</Label>
                  <Select value={newCharClass} onValueChange={setNewCharClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classAbbreviations.map((abbr) => (
                        <SelectItem key={abbr} value={abbr}>
                          {abbr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addNewCharacter} className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 mt-6">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Log de Atividades</CardTitle>
              <Button 
                variant="outline" 
                onClick={clearLogs}
                className="ml-2"
              >
                Limpar Logs
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log.id} className="text-sm">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Data não disponível"} - {log.userName}: {log.action}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}