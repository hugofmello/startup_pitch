#!/bin/bash

# Script para atualizar a configuração de CORS no CloudFront
# É necessário ter o AWS CLI instalado e configurado

# ID da distribuição do CloudFront
DISTRIBUTION_ID="E1K0D4C8MLIQK8"

# Obter a configuração atual
echo "Obtendo configuração atual do CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cloudfront-config-current.json

# Extrair o ETag da configuração atual (necessário para atualização)
ETAG=$(grep -o '"ETag": "[^"]*' cloudfront-config-current.json | cut -d'"' -f4)
echo "ETag encontrado: $ETAG"

# Criar cópia do arquivo sem o ETag e o DistributionConfig externo
cat cloudfront-config-current.json | jq .DistributionConfig > cloudfront-config-edit.json

# Modificar a configuração para incluir cabeçalhos CORS
echo "Atualizando configuração para suportar CORS..."
jq '.Origins.Items[] |= if .Id == "VoldeaInfraStackFrontendDistributionOrigin1BC2D1EF6" then 
  .CustomHeaders.Quantity = 4 | 
  .CustomHeaders.Items = [
    { "HeaderName": "Access-Control-Allow-Origin", "HeaderValue": "*" },
    { "HeaderName": "Access-Control-Allow-Methods", "HeaderValue": "GET,POST,PUT,DELETE,OPTIONS" },
    { "HeaderName": "Access-Control-Allow-Headers", "HeaderValue": "Content-Type,Authorization,X-Amz-Date,X-Api-Key" },
    { "HeaderName": "Access-Control-Max-Age", "HeaderValue": "86400" }
  ] 
else . end' cloudfront-config-edit.json > cloudfront-config-new.json

# Atualizar configuração de comportamentos padrão para incluir cabeçalhos de CORS nas respostas e nas requisições OPTIONS
jq '.DefaultCacheBehavior.AllowedMethods.Items += ["OPTIONS"] | 
    .DefaultCacheBehavior.AllowedMethods.Quantity = (.DefaultCacheBehavior.AllowedMethods.Items | length) |
    .DefaultCacheBehavior.ForwardedValues.Headers.Items += [
      "Origin", 
      "Access-Control-Request-Method", 
      "Access-Control-Request-Headers"
    ] |
    .DefaultCacheBehavior.ForwardedValues.Headers.Quantity = (.DefaultCacheBehavior.ForwardedValues.Headers.Items | length)' cloudfront-config-new.json > cloudfront-config-updated.json

# Atualizar a distribuição com a nova configuração
echo "Enviando atualização para o CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://cloudfront-config-updated.json --if-match $ETAG

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "Atualização da distribuição CloudFront iniciada com sucesso!"
  echo "Atenção: A propagação das alterações pode levar até 15 minutos."
else
  echo "Erro ao atualizar a distribuição CloudFront. Verifique os logs acima."
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -f cloudfront-config-*.json

echo "Concluído!"
