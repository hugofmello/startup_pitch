import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';

const HomePage: React.FC = () => {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Bem-vindo à Plataforma de Integração Voldea
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Faça upload de documentos, gerencie startups e consulte análises da Voldea
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <BusinessIcon fontSize="large" color="primary" />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Gerenciar Startups
              </Typography>
              <Typography variant="body1" paragraph>
                Cadastre e gerencie suas startups para associá-las aos documentos enviados.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={RouterLink} 
                to="/startups"
                startIcon={<BusinessIcon />}
              >
                Ver Startups
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CloudUploadIcon fontSize="large" color="primary" />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Upload de Documentos
              </Typography>
              <Typography variant="body1" paragraph>
                Envie arquivos PDF, Excel e TXT para análise pela API da Voldea.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={RouterLink} 
                to="/upload"
                startIcon={<CloudUploadIcon />}
              >
                Fazer Upload
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <AssignmentIcon fontSize="large" color="primary" />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Consultar Tarefas
              </Typography>
              <Typography variant="body1" paragraph>
                Visualize as tarefas enviadas e consulte os resultados das análises.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                component={RouterLink} 
                to="/tasks"
                startIcon={<AssignmentIcon />}
              >
                Ver Tarefas
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
