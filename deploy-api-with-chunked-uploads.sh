#!/bin/bash

# Script para atualizar a API Gateway com suporte a uploads em chunks
# Este script deve ser executado na raiz do projeto

set -e

# Definir cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando atualização da API Gateway com suporte a uploads em chunks...${NC}"

# Garantir que estamos na raiz do projeto
cd "$(dirname "$0")"

# Verificando se o AWS CLI está configurado
echo -e "${YELLOW}Verificando configuração do AWS CLI...${NC}"
aws sts get-caller-identity > /dev/null || {
    echo -e "${RED}Erro: AWS CLI não está configurado corretamente. Execute 'aws configure' primeiro.${NC}"
    exit 1
}

# Navegar para o diretório do backend
cd backend

# Criar e ativar ambiente virtual
echo -e "${YELLOW}Criando ambiente virtual Python...${NC}"
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
pip3 install -r requirements.txt

# Verificar se as dependências das funções Lambda estão instaladas
if [ ! -d "lambdas/package" ]; then
    echo -e "${YELLOW}Instalando dependências das funções Lambda...${NC}"
    mkdir -p lambdas/package
    pip3 install -r lambdas/requirements.txt -t lambdas/package
fi

# Implantar apenas a stack da API
echo -e "${YELLOW}Implantando stack da API...${NC}"
cdk deploy ApiStack --require-approval never

# Voltando para o diretório raiz
cd ..

# Atualizar configuração de tamanho de payload
echo -e "${YELLOW}Atualizando configuração de tamanho de payload da API Gateway...${NC}"
./update-api-payload-size.sh

# Atualizar a política de CORS
echo -e "${YELLOW}Atualizando política de CORS...${NC}"
./update-frontend-cf-cors.sh

echo -e "${GREEN}Atualização concluída com sucesso!${NC}"
echo -e "${YELLOW}A API Gateway agora suporta uploads em chunks e arquivos maiores.${NC}"

# Desativar ambiente virtual
deactivate
