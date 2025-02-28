# Guia de Deploy - Aplicação Voldea Integration

## Problemas Identificados

Durante o processo de deploy, identificamos algumas questões relacionadas ao ambiente Python:

1. O ambiente Python 3.13 do sistema está configurado com proteção contra modificações (PEP 668 - externally-managed-environment).
2. A compilação do pacote `pydantic-core` falhou no ambiente virtual, possivelmente por incompatibilidade com o Python 3.13.

## Solução Recomendada para Deploy

### Pré-requisitos

- Node.js v14+ e npm
- Python 3.9 (recomendado) ou 3.8
- AWS CLI configurado com credenciais de acesso
- AWS CDK instalado

### Passos para Deploy Manual

#### Backend

1. **Configurar um ambiente virtual com Python 3.9:**
   ```bash
   # Instalar o Python 3.9 via brew (se não estiver instalado)
   brew install python@3.9
   
   # Criar ambiente virtual com Python 3.9
   /opt/homebrew/opt/python@3.9/bin/python3.9 -m venv backend/.venv
   
   # Ativar o ambiente virtual
   source backend/.venv/bin/activate
   
   # Instalar dependências
   pip install -r backend/requirements.txt
   
   # Instalar AWS CDK
   pip install aws-cdk-lib
   ```

2. **Executar o deploy do CDK:**
   ```bash
   cd backend
   cdk synth
   cdk deploy --require-approval never
   ```

3. **Capturar as saídas do CDK:**
   ```bash
   # Anote os valores output do CloudFormation para uso no frontend
   # - ApiEndpoint
   # - FrontendBucketName
   # - CloudFrontURL
   ```

#### Frontend

1. **Atualizar arquivo .env.production com a URL da API:**
   ```bash
   echo "REACT_APP_API_URL=<API_ENDPOINT_DO_CDK>" > frontend/.env.production
   echo "REACT_APP_ENV=production" >> frontend/.env.production
   ```

2. **Build e Deploy:**
   ```bash
   cd frontend
   npm install
   npm run build
   
   # Enviar para o bucket S3
   aws s3 sync build/ s3://<FRONTEND_BUCKET_NAME> --delete
   
   # Invalidar cache CloudFront (se aplicável)
   aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_ID> --paths "/*"
   ```

## Alternativa: Execução Local

Para testar a aplicação localmente sem efetuar o deploy completo na AWS:

1. **Configurar o Frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Iniciar o Frontend em modo de desenvolvimento:**
   ```bash
   # Editar .env para apontar para uma API mock, se necessário
   npm start
   ```

3. **Utilizar o script run-local.sh:**
   ```bash
   # Torna o script executável
   chmod +x run-local.sh
   
   # Executa
   ./run-local.sh
   ```

## Considerações Finais

Este projeto foi configurado com a arquitetura de microserviços em AWS Lambda, S3 e DynamoDB. Para um ambiente de produção real, é recomendável:

1. Utilizar uma versão estável do Python (3.8 ou 3.9) para o backend.
2. Configurar CORS adequadamente para o ambiente de produção.
3. Implementar autenticação e autorização.
4. Considerar o uso de um CI/CD para automação do processo de deploy.

Para qualquer problema durante o deploy, consulte a documentação oficial do AWS CDK e verifique a compatibilidade das bibliotecas com sua versão do Python.
