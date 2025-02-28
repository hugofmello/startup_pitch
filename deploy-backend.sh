#!/bin/bash
set -e

# Definir cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando deploy do backend...${NC}"

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

# Sintetizar o CloudFormation template
echo -e "${YELLOW}Sintetizando CloudFormation template...${NC}"
cdk synth

# Implantar a stack
echo -e "${YELLOW}Implantando stack...${NC}"
cdk deploy --require-approval never

# Desativar ambiente virtual
deactivate

echo -e "${GREEN}Deploy do backend concluído com sucesso!${NC}"
echo -e "${YELLOW}Execute o script de deploy do frontend para concluir a implantação.${NC}"
