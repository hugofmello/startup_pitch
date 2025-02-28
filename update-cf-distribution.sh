#!/bin/bash

# Script para atualizar a distribuição do CloudFront com uma política de cabeçalhos existente
DISTRIBUTION_ID="E1K0D4C8MLIQK8"
POLICY_ID="5b66d7c7-46cf-4542-a5cd-229b1d697fa4"

# Obter a configuração atual da distribuição
echo "Obtendo configuração atual do CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cloudfront-config.json

# Extrair o ETag da configuração atual
ETAG=$(grep -o '"ETag": "[^"]*' cloudfront-config.json | cut -d'"' -f4)
echo "ETag encontrado: $ETAG"

# Extrair apenas a configuração da distribuição
jq .DistributionConfig cloudfront-config.json > distribution-config.json

# Adicionar a política de cabeçalhos à configuração e garantir que OPTIONS está incluído nos métodos permitidos
echo "Atualizando configuração..."
jq ".DefaultCacheBehavior.ResponseHeadersPolicyId = \"$POLICY_ID\" | 
    .DefaultCacheBehavior.AllowedMethods.Items |= if contains([\"OPTIONS\"]) then . else . + [\"OPTIONS\"] end | 
    .DefaultCacheBehavior.AllowedMethods.Quantity = (.DefaultCacheBehavior.AllowedMethods.Items | length)" \
    distribution-config.json > distribution-updated.json

# Atualizar a distribuição com a nova configuração
echo "Enviando atualização para o CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://distribution-updated.json --if-match $ETAG

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "Atualização da distribuição CloudFront iniciada com sucesso!"
  echo "Atenção: A propagação das alterações pode levar até 15 minutos."
else
  echo "Erro ao atualizar a distribuição CloudFront. Verifique os logs acima."
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -f cloudfront-config.json distribution-config.json distribution-updated.json

echo "Concluído!"
