import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initSQLite,
  executeQuery,
  executeMutation,
  exportDatabaseBinary,
  importDatabaseBinary,
  getTableNames,
  resetDatabase,
} from '../services/sqliteService';
import { QueryResult } from '../types';

interface DbContextType {
  isReady: boolean;
  error: string | null;
  refreshSignal: number;
  triggerRefresh: () => void;
  runQuery: (sql: string, params?: any[]) => QueryResult;
  runMutation: (sql: string, params?: any[]) => void;
  exportBinary: () => Uint8Array;
  importBinary: (bytes: Uint8Array) => Promise<void>;
  getTables: () => string[];
  clearDatabase: () => Promise<void>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshSignal((prev) => prev + 1);
  }, []);

  useEffect(() => {
    initSQLite()
      .then(() => {
        setIsReady(true);
        triggerRefresh();
      })
      .catch((err) => {
        console.error('Failed to init SQLite', err);
        setError(err.message || 'SQLite initialization failed');
      });
  }, [triggerRefresh]);

  const runQuery = useCallback((sql: string, params?: any[]): QueryResult => {
    return executeQuery(sql, params);
  }, []);

  const runMutation = useCallback(
    (sql: string, params?: any[]) => {
      executeMutation(sql, params);
      triggerRefresh();
    },
    [triggerRefresh]
  );

  const exportBinary = useCallback((): Uint8Array => {
    return exportDatabaseBinary();
  }, []);

  const importBinary = useCallback(
    async (bytes: Uint8Array) => {
      await importDatabaseBinary(bytes);
      triggerRefresh();
    },
    [triggerRefresh]
  );

  const getTables = useCallback((): string[] => {
    return getTableNames();
  }, [refreshSignal]);

  const clearDatabase = useCallback(async () => {
    await resetDatabase();
    triggerRefresh();
  }, [triggerRefresh]);

  return (
    <DbContext.Provider
      value={{
        isReady,
        error,
        refreshSignal,
        triggerRefresh,
        runQuery,
        runMutation,
        exportBinary,
        importBinary,
        getTables,
        clearDatabase,
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb must be used within a DbProvider');
  return ctx;
};
