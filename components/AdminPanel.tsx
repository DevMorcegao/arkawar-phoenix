"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc, DocumentData } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface User {
  id: string
  name: string
  email: string
  status: "pending" | "approved" | "rejected"
  role: "user" | "admin"
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    const q = query(collection(db, "users"), where("status", "==", "pending"))
    const querySnapshot = await getDocs(q)
    const fetchedUsers: User[] = []
    querySnapshot.forEach((doc: DocumentData) => {
      fetchedUsers.push({ id: doc.id, ...doc.data() } as User)
    })
    setUsers(fetchedUsers)
  }

  const handleApprove = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), {
      status: "approved"
    })
    fetchUsers()
  }

  const handleReject = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), {
      status: "rejected"
    })
    fetchUsers()
  }

  const handlePromote = async (userId: string) => {
    await updateDoc(doc(db, "users", userId), {
      role: "admin"
    })
    fetchUsers()
  }

  if (!isAdmin) {
    return <div>Acesso não autorizado</div>
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Painel de Administração</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>
                  <div className="space-x-2">
                    <Button onClick={() => handleApprove(user.id)} variant="outline" size="sm">
                      Aprovar
                    </Button>
                    <Button onClick={() => handleReject(user.id)} variant="outline" size="sm">
                      Rejeitar
                    </Button>
                    {user.role !== "admin" && (
                      <Button onClick={() => handlePromote(user.id)} variant="outline" size="sm">
                        Promover a Admin
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}