// Script simples para testar a conexão com a API Lambda
const axios = require('axios');

const API_URL = 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod';

async function testStartupsApi() {
  console.log('Testando conexão com a API de Startups...');
  
  try {
    // GET /startups
    console.log('\nTentando listar todas as startups:');
    const response = await axios.get(`${API_URL}/startups`);
    console.log('Resposta recebida:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    
    // Se houver pelo menos uma startup, testar o endpoint GET by ID
    if (response.data.data && response.data.data.length > 0) {
      const startupId = response.data.data[0].id;
      console.log(`\nTentando obter a startup com ID ${startupId}:`);
      const detailResponse = await axios.get(`${API_URL}/startups/${startupId}`);
      console.log('Resposta recebida:', detailResponse.status);
      console.log('Dados:', JSON.stringify(detailResponse.data, null, 2));
    }
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar a API:', error.message);
    if (error.response) {
      console.error('Detalhes da resposta:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Executar o teste
testStartupsApi();
