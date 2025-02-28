#!/bin/bash

# Script para atualizar distribuição CloudFront do frontend com política de CORS
DISTRIBUTION_ID="E1K0D4C8MLIQK8"
POLICY_ID="5b66d7c7-46cf-4542-a5cd-229b1d697fa4"

# Verificar o status da distribuição
STATUS=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.Status" --output text)

echo "Status atual da distribuição: $STATUS"

# Obter a configuração atual da distribuição
echo "Obtendo configuração atual do CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cloudfront-frontend-config.json

# Extrair o ETag da configuração atual
ETAG=$(grep -o '"ETag": "[^"]*' cloudfront-frontend-config.json | cut -d'"' -f4)
echo "ETag encontrado: $ETAG"

# Extrair apenas a configuração da distribuição
jq .DistributionConfig cloudfront-frontend-config.json > distribution-frontend-config.json

# Adicionar a política de cabeçalhos à configuração
echo "Atualizando configuração..."
jq ".DefaultCacheBehavior.ResponseHeadersPolicyId = \"$POLICY_ID\"" distribution-frontend-config.json > distribution-frontend-updated.json

# Atualizar a distribuição com a nova configuração
echo "Enviando atualização para o CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://distribution-frontend-updated.json --if-match $ETAG

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "Atualização da distribuição CloudFront iniciada com sucesso!"
  echo "Atenção: A propagação das alterações pode levar até 15 minutos."
else
  echo "Erro ao atualizar a distribuição CloudFront. Verifique os logs acima."
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -f cloudfront-frontend-config.json distribution-frontend-config.json distribution-frontend-updated.json

echo "Concluído!"
