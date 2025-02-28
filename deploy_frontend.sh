#!/bin/bash

# Script para fazer o deploy do frontend na AWS após o deploy do backend

# Obter a URL da API do API Gateway
API_URL=$(aws cloudformation describe-stacks --stack-name VoldeaIntegrationStack --query "Stacks[0].Outputs[?ExportName=='ApiEndpoint'].OutputValue" --output text)

# Obter o nome do bucket do frontend
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name VoldeaIntegrationStack --query "Stacks[0].Outputs[?ExportName=='FrontendBucketName'].OutputValue" --output text)

# Obter a URL do CloudFront
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name VoldeaIntegrationStack --query "Stacks[0].Outputs[?ExportName=='CloudFrontURL'].OutputValue" --output text)

echo "API URL: $API_URL"
echo "Frontend Bucket: $FRONTEND_BUCKET"
echo "CloudFront URL: $CLOUDFRONT_URL"

# Criar arquivo .env.production com a URL da API
echo "REACT_APP_API_URL=$API_URL" > frontend/.env.production
echo "REACT_APP_ENV=production" >> frontend/.env.production

# Navegar para o diretório do frontend e construir
cd frontend
echo "Instalando dependências do frontend..."
npm install
echo "Construindo o frontend..."
npm run build

# Sincronizar os arquivos para o bucket S3
echo "Fazendo o upload para o bucket S3: $FRONTEND_BUCKET"
aws s3 sync build/ s3://$FRONTEND_BUCKET --delete

echo "Deploy do frontend concluído!"
echo "Seu site está disponível em: $CLOUDFRONT_URL"
