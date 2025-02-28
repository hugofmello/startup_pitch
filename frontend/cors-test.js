const axios = require('axios');

// URLs para teste
const API_URL = 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/upload';
const LOCALHOST_PROXY = 'http://localhost:3002/api/upload';

// Simulação de dados para o teste
const testData = {
  fileName: 'test-file.txt',
  fileType: 'SHAREHOLDERS_AGREEMENT',
  fileContent: 'VGVzdGUgZGUgY29udGV1ZG8=', // Base64 de "Teste de conteudo"
  startupId: 'test-startup-123'
};

// Função para testar a API diretamente
async function testDirectApi() {
  console.log('==== TESTE DIRETO NA API ====');
  try {
    console.log('Enviando requisição para:', API_URL);
    console.log('Origem: localhost');
    
    const response = await axios.post(API_URL, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      timeout: 10000
    });
    
    console.log('Resposta bem-sucedida!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar API diretamente:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Função para testar a API via CloudFront
async function testCloudFrontOrigin() {
  console.log('\n==== TESTE COM ORIGEM CLOUDFRONT ====');
  try {
    console.log('Enviando requisição para:', API_URL);
    console.log('Origem: d399xpdg2x0ndi.cloudfront.net');
    
    const response = await axios.post(API_URL, testData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://d399xpdg2x0ndi.cloudfront.net'
      },
      timeout: 10000
    });
    
    console.log('Resposta bem-sucedida!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar API com origem CloudFront:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Função para testar o servidor proxy local
async function testLocalProxy() {
  console.log('\n==== TESTE DO PROXY LOCAL ====');
  try {
    console.log('Enviando requisição para:', LOCALHOST_PROXY);
    console.log('Origem: não especificada (local)');
    
    const response = await axios.post(LOCALHOST_PROXY, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Resposta bem-sucedida!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao acessar proxy local:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Dados:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Verificar OPTIONS request
async function testOptionsRequest() {
  console.log('\n==== TESTE OPTIONS REQUEST ====');
  try {
    console.log('Enviando requisição OPTIONS para:', API_URL);
    console.log('Origem: CloudFront');
    
    const response = await axios({
      method: 'OPTIONS',
      url: API_URL,
      headers: {
        'Origin': 'https://d399xpdg2x0ndi.cloudfront.net',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Resposta OPTIONS bem-sucedida!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('- Access-Control-Allow-Methods:', response.headers['access-control-allow-methods']);
    console.log('- Access-Control-Allow-Headers:', response.headers['access-control-allow-headers']);
    return true;
  } catch (error) {
    console.error('Erro na requisição OPTIONS:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Dados:', error.response.data);
      
      // Verificar cabeçalhos CORS mesmo em caso de erro
      if (error.response.headers['access-control-allow-origin']) {
        console.log('CORS Headers (mesmo com erro):');
        console.log('- Access-Control-Allow-Origin:', error.response.headers['access-control-allow-origin']);
        console.log('- Access-Control-Allow-Methods:', error.response.headers['access-control-allow-methods']);
        console.log('- Access-Control-Allow-Headers:', error.response.headers['access-control-allow-headers']);
      }
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('======= INÍCIO DOS TESTES CORS =======');
  console.log('Data e hora:', new Date().toISOString());
  console.log('');
  
  const results = {
    directApi: await testDirectApi(),
    cloudFrontOrigin: await testCloudFrontOrigin(),
    localProxy: await testLocalProxy(),
    optionsRequest: await testOptionsRequest()
  };
  
  console.log('\n======= RESULTADOS DOS TESTES =======');
  console.log('API Direta:', results.directApi ? '✅ SUCESSO' : '❌ FALHA');
  console.log('Origem CloudFront:', results.cloudFrontOrigin ? '✅ SUCESSO' : '❌ FALHA');
  console.log('Proxy Local:', results.localProxy ? '✅ SUCESSO' : '❌ FALHA');
  console.log('Requisição OPTIONS:', results.optionsRequest ? '✅ SUCESSO' : '❌ FALHA');
  
  if (results.directApi && results.cloudFrontOrigin && results.localProxy && results.optionsRequest) {
    console.log('\n✅✅✅ TODOS OS TESTES PASSARAM! ✅✅✅');
  } else {
    console.log('\n❌❌❌ ALGUNS TESTES FALHARAM! ❌❌❌');
    
    if (!results.directApi) {
      console.log('- A API não está respondendo diretamente. Verifique a URL da API e se ela está ativa.');
    }
    
    if (!results.cloudFrontOrigin) {
      console.log('- A API está rejeitando requisições do CloudFront. Verifique as configurações de CORS.');
    }
    
    if (!results.localProxy) {
      console.log('- O proxy local não está funcionando. Verifique se ele está rodando e configurado corretamente.');
    }
    
    if (!results.optionsRequest) {
      console.log('- A requisição OPTIONS falhou. Isso pode indicar problemas com a configuração de CORS na API.');
    }
  }
}

// Executar os testes
runAllTests().catch(err => {
  console.error('Erro fatal durante os testes:', err);
});
