#!/bin/bash
set -e

# Definir cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando configuração para desenvolvimento local...${NC}"

# Navegar para o diretório do frontend
cd frontend

# Instalar dependências do frontend
echo -e "${YELLOW}Instalando dependências do frontend...${NC}"
npm install

# Iniciar o frontend em modo de desenvolvimento
echo -e "${GREEN}Iniciando o frontend em modo de desenvolvimento...${NC}"
echo -e "${GREEN}Acesse http://localhost:3000 no seu navegador${NC}"
npm start
