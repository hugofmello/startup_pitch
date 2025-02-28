# Aplicação Web de Integração com Voldea

Esta aplicação permite o upload de arquivos PDF, Excel e TXT para um bucket S3 na AWS, integração com a API da Voldea para análise de documentos, e gerenciamento de resultados em tabelas DynamoDB.

## Estrutura do Projeto

- **backend/**: Código CDK para a infraestrutura serverless na AWS
  - **lib/**: Stacks CDK
  - **lambdas/**: Funções Lambda para o backend
  - **bin/**: Scripts de inicialização do CDK
- **frontend/**: Aplicação React para a interface do usuário

## Backend (AWS CDK)

O backend é construído usando CDK com Python e implementa:
- Bucket S3 para armazenamento de arquivos
- Tabelas DynamoDB para armazenar startups, tarefas e resultados
- Funções Lambda para processamento de uploads, consultas à API da Voldea e gerenciamento de startups
- API Gateway para expor endpoints REST

## Frontend (React)

O frontend é construído com React e oferece:
- Cadastro e gerenciamento de startups
- Upload de arquivos PDF, Excel e TXT
- Visualização das tarefas criadas
- Consulta dos resultados das análises da Voldea

## Tipos de Arquivos Suportados

- **Pitch (PDF)**: Arquivos PDF contendo o pitch das startups
- **Notas do Pitch (TXT)**: Arquivos TXT com notas de pitch
- **Notas do P&L (XLSX, XLS, CSV)**: Planilhas contendo notas de P&L

## Recursos Avançados

### Upload em Chunks

A aplicação suporta upload de arquivos grandes através de um sistema de chunks:

- Arquivos são divididos em pedaços menores (2MB) no frontend
- Backend processa cada chunk e os armazena temporariamente
- Um endpoint dedicado (/upload/status) permite monitorar o progresso
- Quando todos os chunks forem recebidos, o arquivo é reconstruído

Essa implementação permite:
- Superar limitações de tamanho de payload da API Gateway
- Oferecer feedback de progresso do upload
- Melhorar a confiabilidade para arquivos grandes

## Configuração e Implantação

### Método Simplificado

Para facilitar a implantação completa da aplicação, foram criados scripts automatizados:

1. **Deploy Completo**: Implanta backend e frontend de uma vez
   ```
   ./deploy-all.sh
   ```

2. **Deploy do Backend**: Apenas implanta a infraestrutura AWS
   ```
   ./deploy-backend.sh
   ```

3. **Deploy do Frontend**: Apenas faz o build e deploy da aplicação React no S3 e CloudFront
   ```
   ./deploy-frontend.sh
   ```

4. **Deploy do Suporte a Chunks**: Atualiza a API para suportar upload em chunks
   ```
   ./deploy-api-with-chunked-uploads.sh
   ```

### Implantação Manual

#### Backend

1. Instale as dependências:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Sintetize e implante a infraestrutura AWS:
   ```
   cdk synth
   cdk deploy
   ```

#### Frontend

1. Instale as dependências:
   ```
   cd frontend
   npm install
   ```

2. Execute a aplicação em modo de desenvolvimento:
   ```
   npm start
   ```

3. Construa para produção:
   ```
   npm run build
   ```

## API Endpoints

- **POST /upload**: Faz upload de um arquivo e cria uma tarefa na Voldea
- **GET /tasks**: Lista todas as tarefas
- **GET /tasks/{taskId}**: Obtém detalhes de uma tarefa específica
- **GET /startups**: Lista todas as startups
- **POST /startups**: Cria uma nova startup
- **GET /startups/{startupId}**: Obtém detalhes de uma startup específica
- **PUT /startups/{startupId}**: Atualiza uma startup
- **DELETE /startups/{startupId}**: Exclui uma startup

## Integração com AWS Lambda e API Gateway

A aplicação utiliza as seguintes integrações com a AWS:

### Função Lambda para Gerenciamento de Startups

- **Endpoint**: `https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod/startups`
- **Handler**: `startups_final.handler`
- **Permissões**: Configuradas para permitir o acesso do API Gateway à função Lambda
- **Tratamento de Erros**: Implementado com logging detalhado e respostas de erro padronizadas

### Problemas Resolvidos

1. **Permissões do API Gateway**
   - Resolvido o erro "Invalid permissions on Lambda function"
   - Adicionada permissão usando `aws lambda add-permission` para permitir que o API Gateway invoque a função Lambda

2. **Formato de Resposta Padronizado**
   - Implementado um formato de resposta JSON consistente com campos `status` e `data`
   - Adicionados cabeçalhos CORS (Cross-Origin Resource Sharing) para permitir chamadas do frontend

3. **Validação e Tratamento de Erros**
   - Adicionada validação para campos obrigatórios
   - Implementado tratamento de exceções com mensagens de erro descritivas
   - Adicionado logging detalhado para facilitar a depuração

### Operações CRUD Implementadas

A API suporta todas as operações CRUD:
- `GET /startups`: Lista todas as startups
- `GET /startups/{id}`: Obtém uma startup específica
- `POST /startups`: Cria uma nova startup
- `PUT /startups/{id}`: Atualiza uma startup existente
- `DELETE /startups/{id}`: Remove uma startup

### Integração com o Frontend

O frontend foi atualizado para se conectar à API Lambda:
- Atualizada a URL base no arquivo de configuração
- Adaptado o serviço de API para lidar com o formato de resposta padronizado
- Criada uma página de teste de API para demonstrar a conexão
