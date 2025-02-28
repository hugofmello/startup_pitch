#!/usr/bin/env node

const axios = require('axios');

const CLOUDFRONT_URL = 'https://d399xpdg2x0ndi.cloudfront.net/api/upload';
const API_GATEWAY_URL = 'https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/upload';

async function testOptionsCORS(url, origin) {
  console.log(`\nTestando OPTIONS CORS para: ${url}`);
  console.log(`Origem: ${origin}`);
  
  try {
    const response = await axios({
      method: 'OPTIONS',
      url: url,
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    console.log('✅ SUCESSO! Status:', response.status);
    console.log('Cabeçalhos recebidos:');
    
    // Verificar cabeçalhos CORS específicos
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];
    
    corsHeaders.forEach(header => {
      const value = response.headers[header];
      if (value) {
        console.log(` - ${header}: ${value}`);
      } else {
        console.log(` - ❌ ${header}: AUSENTE`);
      }
    });
    
    // Verificar se a origem está permitida
    const allowOrigin = response.headers['access-control-allow-origin'];
    if (allowOrigin === '*' || allowOrigin === origin) {
      console.log('\n✅ A origem está permitida!');
    } else {
      console.log('\n❌ A origem NÃO está permitida!');
    }
    
    return true;
  } catch (error) {
    console.log('❌ ERRO! Status:', error.response?.status || 'Desconhecido');
    
    if (error.response) {
      console.log('Mensagem:', error.response.statusText);
      console.log('Cabeçalhos recebidos:', error.response.headers);
    } else {
      console.log('Erro:', error.message);
    }
    
    return false;
  }
}

async function main() {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'https://d399xpdg2x0ndi.cloudfront.net'
  ];
  
  console.log('===== TESTE DE CORS PARA CLOUDFRONT E API GATEWAY =====');
  
  console.log('\n----- TESTE DE CLOUDFRONT -----');
  for (const origin of origins) {
    await testOptionsCORS(CLOUDFRONT_URL, origin);
  }
  
  console.log('\n----- TESTE DE API GATEWAY -----');
  for (const origin of origins) {
    await testOptionsCORS(API_GATEWAY_URL, origin);
  }
}

main().catch(console.error);
