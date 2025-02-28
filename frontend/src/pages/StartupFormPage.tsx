import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { startupApi } from '../services/api';
import { Startup } from '../types';

const StartupFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: '',
    website: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchStartup = async () => {
        try {
          setLoading(true);
          const data = await startupApi.getById(id);
          setFormData({
            name: data.name,
            description: data.description || '',
            sector: data.sector || '',
            website: data.website || ''
          });
          setError(null);
        } catch (err) {
          console.error('Erro ao buscar startup:', err);
          setError('Não foi possível carregar os dados da startup. Por favor, tente novamente mais tarde.');
        } finally {
          setLoading(false);
        }
      };

      fetchStartup();
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('O nome da startup é obrigatório');
      return;
    }
    
    try {
      setSaveLoading(true);
      
      if (isEditMode && id) {
        await startupApi.update(id, formData);
      } else {
        await startupApi.create(formData);
      }
      
      navigate('/startups');
    } catch (err) {
      console.error('Erro ao salvar startup:', err);
      setError('Não foi possível salvar a startup. Por favor, tente novamente mais tarde.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar Startup' : 'Nova Startup'}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/startups')}
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

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="name"
                name="name"
                label="Nome da Startup"
                value={formData.name}
                onChange={handleInputChange}
                variant="outlined"
                error={error?.includes('nome')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="sector"
                name="sector"
                label="Setor"
                value={formData.sector}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="website"
                name="website"
                label="Website"
                value={formData.website}
                onChange={handleInputChange}
                variant="outlined"
                placeholder="https://www.exemplo.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Descrição"
                value={formData.description}
                onChange={handleInputChange}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default StartupFormPage;
