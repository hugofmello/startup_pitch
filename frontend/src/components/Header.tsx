import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Voldea Integration
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">
            Início
          </Button>
          <Button color="inherit" component={RouterLink} to="/startups">
            Startups
          </Button>
          <Button color="inherit" component={RouterLink} to="/upload">
            Upload
          </Button>
          <Button color="inherit" component={RouterLink} to="/tasks">
            Tarefas
          </Button>
          <Button color="inherit" component={RouterLink} to="/api-test">
            Testar API
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
