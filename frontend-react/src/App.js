import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import UploadForm from './components/UploadForm';
import TasksList from './components/TasksList';
import StartupsManagement from './components/StartupsManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">Voldea - Startups</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Upload</Nav.Link>
                <Nav.Link as={Link} to="/tasks">Tarefas</Nav.Link>
                <Nav.Link as={Link} to="/startups">Startups</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <header className="app-header">
            <h1>Voldea - Integração de Startups</h1>
            <p className="lead">Processe e consulte documentos de startups</p>
          </header>

          <Routes>
            <Route path="/" element={<UploadForm />} />
            <Route path="/tasks" element={<TasksList />} />
            <Route path="/startups" element={<StartupsManagement />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
