#!/bin/bash

# Script para atualizar a configuração de CORS no CloudFront com uma abordagem alternativa
DISTRIBUTION_ID="E1K0D4C8MLIQK8"

# Criar um arquivo de configuração para adicionar os cabeçalhos CORS
cat <<EOF > cors-headers-policy.json
{
  "Name": "VoldeaCORSPolicy",
  "Comment": "Add CORS headers for Voldea API",
  "CorsConfig": {
    "AccessControlAllowCredentials": false,
    "AccessControlAllowHeaders": {
      "Items": [
        "Authorization",
        "Content-Type", 
        "X-Amz-Date", 
        "X-Api-Key",
        "X-Amz-Security-Token"
      ],
      "Quantity": 5
    },
    "AccessControlAllowMethods": {
      "Items": [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
      ],
      "Quantity": 5
    },
    "AccessControlAllowOrigins": {
      "Items": [
        "*"
      ],
      "Quantity": 1
    },
    "AccessControlExposeHeaders": {
      "Items": [],
      "Quantity": 0
    },
    "AccessControlMaxAgeSec": 86400,
    "OriginOverride": false
  }
}
EOF

echo "Criando política de cabeçalhos CORS no CloudFront..."
POLICY_ID=$(aws cloudfront create-response-headers-policy --response-headers-policy-config file://cors-headers-policy.json --query "ResponseHeadersPolicy.Id" --output text)

if [ -z "$POLICY_ID" ]; then
  echo "Erro ao criar a política de cabeçalhos. Tentando encontrar uma política existente..."
  POLICY_ID=$(aws cloudfront list-response-headers-policies --query "ResponseHeadersPolicies.Items[?Name=='VoldeaCORSPolicy'].Id" --output text)
  
  if [ -z "$POLICY_ID" ]; then
    echo "Não foi possível criar ou encontrar uma política de cabeçalhos CORS."
    exit 1
  fi
fi

echo "Política de cabeçalhos criada/encontrada com ID: $POLICY_ID"

# Obter a configuração atual da distribuição
echo "Obtendo configuração atual do CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output json > cloudfront-config.json

# Extrair o ETag da configuração atual
ETAG=$(grep -o '"ETag": "[^"]*' cloudfront-config.json | cut -d'"' -f4)
echo "ETag encontrado: $ETAG"

# Extrair apenas a configuração da distribuição
jq .DistributionConfig cloudfront-config.json > cloudfront-distribution.json

# Adicionar a política de cabeçalhos à configuração
echo "Atualizando a configuração para usar a política CORS..."
jq ".DefaultCacheBehavior.ResponseHeadersPolicyId = \"$POLICY_ID\"" cloudfront-distribution.json > cloudfront-updated.json

# Atualizar a configuração para aceitar o método OPTIONS
echo "Adicionando suporte para método OPTIONS..."
jq '.DefaultCacheBehavior.AllowedMethods.Items |= (. + ["OPTIONS"] | unique) | .DefaultCacheBehavior.AllowedMethods.Quantity = (.DefaultCacheBehavior.AllowedMethods.Items | length) | .DefaultCacheBehavior.CachedMethods.Items |= (. + ["OPTIONS"] | unique) | .DefaultCacheBehavior.CachedMethods.Quantity = (.DefaultCacheBehavior.CachedMethods.Items | length)' cloudfront-updated.json > cloudfront-final.json

# Atualizar a distribuição com a nova configuração
echo "Enviando atualização para o CloudFront..."
aws cloudfront update-distribution --id $DISTRIBUTION_ID --distribution-config file://cloudfront-final.json --if-match $ETAG

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "Atualização da distribuição CloudFront iniciada com sucesso!"
  echo "Atenção: A propagação das alterações pode levar até 15 minutos."
else
  echo "Erro ao atualizar a distribuição CloudFront. Verifique os logs acima."
fi

# Limpar arquivos temporários
echo "Limpando arquivos temporários..."
rm -f cloudfront-*.json cors-headers-policy.json

echo "Concluído!"
