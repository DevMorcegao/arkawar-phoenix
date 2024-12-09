'use client';

import React from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

const TestFirestore: React.FC = () => {
  const { user } = useAuth();

  const testCreateUser = async () => {
    if (!user) {
      logger.error('TestFirestore', 'Usuário não está autenticado');
      return;
    }

    const userId = 'testUserId' + Date.now();
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      status: 'pending',
      createdAt: new Date(),
      createdBy: user.uid,
    };
  
    try {
      logger.info('TestFirestore', 'Tentando criar usuário');
      logger.debug('TestFirestore', 'ID do usuário autenticado', { userId: user.uid });
      
      await setDoc(doc(db, 'users', userId), userData);
      logger.info('TestFirestore', 'Documento de teste criado com sucesso');
  
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        logger.debug('TestFirestore', 'Documento recuperado', { data: userDoc.data() });
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('TestFirestore', 'Detalhes do erro', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        logger.error('TestFirestore', 'Erro desconhecido', { error });
      }
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Teste do Firestore</h2>
      <Button 
        onClick={testCreateUser}
        disabled={!user}
        variant="outline"
      >
        {user ? 'Criar Usuário de Teste' : 'Faça login para testar'}
      </Button>
    </div>
  );
};

export default TestFirestore;