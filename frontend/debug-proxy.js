const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

// Criar aplicação Express
const app = express();
const PORT = 3003;

// Aumentar limite para JSON
app.use(bodyParser.json({ limit: '50mb' }));

// Configuração CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota de status
app.get('/status', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota para depuração de upload
app.post('/debug-upload', async (req, res) => {
  console.log('=== INICIANDO DEPURAÇÃO DE UPLOAD ===');
  
  try {
    console.log('Cabeçalhos recebidos:', req.headers);
    console.log('Corpo da requisição (resumo):');
    if (req.body) {
      console.log('- fileName:', req.body.fileName);
      console.log('- fileType:', req.body.fileType);
      console.log('- startupId:', req.body.startupId);
      console.log('- fileContent (primeiros 100 caracteres):', 
                 req.body.fileContent ? req.body.fileContent.substring(0, 100) + '...' : 'NULO');
    } else {
      console.log('CORPO VAZIO');
    }
    
    // Validar os parâmetros necessários
    if (!req.body.fileName || !req.body.fileType || !req.body.startupId || !req.body.fileContent) {
      console.log('Parâmetros incompletos');
      const missing = [];
      if (!req.body.fileName) missing.push('fileName');
      if (!req.body.fileType) missing.push('fileType');
      if (!req.body.startupId) missing.push('startupId');
      if (!req.body.fileContent) missing.push('fileContent');
      
      return res.status(400).json({
        error: 'Parâmetros incompletos',
        missing: missing.join(', ')
      });
    }
    
    // Validar o tipo de arquivo
    const validTypes = [
      'pitch-pdf', 'pitch-txt', 'pl-xlsx', 'pl-xls', 'pl-csv',
      'SHAREHOLDERS_AGREEMENT', 'ARTICLES_OF_ASSOCIATION', 'INVESTMENT_AGREEMENT'
    ];
    
    if (!validTypes.includes(req.body.fileType)) {
      console.log(`Tipo de arquivo inválido: ${req.body.fileType}`);
      return res.status(400).json({
        error: `Tipo de arquivo não suportado: ${req.body.fileType}`
      });
    }
    
    // Simular processamento bem-sucedido
    console.log('Processamento simulado com sucesso');
    
    // Retornar uma resposta semelhante à do Lambda
    const taskId = 'task-' + Math.random().toString(36).substring(2, 10);
    const response = {
      taskId: taskId,
      startupId: req.body.startupId,
      fileType: req.body.fileType,
      status: 'PROCESSING'
    };
    
    console.log('Resposta simulada:', response);
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Erro na simulação do Lambda:', error);
    res.status(500).json({
      error: 'Erro interno na simulação do Lambda',
      details: error.message
    });
  }
});

// Rota para depuração de OPTIONS
app.options('*', (req, res) => {
  console.log('=== REQUISIÇÃO OPTIONS RECEBIDA ===');
  console.log('Origem:', req.headers.origin);
  console.log('Método solicitado:', req.headers['access-control-request-method']);
  console.log('Cabeçalhos solicitados:', req.headers['access-control-request-headers']);
  
  // Definir cabeçalhos CORS explicitamente
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder com 200 OK sem corpo
  res.status(200).end();
});

// Rota para teste manual de OPTIONS
app.options('/debug-options', async (req, res) => {
  console.log('=== TESTANDO OPTIONS REQUEST ===');
  
  try {
    const url = 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/upload';
    console.log(`Enviando OPTIONS para: ${url}`);
    
    const axiosResponse = await axios({
      method: 'OPTIONS',
      url: url,
      headers: {
        'Origin': 'http://localhost:3003',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('=== RESPOSTA OPTIONS ===');
    console.log('Status:', axiosResponse.status);
    console.log('Cabeçalhos:', axiosResponse.headers);
    
    // Definir cabeçalhos CORS explicitamente
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Retornar o resultado do teste
    res.status(200).json({
      success: true,
      options_status: axiosResponse.status,
      headers: axiosResponse.headers
    });
    
  } catch (error) {
    console.error('Erro no teste OPTIONS:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      } : null
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor de depuração está rodando em http://localhost:${PORT}`);
  console.log('Use as seguintes rotas:');
  console.log(`  - http://localhost:${PORT}/status - Verificar status do servidor`);
  console.log(`  - http://localhost:${PORT}/debug-upload - Testar upload com detalhes completos`);
  console.log(`  - http://localhost:${PORT}/debug-options - Testar requisição OPTIONS`);
});
