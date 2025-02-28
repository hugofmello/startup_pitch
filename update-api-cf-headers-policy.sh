#!/bin/bash

# Script para atualizar distribuição CloudFront da API com a nova política de CORS
DISTRIBUTION_ID="E1ZM2JTESAAJSR"
POLICY_ID="a132eba7-b8b5-41b9-a059-6f333aa88584"

# Verificar o status da distribuição
STATUS=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query "Distribution.Status" --output text)

echo "Status atual da distribuição: $STATUS"

# Obter a configuração atual da distribuição
echo "Obtendo configuração atual do CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cloudfront-api-config.json

# Extrair o ETag da configuração atual
ETAG=$(grep -o '"ETag": "[^"]*' cloudfront-api-config.json | cut -d'"' -f4)
echo "ETag encontrado: $ETAG"

# Extrair apenas a configuração da distribuição
jq .DistributionConfig cloudfront-api-config.json > distribution-api-config.json

# Adicionar a política de cabeçalhos à configuração
echo "Atualizando configuração..."
jq ".DefaultCacheBehavior.ResponseHeadersPolicyId = \"$POLICY_ID\"" distribution-api-config.json > distribution-api-updated.json

# Atualizar a distribuição com a nova configuração
echo "Enviando atualização para o CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://distribution-api-updated.json --if-match $ETAG

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "Atualização da distribuição CloudFront iniciada com sucesso!"
  echo "Atenção: A propagação das alterações pode levar até 15 minutos."
else
  echo "Erro ao atualizar a distribuição CloudFront. Verifique os logs acima."
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -f cloudfront-api-config.json distribution-api-config.json distribution-api-updated.json

echo "Concluído!"
