import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { taskApi } from '../services/api';
import { Task } from '../types';

// Componente para mostrar o status da tarefa como um chip colorido
const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
  
  switch (status) {
    case 'PROCESSING':
      color = "warning";
      break;
    case 'COMPLETED':
      color = "success";
      break;
    case 'FAILED':
      color = "error";
      break;
    case 'CONSUMED':
      color = "info";
      break;
    default:
      color = "default";
  }
  
  return <Chip label={status} color={color} size="small" />;
};

// Componente para mostrar o tipo de arquivo de forma amigável
const FileTypeDisplay: React.FC<{ fileType: string }> = ({ fileType }) => {
  let displayName = fileType;
  
  switch (fileType) {
    case 'pitch-pdf':
      displayName = 'Pitch (PDF)';
      break;
    case 'pitch-txt':
      displayName = 'Notas do Pitch (TXT)';
      break;
    case 'pl-xlsx':
    case 'pl-xls':
    case 'pl-csv':
      displayName = 'Notas do P&L';
      break;
  }
  
  return <span>{displayName}</span>;
};

const TaskListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const data = await taskApi.getAll();
      
      // Ordenar por data de criação (mais recentes primeiro)
      const sortedTasks = [...data].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setTasks(sortedTasks);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      setError('Não foi possível carregar as tarefas. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tarefas de Análise
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchTasks}
          disabled={refreshing}
        >
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Alert severity="info">
          Nenhuma tarefa encontrada. Faça upload de documentos para criar novas tarefas.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>ID da Tarefa</TableCell>
                <TableCell sx={{ color: 'white' }}>Startup</TableCell>
                <TableCell sx={{ color: 'white' }}>Tipo de Arquivo</TableCell>
                <TableCell sx={{ color: 'white' }}>Nome do Arquivo</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Data de Criação</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.taskId} hover>
                  <TableCell>{task.taskId.slice(0, 8)}...</TableCell>
                  <TableCell>{task.startupId}</TableCell>
                  <TableCell>
                    <FileTypeDisplay fileType={task.fileType} />
                  </TableCell>
                  <TableCell>{task.fileName}</TableCell>
                  <TableCell>
                    <StatusChip status={task.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(task.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver Detalhes">
                      <IconButton 
                        component={RouterLink} 
                        to={`/tasks/${task.taskId}`}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TaskListPage;
