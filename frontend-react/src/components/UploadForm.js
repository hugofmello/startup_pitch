import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_ENDPOINT = process.env.REACT_APP_API_URL || 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';

const UploadForm = () => {
  const [startups, setStartups] = useState([]);
  const [startupId, setStartupId] = useState('');
  const [fileType, setFileType] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ show: false, message: '', variant: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/startups`);
      if (response.data && Array.isArray(response.data)) {
        setStartups(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar startups:', error);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startupId || !fileType || !file) {
      setStatus({
        show: true,
        message: 'Por favor, preencha todos os campos e selecione um arquivo.',
        variant: 'danger'
      });
      return;
    }

    setLoading(true);
    setStatus({ show: true, message: 'Enviando arquivo...', variant: 'info' });

    try {
      // Converter arquivo para base64
      const base64File = await readFileAsBase64(file);
      
      const payload = {
        startupId,
        fileType,
        fileName: file.name,
        fileContent: base64File
      };

      const response = await axios.post(`${API_ENDPOINT}/upload`, payload);
      
      setStatus({
        show: true,
        message: `Arquivo enviado com sucesso! ID da tarefa: ${response.data.taskId}`,
        variant: 'success'
      });
      
      // Limpar formulário
      setStartupId('');
      setFileType('');
      setFile(null);
      document.getElementById('file').value = '';
      
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      setStatus({
        show: true,
        message: `Erro ao enviar arquivo: ${error.response?.data?.error || error.message}`,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remover prefixo "data:application/..." da string base64
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <Card>
      <Card.Header>
        <h2>Upload de Documento</h2>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Startup:</Form.Label>
            <Form.Select 
              value={startupId} 
              onChange={(e) => setStartupId(e.target.value)}
              required
            >
              <option value="">Selecione uma startup</option>
              {startups.map(startup => (
                <option key={startup.id} value={startup.id}>
                  {startup.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Tipo de Arquivo:</Form.Label>
            <Form.Select 
              value={fileType} 
              onChange={(e) => setFileType(e.target.value)}
              required
            >
              <option value="">Selecione o tipo de arquivo</option>
              <option value="pitch-pdf">Pitch Deck (PDF)</option>
              <option value="pitch-txt">Texto do Pitch (TXT)</option>
              <option value="pl-xlsx">Planilha Excel (XLSX)</option>
              <option value="pl-xls">Planilha Excel (XLS)</option>
              <option value="pl-csv">Planilha CSV</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Selecione o Arquivo:</Form.Label>
            <Form.Control 
              type="file" 
              id="file"
              onChange={handleFileChange}
              required
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </Form>
        
        {status.show && (
          <Alert 
            variant={status.variant} 
            className="mt-3"
            dismissible
            onClose={() => setStatus({ ...status, show: false })}
          >
            {status.message}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default UploadForm;
