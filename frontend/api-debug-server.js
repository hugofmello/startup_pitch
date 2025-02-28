// Servidor de depuração específico para simular a API de upload
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3005;

// Configurar diretório de uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware para aumentar limite de tamanho do corpo da requisição
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Configuração de CORS completa
app.use((req, res, next) => {
  // Adicionar cabeçalhos CORS para todas as respostas
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas

  // Responder imediatamente às requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Endpoint de status para verificar se o servidor está rodando
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'API de depuração funcionando corretamente'
  });
});

// Endpoint de upload para simular a API real
app.post('/upload', (req, res) => {
  try {
    console.log('Recebida requisição de upload:', req.method);
    console.log('Cabeçalhos:', JSON.stringify(req.headers, null, 2));
    
    // Validar a requisição
    const { fileName, fileType, fileContent, startupId } = req.body;
    
    if (!fileName || !fileType || !fileContent || !startupId) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros incompletos. Todos os campos são obrigatórios: fileName, fileType, fileContent, startupId',
        receivedParams: {
          hasFileName: !!fileName,
          hasFileType: !!fileType,
          hasFileContent: !!fileContent,
          hasStartupId: !!startupId
        }
      });
    }
    
    // Gerar um ID para o upload
    const uploadId = uuidv4();
    
    // Salvar o conteúdo do arquivo em disco
    const fileBuffer = Buffer.from(fileContent, 'base64');
    const filePath = path.join(uploadsDir, `${uploadId}-${fileName}`);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    console.log(`Arquivo salvo em: ${filePath}`);
    
    // Verificar tipos de arquivo suportados
    const validFileTypes = [
      'PITCH', 'BUSINESS_MODEL_CANVAS', 'FINANCIAL_MODEL', 
      'SHAREHOLDERS_AGREEMENT', 'ARTICLES_OF_ASSOCIATION', 'INVESTMENT_AGREEMENT'
    ];
    
    if (!validFileTypes.includes(fileType)) {
      console.warn(`Tipo de arquivo não suportado: ${fileType}. Aceitando mesmo assim para fins de teste.`);
    }
    
    // Simular resposta da API real
    return res.status(200).json({
      success: true,
      message: 'Upload processado com sucesso',
      data: {
        id: uploadId,
        fileName: fileName,
        fileType: fileType,
        uploadDate: new Date().toISOString(),
        startupId: startupId,
        fileSize: fileBuffer.length,
        status: 'PROCESSED'
      }
    });
    
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar upload',
      error: error.message
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor de depuração da API rodando na porta ${PORT}`);
  console.log(`URL de teste: http://localhost:${PORT}/upload`);
  console.log(`Verificação de status: http://localhost:${PORT}/status`);
  console.log('Diretório de uploads:', uploadsDir);
});
