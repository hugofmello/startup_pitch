#!/bin/bash
set -e

# Definir cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== DEPLOY COMPLETO DA APLICAÇÃO ===${NC}"

# 1. Executar o deploy do backend
echo -e "${YELLOW}Iniciando deploy do backend...${NC}"
./deploy-backend.sh

# 2. Executar o deploy do frontend
echo -e "${YELLOW}Iniciando deploy do frontend...${NC}"
./deploy-frontend.sh

echo -e "${GREEN}=== DEPLOY FINALIZADO COM SUCESSO ===${NC}"
echo -e "${GREEN}Sua aplicação está pronta para uso!${NC}"
