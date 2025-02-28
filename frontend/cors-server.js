// Este é um servidor proxy local simples para contornar problemas de CORS durante o desenvolvimento
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3002;

// Aumentar o limite de tamanho do corpo da requisição
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Habilitar CORS para todas as rotas com configuração mais permissiva
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware para logging de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar proxy para API Gateway com melhor tratamento de erros
const apiProxy = createProxyMiddleware({
  target: 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remover cabeçalhos problemáticos para CORS
    proxyReq.removeHeader('Origin');
    proxyReq.removeHeader('Referer');
    
    console.log(`Encaminhando ${req.method} ${req.url} para API Gateway`);
  },
  onProxyRes: function(proxyRes, req, res) {
    // Adicionar cabeçalhos CORS à resposta
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    
    // Logar a resposta da API
    console.log(`Resposta do API Gateway: ${proxyRes.statusCode} para ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('Erro no proxy:', err);
    
    // Resposta amigável em caso de erro
    res.status(500).json({ 
      error: 'Erro ao conectar ao servidor remoto',
      message: err.message || 'Erro desconhecido',
      url: req.url
    });
  }
});

// Rota de upload específica com tratamento especial para arquivos
app.post('/api/upload-form', upload.single('file'), (req, res) => {
  try {
    console.log('Recebida solicitação de upload via FormData');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Log detalhado para depuração
    console.log(`Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`Tipo de arquivo: ${req.body.fileType || 'não especificado'}`);
    console.log(`Startup ID: ${req.body.startupId || 'não especificado'}`);
    
    const fileContent = fs.readFileSync(req.file.path);
    const fileContentBase64 = fileContent.toString('base64');
    
    // Preparar dados para enviar para a API Gateway
    const uploadData = {
      fileContent: fileContentBase64,
      fileName: req.file.originalname,
      fileType: req.body.fileType,
      startupId: req.body.startupId
    };
    
    console.log('Enviando requisição para a API Gateway...');
    
    // Criar uma nova requisição para a API real
    axios({
      method: 'post',
      url: 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/upload',
      data: uploadData,
      headers: {
        'Content-Type': 'application/json',
        // Remover qualquer informação de origem para evitar CORS
        'Origin': undefined,
        'Referer': undefined
      },
      // Aumentar o timeout para uploads grandes
      timeout: 60000
    })
    .then(response => {
      console.log('Upload bem-sucedido via proxy:', response.status);
      
      // Formatar a resposta para garantir consistência
      let responseData = response.data;
      
      if (typeof responseData.body === 'string') {
        try {
          responseData = JSON.parse(responseData.body);
        } catch (error) {
          console.log('Resposta não pôde ser parseada como JSON');
        }
      }
      
      if (!responseData.data && responseData.taskId) {
        // Se a API retornou um formato diferente, convertermos para o formato esperado
        responseData = {
          status: 'success',
          data: {
            taskId: responseData.taskId,
            status: responseData.status || 'pending',
            startupId: req.body.startupId,
            createdAt: new Date().toISOString()
          }
        };
      }
      
      res.status(200).json(responseData);
      
      // Limpar o arquivo temporário
      fs.unlinkSync(req.file.path);
    })
    .catch(error => {
      console.error('Erro ao enviar para a API:', error.message);
      
      // Log detalhado para depuração
      if (error.response) {
        console.error('Detalhes do erro da API:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      res.status(500).json({ 
        error: 'Falha ao processar upload', 
        details: error.response ? error.response.data : error.message,
        message: 'Ocorreu um erro durante o upload do arquivo'
      });
      
      // Limpar o arquivo temporário mesmo em caso de erro
      fs.unlinkSync(req.file.path);
    });
  } catch (error) {
    console.error('Erro no processamento do upload:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor proxy', 
      message: error.message,
      stack: error.stack
    });
    
    // Limpar o arquivo temporário se existir
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Rota de proxy para API upload
app.post('/api/upload', async (req, res) => {
  try {
    console.log('Requisição de upload recebida');
    console.log('Corpo (resumo):', {
      fileName: req.body.fileName,
      fileType: req.body.fileType,
      startupId: req.body.startupId,
      fileContentLength: req.body.fileContent ? req.body.fileContent.length : 0
    });
    
    // Redirecionar para o servidor de debug em vez da API Gateway
    try {
      const response = await axios.post('http://localhost:3003/debug-upload', req.body, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta do servidor de debug:', response.status);
      console.log('Dados da resposta:', response.data);
      
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Erro ao acessar servidor de debug:', error.message);
      
      res.status(500).json({ 
        error: 'Falha ao processar upload', 
        details: error.response ? error.response.data : error.message 
      });
    }
  } catch (error) {
    console.error('Erro no servidor proxy:', error.message);
    
    res.status(500).json({ 
      error: 'Erro interno no servidor proxy', 
      message: error.message
    });
  }
});

// Rota de status para verificar se o servidor está rodando
app.get('/status', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date().toISOString() });
});

// Rota específica para obter todas as startups (contornando CORS)
app.get('/api/startups', (req, res) => {
  console.log('Rota de proxy: buscando startups...');
  
  // Encaminhar a solicitação para a API real
  axios.get('https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups', {
    headers: {
      'Content-Type': 'application/json',
      // Não enviar Origin para evitar problemas de CORS
      'Origin': null
    }
  })
  .then(response => {
    console.log('Listagem de startups obtida com sucesso:', 
      response.data && response.data.data ? 
      `${response.data.data.length} startups` : 
      'Formato de resposta inesperado');
      
    // Garantir que a resposta tenha o formato esperado
    if (!response.data || !response.data.data) {
      console.log('Dados recebidos da API:', JSON.stringify(response.data));
      
      // Tentar ajustar o formato se for diferente do esperado
      if (response.data && Array.isArray(response.data)) {
        response.data = { 
          status: 'success', 
          data: response.data 
        };
      }
    }
    
    res.status(200).json(response.data);
  })
  .catch(error => {
    console.error('Erro ao obter a lista de startups:', error.message);
    
    if (error.response) {
      console.error('Detalhes do erro:', error.response.status, error.response.data);
    }
    
    res.status(500).json({ 
      error: 'Falha ao obter a lista de startups', 
      details: error.response ? error.response.data : error.message 
    });
  });
});

// Todas as solicitações para /api/* serão redirecionadas para o API Gateway
app.use('/api', apiProxy);

// Rota para arquivos estáticos faltando
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // Resposta vazia mas com sucesso
});

app.get('/logo192.png', (req, res) => {
  res.status(204).end(); // Resposta vazia mas com sucesso
});

// Endpoint para testes de CORS
app.options('/api/cors-test', (req, res) => {
  console.log('Recebida requisição OPTIONS para teste de CORS');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send('OK');
});

app.get('/api/cors-test', (req, res) => {
  console.log('Recebida requisição GET para teste de CORS');
  res.status(200).json({ 
    message: 'CORS Test Successful',
    origin: req.headers.origin || 'unknown',
    headers: req.headers
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor proxy CORS está rodando em http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/api/ para acessar a API sem problemas de CORS`);
});
