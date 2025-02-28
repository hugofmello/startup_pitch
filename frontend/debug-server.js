const express = require('express');
const path = require('path');

const app = express();
const PORT = 3004;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'debug-upload.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor web rodando em http://localhost:${PORT}`);
  console.log('Acesse a página de upload em http://localhost:3004/debug-upload.html');
});
