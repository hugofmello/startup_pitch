import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_ENDPOINT = process.env.REACT_APP_API_URL || 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';

const StartupsManagement = () => {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentStartup, setCurrentStartup] = useState({
    id: '',
    name: '',
    description: '',
    segment: ''
  });

  // Função para buscar startups da API
  const fetchStartups = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINT}/startups`);
      setStartups(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar startups:', err);
      setError('Não foi possível carregar as startups. Verifique se a API está funcionando.');
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar startups ao montar o componente
  useEffect(() => {
    fetchStartups();
  }, []);

  // Abrir modal para adicionar nova startup
  const handleAddStartup = () => {
    setCurrentStartup({
      id: '',
      name: '',
      description: '',
      segment: ''
    });
    setEditMode(false);
    setShowModal(true);
  };

  // Abrir modal para editar startup existente
  const handleEditStartup = (startup) => {
    setCurrentStartup(startup);
    setEditMode(true);
    setShowModal(true);
  };

  // Atualizar campo do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentStartup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Salvar startup (criar ou atualizar)
  const handleSaveStartup = async () => {
    try {
      if (editMode) {
        await axios.put(`${API_ENDPOINT}/startups/${currentStartup.id}`, currentStartup);
      } else {
        const response = await axios.post(`${API_ENDPOINT}/startups`, currentStartup);
        const newStartup = response.data;
        setStartups(prev => [...prev, newStartup]);
      }
      
      setShowModal(false);
      fetchStartups(); // Recarregar dados após salvar
    } catch (err) {
      console.error('Erro ao salvar startup:', err);
      setError('Ocorreu um erro ao salvar a startup. Verifique se a API está funcionando.');
    }
  };

  // Excluir startup
  const handleDeleteStartup = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta startup?')) {
      try {
        await axios.delete(`${API_ENDPOINT}/startups/${id}`);
        setStartups(prev => prev.filter(startup => startup.id !== id));
      } catch (err) {
        console.error('Erro ao excluir startup:', err);
        setError('Ocorreu um erro ao excluir a startup. Verifique se a API está funcionando.');
      }
    }
  };

  return (
    <Card className="my-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Gerenciamento de Startups</h4>
        <Button variant="primary" onClick={handleAddStartup}>Adicionar Startup</Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <p>Carregando startups...</p>
        ) : startups.length === 0 ? (
          <p>Nenhuma startup cadastrada.</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Segmento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {startups.map(startup => (
                <tr key={startup.id}>
                  <td>{startup.name}</td>
                  <td>{startup.description}</td>
                  <td>{startup.segment}</td>
                  <td>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditStartup(startup)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteStartup(startup.id)}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>

      {/* Modal para adicionar/editar startup */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Editar Startup' : 'Adicionar Startup'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={currentStartup.name} 
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                name="description"
                value={currentStartup.description} 
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Segmento</Form.Label>
              <Form.Control 
                type="text" 
                name="segment"
                value={currentStartup.segment} 
                onChange={handleChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveStartup}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default StartupsManagement;
