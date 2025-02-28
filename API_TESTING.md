# Guia de Teste da API de Startups

Este documento fornece instruções sobre como testar a API Lambda de Startups usando ferramentas como curl, Postman ou nosso script de teste.

## Endpoints Disponíveis

A API está disponível em: `https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod`

### Listar Todas as Startups

```bash
curl -X GET https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups
```

Resposta esperada:
```json
{
  "status": "success",
  "data": [
    {
      "id": "12345",
      "name": "Nome da Startup",
      "description": "Descrição da Startup",
      "sector": "Tecnologia",
      "website": "https://exemplo.com",
      "createdAt": "2024-02-27T12:34:56.789Z"
    }
  ]
}
```

### Obter uma Startup Específica

```bash
curl -X GET https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups/{id}
```

Resposta esperada:
```json
{
  "status": "success",
  "data": {
    "id": "12345",
    "name": "Nome da Startup",
    "description": "Descrição da Startup",
    "sector": "Tecnologia",
    "website": "https://exemplo.com",
    "createdAt": "2024-02-27T12:34:56.789Z"
  }
}
```

### Criar uma Nova Startup

```bash
curl -X POST https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nova Startup",
    "description": "Descrição da Nova Startup",
    "sector": "Finanças",
    "website": "https://novaempresa.com"
  }'
```

Resposta esperada:
```json
{
  "status": "success",
  "data": {
    "id": "54321",
    "name": "Nova Startup",
    "description": "Descrição da Nova Startup",
    "sector": "Finanças",
    "website": "https://novaempresa.com",
    "createdAt": "2024-02-27T12:34:56.789Z"
  }
}
```

### Atualizar uma Startup Existente

```bash
curl -X PUT https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Startup Atualizada",
    "description": "Nova descrição",
    "sector": "Educação",
    "website": "https://atualizada.com"
  }'
```

Resposta esperada:
```json
{
  "status": "success",
  "data": {
    "id": "12345",
    "name": "Startup Atualizada",
    "description": "Nova descrição",
    "sector": "Educação",
    "website": "https://atualizada.com",
    "createdAt": "2024-02-27T12:34:56.789Z",
    "updatedAt": "2024-02-27T13:45:67.890Z"
  }
}
```

### Excluir uma Startup

```bash
curl -X DELETE https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups/{id}
```

Resposta esperada:
```json
{
  "status": "success",
  "data": {
    "message": "Startup excluída com sucesso"
  }
}
```

## Testando com o Script JavaScript

Também fornecemos um script simples para testar a API a partir do seu terminal:

```bash
cd frontend
node src/test-api.js
```

Este script tentará listar todas as startups e, se houver alguma, obterá os detalhes da primeira.

## Usando a Página de Teste de API

Nossa aplicação inclui uma página dedicada para testar a conexão com a API:
1. Inicie o aplicativo frontend com `npm start`
2. Navegue até a rota `/api-test` ou clique no botão "Testar API" no cabeçalho
3. Clique no botão "Testar Conexão com API" para verificar se o aplicativo consegue se comunicar com a API Lambda

## Problemas Comuns

Se você encontrar erros ao testar a API, verifique:

1. **Erro de CORS**: Certifique-se de que a API Lambda tem os cabeçalhos CORS configurados corretamente
2. **Permissões do IAM**: Verifique se a função Lambda tem permissões para acessar o DynamoDB
3. **Timeout da Lambda**: Se as operações estiverem demorando muito, verifique o timeout configurado para a função

Para resolver problemas:
- Verifique os logs da Lambda no CloudWatch
- Teste a API diretamente no console do API Gateway
- Verifique o formato dos dados nas requisições/respostas
