import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { startupApi, uploadApi } from '../services/api';
import { Startup, FileUploadData } from '../types';
import { toast } from 'react-toastify';

const ApiTestPage: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [corsTest, setCorsTest] = useState<{status: string, message: string} | null>(null);
  const [uploadTest, setUploadTest] = useState<{status: string, message: string} | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Função para adicionar mensagens de log
  const addLogMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    setLogMessages(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  // Teste de conexão com a API
  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    addLogMessage('Iniciando teste de conexão com a API...');
    
    try {
      // Testar a conexão com a API
      const data = await startupApi.getAll();
      setStartups(data);
      setTestResult('Conexão com a API bem-sucedida!');
      addLogMessage(`Conexão bem-sucedida! Recebido ${data.length} startups.`);
      toast.success('Conexão com a API estabelecida com sucesso!');
    } catch (err) {
      console.error('Erro ao testar conexão com API:', err);
      const errorMessage = 'Falha ao conectar com a API. Verifique se a API está disponível e configurada corretamente.';
      setError(errorMessage);
      addLogMessage(`Erro: ${errorMessage}`);
      toast.error('Falha na conexão com a API');
    } finally {
      setLoading(false);
    }
  };
  
  // Teste específico de CORS
  const testCorsPolicy = async () => {
    setCorsTest({ status: 'pending', message: 'Testando configuração de CORS...' });
    addLogMessage('Iniciando teste de configuração CORS...');
    
    try {
      // Usar diretamente a API remota em vez do proxy local
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const directResponse = await fetch(`${apiUrl}/cors-test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (directResponse.ok) {
        addLogMessage('Conexão com API remota bem-sucedida!');
      }

      // Fazer uma solicitação OPTIONS para verificar os cabeçalhos CORS
      const response = await fetch(`${apiUrl}/startups`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      // Verificar cabeçalhos CORS
      const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
      const allowMethods = response.headers.get('Access-Control-Allow-Methods');
      const allowHeaders = response.headers.get('Access-Control-Allow-Headers');
      
      addLogMessage(`Resposta da API: Origin=${allowOrigin}, Methods=${allowMethods}, Headers=${allowHeaders}`);
      
      if (allowOrigin && allowMethods && allowHeaders) {
        setCorsTest({
          status: 'success',
          message: `CORS configurado corretamente! 
            Allow-Origin: ${allowOrigin} 
            Allow-Methods: ${allowMethods} 
            Allow-Headers: ${allowHeaders}`
        });
        toast.success('CORS configurado corretamente!');
      } else {
        setCorsTest({
          status: 'warning',
          message: `Cabeçalhos CORS incompletos, mas o servidor proxy local deve resolver isso.
            Cabeçalhos recebidos:
            Allow-Origin: ${allowOrigin || 'não definido'} 
            Allow-Methods: ${allowMethods || 'não definido'} 
            Allow-Headers: ${allowHeaders || 'não definido'}`
        });
        toast.warning('Cabeçalhos CORS incompletos, usando servidor proxy como fallback');
      }
    } catch (error) {
      console.error('Erro ao testar CORS:', error);
      const errorMsg = `Erro ao testar CORS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      setCorsTest({
        status: 'error',
        message: `${errorMsg}
        
        Não se preocupe! Você ainda pode usar o servidor proxy local (porta 3002) para contornar este problema.`
      });
      addLogMessage(errorMsg);
      toast.error('Erro ao testar CORS, mas o proxy local está ativo');
    }
  };
  
  // Teste de upload de arquivo
  const testFileUpload = async () => {
    if (!selectedFile || !selectedFileType || !selectedStartup) {
      setUploadTest({
        status: 'error',
        message: 'Por favor, selecione um arquivo, tipo de arquivo e startup antes de testar o upload.'
      });
      toast.error('Preencha todos os campos para testar o upload');
      return;
    }
    
    setUploadTest({ status: 'pending', message: 'Testando upload de arquivo...' });
    addLogMessage(`Iniciando teste de upload: ${selectedFile.name} (${selectedFileType})`);
    
    try {
      // Converter arquivo para Base64
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target || !e.target.result) {
            throw new Error('Falha ao ler o arquivo');
          }
          
          const base64String = (e.target.result as string).split(',')[1];
          addLogMessage(`Arquivo convertido para base64 (${Math.round(base64String.length / 1024)} KB)`);
          
          // Criar dados para upload
          const fileData: FileUploadData = {
            fileContent: base64String,
            fileType: selectedFileType as any,
            fileName: selectedFile.name,
            startupId: selectedStartup
          };
          
          addLogMessage('Enviando arquivo para o servidor via API remota...');
          
          // Tentar fazer upload
          const apiUrl = process.env.REACT_APP_API_URL || '';
          const uploadUrl = `${apiUrl}/upload`;
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('startupId', selectedStartup);
          formData.append('fileType', selectedFileType);
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            const successMessage = `Upload bem-sucedido! ID da tarefa: ${result.taskId}`;
            setUploadTest({
              status: 'success',
              message: successMessage
            });
            addLogMessage(successMessage);
            toast.success('Upload realizado com sucesso!');
          } else {
            throw new Error(`Status: ${response.status}`);
          }
        } catch (error) {
          console.error('Erro no teste de upload:', error);
          const errorMsg = `Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
          setUploadTest({
            status: 'error',
            message: errorMsg
          });
          addLogMessage(`Falha: ${errorMsg}`);
          toast.error('Falha no upload do arquivo');
        }
      };
      
      reader.onerror = () => {
        const errorMsg = 'Erro ao ler o arquivo';
        setUploadTest({
          status: 'error',
          message: errorMsg
        });
        addLogMessage(errorMsg);
        toast.error(errorMsg);
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      const errorMsg = `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      setUploadTest({
        status: 'error',
        message: errorMsg
      });
      addLogMessage(errorMsg);
      toast.error('Erro ao processar o arquivo');
    }
  };
  
  // Handler para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      addLogMessage(`Arquivo selecionado: ${files[0].name} (${Math.round(files[0].size / 1024)} KB)`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Página de Teste da API
      </Typography>
      
      {/* Teste de Conexão API */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste Básico de Conexão
        </Typography>
        <Typography paragraph>
          Esta seção testa a conexão básica com a API Lambda hospedada na AWS.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testApiConnection}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Testando...' : 'Testar Conexão com API'}
        </Button>
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
        
        {testResult && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {testResult}
          </Alert>
        )}
      </Paper>
      
      {/* Teste de CORS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste de Configuração CORS
        </Typography>
        <Typography paragraph>
          Esta seção testa especificamente se a API está configurada corretamente para permitir solicitações CORS.
          Se houver problemas com CORS, o servidor proxy local (porta 3002) será usado como alternativa.
        </Typography>
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={testCorsPolicy}
          sx={{ mt: 2 }}
        >
          Testar Configuração CORS
        </Button>
        
        {corsTest && (
          <Alert 
            severity={
              corsTest.status === 'success' ? 'success' : 
              corsTest.status === 'pending' ? 'info' : 
              corsTest.status === 'warning' ? 'warning' : 'error'
            } 
            sx={{ mt: 3 }}
          >
            <Typography sx={{ whiteSpace: 'pre-line' }}>
              {corsTest.message}
            </Typography>
          </Alert>
        )}
      </Paper>
      
      {/* Teste de Upload */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste de Upload de Arquivo
        </Typography>
        <Typography paragraph>
          Esta seção testa especificamente a funcionalidade de upload de arquivos.
          Os uploads serão realizados através do servidor proxy local para evitar problemas de CORS.
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="startup-select-label">Startup</InputLabel>
              <Select
                labelId="startup-select-label"
                id="startup-select"
                value={selectedStartup}
                label="Startup"
                onChange={(e) => setSelectedStartup(e.target.value)}
              >
                {startups.map((startup) => (
                  <MenuItem key={startup.id} value={startup.id}>
                    {startup.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="file-type-label">Tipo de Arquivo</InputLabel>
              <Select
                labelId="file-type-label"
                id="file-type-select"
                value={selectedFileType}
                label="Tipo de Arquivo"
                onChange={(e) => setSelectedFileType(e.target.value)}
              >
                <MenuItem value="PDF">PDF</MenuItem>
                <MenuItem value="TXT">Texto</MenuItem>
                <MenuItem value="EXCEL">Excel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              component="label"
              sx={{ height: '56px' }}
            >
              Selecionar Arquivo
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Grid>
        </Grid>
        
        {selectedFile && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Arquivo selecionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </Typography>
        )}
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testFileUpload}
          disabled={!selectedFile || !selectedFileType || !selectedStartup}
          sx={{ mt: 2 }}
        >
          Testar Upload
        </Button>
        
        {uploadTest && (
          <Alert 
            severity={
              uploadTest.status === 'success' ? 'success' : 
              uploadTest.status === 'pending' ? 'info' : 'error'
            } 
            sx={{ mt: 3 }}
          >
            {uploadTest.message}
          </Alert>
        )}
      </Paper>
      
      {/* Log de Debug */}
      {logMessages.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Log de Depuração
          </Typography>
          <Box sx={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            p: 1, 
            bgcolor: '#1a1a1a', 
            color: '#00ff00',
            fontFamily: 'monospace',
            borderRadius: 1
          }}>
            {logMessages.map((msg, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                {msg}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
      
      {/* Resultados da API */}
      {startups.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados recebidos da API
          </Typography>
          
          <List>
            {startups.map((startup) => (
              <React.Fragment key={startup.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={startup.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {startup.sector || 'Sem setor definido'}
                        </Typography>
                        {startup.description && (
                          <Typography variant="body2" color="text.secondary">
                            {startup.description}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ApiTestPage;
