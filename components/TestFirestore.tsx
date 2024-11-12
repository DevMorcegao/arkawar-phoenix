// 'use client';

// import React from 'react';
// import { doc, setDoc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { useAuth } from '@/contexts/AuthContext';
// import { Button } from '@/components/ui/button';

// const TestFirestore: React.FC = () => {
//   const { user } = useAuth();

//   const testCreateUser = async () => {
//     if (!user) {
//       console.error('Usuário não está autenticado');
//       return;
//     }

//     const userId = 'testUserId' + Date.now();
//     const userData = {
//       name: 'Test User',
//       email: 'test@example.com',
//       role: 'user',
//       status: 'pending',
//       createdAt: new Date(),
//       createdBy: user.uid, // Adiciona o ID do usuário que está criando
//     };
  
//     try {
//       console.log("Tentando criar usuário...");
//       console.log("ID do usuário autenticado:", user.uid);
      
//       await setDoc(doc(db, 'users', userId), userData);
//       console.log('Documento de teste criado com sucesso');
  
//       const userDoc = await getDoc(doc(db, 'users', userId));
//       if (userDoc.exists()) {
//         console.log('Documento de teste confirmado no Firestore:', userDoc.data());
//       } else {
//         console.error('Falha ao criar o documento de teste no Firestore');
//       }
//     } catch (error) {
//       console.error('Erro ao criar documento de teste:', error);
  
//       if (error instanceof Error) {
//         console.log("Detalhes do erro:", {
//           message: error.message,
//           stack: error.stack,
//           name: error.name
//         });
//       } else {
//         console.log("Erro de tipo desconhecido:", error);
//       }
//     }
//   };
  
//   return (
//     <div className="p-4">
//       <h2 className="text-lg font-semibold mb-4">Teste do Firestore</h2>
//       <Button 
//         onClick={testCreateUser}
//         disabled={!user}
//         variant="outline"
//       >
//         {user ? 'Criar Usuário de Teste' : 'Faça login para testar'}
//       </Button>
//     </div>
//   );
// };

// export default TestFirestore;