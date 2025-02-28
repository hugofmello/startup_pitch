#!/bin/bash

# Script simplificado para adicionar uma política de cabeçalhos CORS ao CloudFront
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
RESPONSE=$(aws cloudfront create-response-headers-policy --response-headers-policy-config file://cors-headers-policy.json)
POLICY_ID=$(echo $RESPONSE | jq -r '.ResponseHeadersPolicy.Id')

echo "Política de cabeçalhos criada com ID: $POLICY_ID"
echo "Agora é necessário atualizar a distribuição do CloudFront para usar esta política."
echo "Você pode fazer isso via console da AWS:"
echo "1. Acesse o console do CloudFront: https://console.aws.amazon.com/cloudfront/"
echo "2. Selecione a distribuição $DISTRIBUTION_ID"
echo "3. Vá para a aba 'Behaviors'"
echo "4. Edite o comportamento padrão"
echo "5. Em 'Response headers policy', selecione a política que acabamos de criar: 'VoldeaCORSPolicy'"
echo "6. Também certifique-se de que 'OPTIONS' está incluído nos métodos permitidos"
echo "7. Salve as alterações"

# Limpar arquivos temporários
rm -f cors-headers-policy.json

echo "Concluído!"
