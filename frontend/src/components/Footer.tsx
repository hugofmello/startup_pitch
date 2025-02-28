import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ py: 3, bgcolor: 'primary.main', color: 'white' }}>
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Voldea Integration. Todos os direitos reservados.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
