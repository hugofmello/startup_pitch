import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

// Componentes
import Header from './components/Header';
import Footer from './components/Footer';
import DebugConsole from './components/DebugConsole';

// Páginas
import HomePage from './pages/HomePage';
import StartupListPage from './pages/StartupListPage';
import StartupFormPage from './pages/StartupFormPage';
import UploadPage from './pages/UploadPage';
import TaskListPage from './pages/TaskListPage';
import TaskDetailPage from './pages/TaskDetailPage';
import ApiTestPage from './pages/ApiTestPage';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/startups" element={<StartupListPage />} />
          <Route path="/startups/new" element={<StartupFormPage />} />
          <Route path="/startups/edit/:id" element={<StartupFormPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/api-test" element={<ApiTestPage />} />
        </Routes>
      </Container>
      <Footer />
      
      {/* Console de depuração - apenas em ambiente de desenvolvimento */}
      {process.env.NODE_ENV === 'development' && <DebugConsole />}
    </Box>
  );
}

export default App;
