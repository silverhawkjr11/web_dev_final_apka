import { useContext } from 'react';
import { AuthContext } from '@/components/AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export the AuthContext for direct access if needed
export { AuthContext } from '@/components/AuthProvider';