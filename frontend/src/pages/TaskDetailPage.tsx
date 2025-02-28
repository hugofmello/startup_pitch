import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { taskApi } from '../services/api';
import { Task } from '../types';
import CategoryCard from '../components/CategoryCard';

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
  
  return <Chip label={status} color={color} />;
};

// Componente para converter a nota da categoria (A, B+, etc) para valor numérico para o Rating
const gradeToRating = (grade: string): number => {
  const gradeMap: Record<string, number> = {
    'A+': 5.0,
    'A': 4.5,
    'A-': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'B-': 2.5,
    'C+': 2.0,
    'C': 1.5,
    'C-': 1.0,
    'D': 0.5
  };

  return gradeMap[grade] || 0;
};

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await taskApi.getById(id);
        setTask(data);
        
        // Se há resultado na resposta e o status é COMPLETED ou CONSUMED
        if ((data.status === 'COMPLETED' || data.status === 'CONSUMED') && data.result) {
          let parsedResult;
          if (typeof data.result === 'string') {
            try {
              parsedResult = JSON.parse(data.result);
            } catch (e) {
              parsedResult = data.result;
            }
          } else {
            parsedResult = data.result;
          }
          setResult(parsedResult);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar detalhes da tarefa:', err);
        setError('Não foi possível carregar os detalhes da tarefa. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
    
    // Configurar atualização automática se a tarefa estiver em processamento
    let intervalId: NodeJS.Timeout;
    
    if (task && task.status === 'PROCESSING') {
      intervalId = setInterval(() => {
        console.log('Atualizando status da tarefa em processamento...');
        fetchTaskDetails();
      }, 10000); // Atualizar a cada 10 segundos
    }
    
    // Limpar intervalo quando o componente for desmontado ou quando o status mudar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [id, task?.status]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box>
        <Alert severity="error">
          Tarefa não encontrada ou ID inválido.
        </Alert>
        <Button 
          sx={{ mt: 2 }}
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tasks')}
        >
          Voltar para Lista de Tarefas
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Detalhes da Tarefa
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/tasks')}
          startIcon={<ArrowBackIcon />}
        >
          Voltar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              ID da Tarefa
            </Typography>
            <Typography variant="body1" gutterBottom>
              {task.taskId}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              Status
            </Typography>
            <StatusChip status={task.status} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              Startup ID
            </Typography>
            <Typography variant="body1" gutterBottom>
              {task.startupId}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              Data de Criação
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(task.createdAt).toLocaleString('pt-BR')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              Tipo de Arquivo
            </Typography>
            <Typography variant="body1" gutterBottom>
              {task.fileType === 'pitch-pdf' ? 'Pitch (PDF)' : 
               task.fileType === 'pitch-txt' ? 'Notas do Pitch (TXT)' : 
               'Notas do P&L'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">
              Nome do Arquivo
            </Typography>
            <Typography variant="body1" gutterBottom>
              {task.fileName}
            </Typography>
          </Grid>
          {task.fileUrl && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="text.secondary">
                URL do Arquivo
              </Typography>
              <Typography variant="body1" gutterBottom component="div" sx={{ wordBreak: 'break-all' }}>
                <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">
                  {task.fileUrl}
                </a>
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Exibir resultados da análise se disponíveis */}
      {(task.status === 'COMPLETED' || task.status === 'CONSUMED') && result && (
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Resultados da Análise
          </Typography>
          
          {result.categories && (
            <Box>
              <Grid container spacing={3}>
                {Object.values(result.categories).map((category: any, index: number) => (
                  <Grid item xs={12} md={6} key={index}>
                    <CategoryCard category={category} />
                  </Grid>
                ))}
              </Grid>
              
              {result['Probability of Recommending Investing'] !== undefined && (
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Probabilidade de Recomendação de Investimento
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          background: `linear-gradient(90deg, #4caf50 0%, #ffeb3b 50%, #f44336 100%)`,
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            height: 15,
                            width: 15,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            top: -2,
                            left: `${result['Probability of Recommending Investing'] * 100}%`,
                            transform: 'translateX(-50%)',
                            border: '2px solid white'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="h5" color="primary" sx={{ minWidth: 65, textAlign: 'right' }}>
                      {(result['Probability of Recommending Investing'] * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
          
          {!result.categories && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">
                Os resultados detalhados da análise não estão disponíveis no formato esperado.
              </Alert>
              <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Dados brutos:
                </Typography>
                <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '400px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      )}

      {task.status === 'PROCESSING' && (
        <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: '#fff9c4', borderRadius: 2 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="h6">
            Análise em processamento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aguarde enquanto a API da Voldea processa o documento. Este processo pode levar alguns minutos.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Atualizar Status
          </Button>
        </Box>
      )}

      {task.status === 'FAILED' && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">
            O processamento desta tarefa falhou. Por favor, tente fazer o upload novamente.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default TaskDetailPage;
