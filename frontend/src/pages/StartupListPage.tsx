import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { startupApi } from '../services/api';
import { Startup } from '../types';

const StartupListPage: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        setLoading(true);
        const data = await startupApi.getAll();
        setStartups(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar startups:', err);
        setError('Não foi possível carregar as startups. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchStartups();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta startup?')) {
      try {
        await startupApi.delete(id);
        setStartups(startups.filter(startup => startup.id !== id));
      } catch (err) {
        console.error('Erro ao excluir startup:', err);
        setError('Não foi possível excluir a startup. Por favor, tente novamente mais tarde.');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Startups
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={RouterLink} 
          to="/startups/new"
          startIcon={<AddIcon />}
        >
          Nova Startup
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
      ) : startups.length === 0 ? (
        <Alert severity="info">
          Nenhuma startup cadastrada. Clique em "Nova Startup" para adicionar.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>Nome</TableCell>
                <TableCell sx={{ color: 'white' }}>Setor</TableCell>
                <TableCell sx={{ color: 'white' }}>Descrição</TableCell>
                <TableCell sx={{ color: 'white' }}>Data de Criação</TableCell>
                <TableCell sx={{ color: 'white' }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {startups.map((startup) => (
                <TableRow key={startup.id} hover>
                  <TableCell>{startup.name}</TableCell>
                  <TableCell>{startup.sector || '-'}</TableCell>
                  <TableCell>{startup.description || '-'}</TableCell>
                  <TableCell>
                    {new Date(startup.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton 
                        component={RouterLink} 
                        to={`/startups/edit/${startup.id}`}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(startup.id)}
                      >
                        <DeleteIcon />
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

export default StartupListPage;
