import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const API_ENDPOINT = process.env.REACT_APP_API_URL || 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
    // Atualizar a cada minuto
    const interval = setInterval(fetchTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINT}/tasks`);
      if (response.data && Array.isArray(response.data)) {
        setTasks(response.data);
      }
      setError('');
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      setError('Erro ao carregar tarefas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/tasks/${taskId}`);
      if (response.data) {
        setSelectedTask(response.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error(`Erro ao buscar detalhes da tarefa ${taskId}:`, error);
      alert(`Erro ao buscar detalhes da tarefa: ${error.response?.data?.error || error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PROCESSING':
        return <Badge bg="warning">Processando</Badge>;
      case 'COMPLETED':
        return <Badge bg="success">Concluído</Badge>;
      case 'ERROR':
        return <Badge bg="danger">Erro</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const renderResultCategories = (result) => {
    if (!result?.categories) return null;

    const categories = JSON.parse(result.response).categories;
    
    return (
      <Table striped bordered hover size="sm" className="mt-3">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Nota</th>
            <th>Insights</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(categories).map(([key, category]) => (
            <tr key={key}>
              <td>{category['category-name']}</td>
              <td>{category['category-grade']}</td>
              <td>
                <ul className="mb-0">
                  {category.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Tarefas</h2>
          <Button 
            variant="primary" 
            onClick={fetchTasks} 
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </Card.Header>
        <Card.Body>
          {error ? (
            <div className="alert alert-danger">{error}</div>
          ) : tasks.length === 0 ? (
            <p>Nenhuma tarefa encontrada.</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID da Tarefa</th>
                  <th>ID da Startup</th>
                  <th>Tipo de Arquivo</th>
                  <th>Nome do Arquivo</th>
                  <th>Status</th>
                  <th>Data de Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.taskId}>
                    <td>{task.taskId}</td>
                    <td>{task.startupId}</td>
                    <td>{task.fileType}</td>
                    <td>{task.fileName}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>{new Date(task.createdAt).toLocaleString()}</td>
                    <td>
                      <Button 
                        variant="info" 
                        size="sm" 
                        onClick={() => fetchTaskDetails(task.taskId)}
                      >
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da Tarefa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask ? (
            <div>
              <h4>Informações da Tarefa</h4>
              <Table bordered>
                <tbody>
                  <tr>
                    <th>ID da Tarefa</th>
                    <td>{selectedTask.taskId}</td>
                  </tr>
                  <tr>
                    <th>ID da Startup</th>
                    <td>{selectedTask.startupId}</td>
                  </tr>
                  <tr>
                    <th>Tipo de Arquivo</th>
                    <td>{selectedTask.fileType}</td>
                  </tr>
                  <tr>
                    <th>Nome do Arquivo</th>
                    <td>{selectedTask.fileName}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>{getStatusBadge(selectedTask.status)}</td>
                  </tr>
                  <tr>
                    <th>URL do Arquivo</th>
                    <td>
                      <a href={selectedTask.fileUrl} target="_blank" rel="noopener noreferrer">
                        Visualizar Arquivo
                      </a>
                    </td>
                  </tr>
                </tbody>
              </Table>

              {selectedTask.result && (
                <div>
                  <h4 className="mt-4">Resultado da Análise</h4>
                  {renderResultCategories(selectedTask.result)}
                  
                  {selectedTask.result.meta && (
                    <p className="mt-3">
                      <strong>Probabilidade de Recomendação de Investimento:</strong>{' '}
                      {(JSON.parse(selectedTask.result.response)['Probability of Recommending Investing'] * 100).toFixed(2)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p>Carregando detalhes...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TasksList;
