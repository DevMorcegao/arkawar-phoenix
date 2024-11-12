"use [v0-no-op-code-block-prefix]client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { db, auth } from "@/lib/firebase"
import { collection, getDocs, query, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { UserInfo } from "firebase/auth"
import { Shield, Trash2, UserPlus } from "lucide-react"

interface FirebaseUser extends UserInfo {
  role?: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<FirebaseUser[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const usersQuery = query(collection(db, "users"))
    const usersSnapshot = await getDocs(usersQuery)
    const fetchedUsers: FirebaseUser[] = usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as FirebaseUser))
    
    // Add the current user if they're not in the database
    const currentUser = auth.currentUser
    if (currentUser && !fetchedUsers.some(user => user.uid === currentUser.uid)) {
      fetchedUsers.push({
        ...currentUser,
        role: 'admin'
      })
    }
    
    setUsers(fetchedUsers)
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await updateDoc(doc(db, "users", userId), {
      role: newRole
    })
    fetchUsers()
  }

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId))
    fetchUsers()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Painel Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <h2 className="text-xl font-semibold mb-4">Usuários</h2>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.uid} className="flex justify-between items-center p-2 bg-secondary rounded-md">
              <div className="flex items-center space-x-2">
                <span>{user.displayName || user.email}</span>
                {user.role === 'admin' && <Shield className="h-4 w-4 text-primary" />}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleUserRole(user.uid, user.role || 'user')}
                >
                  {user.role === 'admin' ? <UserPlus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteUser(user.uid)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}