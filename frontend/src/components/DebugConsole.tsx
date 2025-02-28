import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Collapse, 
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import ClearAllIcon from '@mui/icons-material/ClearAll';

// Tipo para representar diferentes tipos de log
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Interface para um item de log
interface LogItem {
  message: string;
  level: LogLevel;
  timestamp: Date;
  data?: any;
}

// Componente principal
const DebugConsole: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  // Sobrescrever os métodos de console para capturar logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const originalConsoleDebug = console.debug;
    
    console.log = (...args) => {
      originalConsoleLog(...args);
      addLog('info', args);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      addLog('warn', args);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      addLog('error', args);
    };
    
    console.debug = (...args) => {
      originalConsoleDebug(...args);
      addLog('debug', args);
    };
    
    // Cleanup - restaurar métodos originais do console
    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.debug = originalConsoleDebug;
    };
  }, []);
  
  // Função para adicionar um novo log
  const addLog = (level: LogLevel, args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    const data = args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined;
    
    setLogs(prevLogs => [
      ...prevLogs,
      {
        message,
        level,
        timestamp: new Date(),
        data
      }
    ]);
  };
  
  // Limpar todos os logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Função para obter a cor com base no nível de log
  const getColorForLevel = (level: LogLevel): string => {
    switch (level) {
      case 'info': return '#1976d2';
      case 'warn': return '#ed6c02';
      case 'error': return '#d32f2f';
      case 'debug': return '#2e7d32';
      default: return '#666666';
    }
  };
  
  return (
    <>
      {/* Botão para abrir o console */}
      <IconButton 
        onClick={() => setOpen(true)}
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          backgroundColor: '#f5f5f5',
          boxShadow: 3,
          '&:hover': {
            backgroundColor: '#e0e0e0'
          }
        }}
      >
        <BugReportIcon />
      </IconButton>
      
      {/* Console de depuração */}
      <Collapse in={open}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            left: 0,
            height: '40vh',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 5
          }}
        >
          {/* Cabeçalho */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f5f5f5'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CodeIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Console de Depuração</Typography>
            </Box>
            <Box>
              <Button 
                startIcon={<ClearAllIcon />} 
                size="small"
                onClick={clearLogs}
                sx={{ mr: 1 }}
              >
                Limpar
              </Button>
              <IconButton size="small" onClick={() => setOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          
          {/* Área de logs */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto',
            backgroundColor: '#f8f8f8', 
            p: 1
          }}>
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                Nenhum log capturado
              </Typography>
            ) : (
              <Box component="pre" sx={{ margin: 0 }}>
                {logs.map((log, index) => (
                  <Box key={index} component="div" sx={{ mb: 0.5 }}>
                    <Typography component="span" sx={{ color: '#BBBBFF' }}>
                      {log.timestamp.toLocaleTimeString()}:
                    </Typography>{' '}
                    <Typography component="span" sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem'
                    }}>
                      {log.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default DebugConsole;
