#!/bin/bash
set -e

# Definir cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando deploy do frontend...${NC}"

# Obtendo valores do CDK Stack
INFRA_STACK_NAME="VoldeaInfraStack"
API_STACK_NAME="VoldeaApiStack"
echo -e "${YELLOW}Obtendo informações das Stacks CDK ($INFRA_STACK_NAME e $API_STACK_NAME)...${NC}"

API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $API_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name $INFRA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks --stack-name $INFRA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

if [ -z "$API_ENDPOINT" ] || [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}Erro: Não foi possível obter os valores das stacks CDK. Verifique se as stacks foram implantadas.${NC}"
    exit 1
fi

echo -e "${GREEN}API Endpoint: $API_ENDPOINT${NC}"
echo -e "${GREEN}S3 Bucket: $S3_BUCKET${NC}"
echo -e "${GREEN}CloudFront URL: $CLOUDFRONT_DOMAIN${NC}"

# Criar arquivo .env.production com a URL da API
echo -e "${YELLOW}Atualizando arquivo .env.production com a URL da API...${NC}"
echo "REACT_APP_API_URL=$API_ENDPOINT" > frontend/.env.production
echo "REACT_APP_ENV=production" >> frontend/.env.production

# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
npm install

# Realizar o build da aplicação
echo -e "${YELLOW}Realizando build da aplicação...${NC}"
npm run build

# Sincronizar build com o bucket S3
echo -e "${YELLOW}Implantando aplicação no S3...${NC}"
aws s3 sync build/ s3://$S3_BUCKET --delete

# Invalidar cache do CloudFront
if [ ! -z "$CLOUDFRONT_DOMAIN" ]; then
    CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='${CLOUDFRONT_DOMAIN#https://}'].Id" --output text)
    
    if [ ! -z "$CLOUDFRONT_ID" ]; then
        echo -e "${YELLOW}Invalidando cache do CloudFront...${NC}"
        aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
    fi
fi

echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}Seu frontend está disponível em: $CLOUDFRONT_DOMAIN${NC}"
