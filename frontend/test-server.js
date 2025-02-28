const express = require('express');
const path = require('path');

const app = express();
const PORT = 3003;

// Configurar middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-upload.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/test-upload.html para testar o upload`);
});
