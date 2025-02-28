#!/bin/bash

# Script para criar uma nova política de cabeçalhos CORS mais permissiva
POLICY_NAME="VoldaStartupsCorsPolicyV2"

echo "Criando política de cabeçalhos CORS mais permissiva..."

aws cloudfront create-response-headers-policy --cli-input-json '{
  "ResponseHeadersPolicyConfig": {
    "Name": "'"$POLICY_NAME"'",
    "Comment": "Política de CORS para a aplicação Voldea Startups",
    "CorsConfig": {
      "AccessControlAllowOrigins": {
        "Quantity": 1,
        "Items": ["*"]
      },
      "AccessControlAllowHeaders": {
        "Quantity": 8,
        "Items": [
          "Authorization",
          "Content-Type",
          "Origin",
          "Accept",
          "X-Requested-With",
          "X-Api-Key",
          "Access-Control-Request-Method",
          "Access-Control-Request-Headers"
        ]
      },
      "AccessControlAllowMethods": {
        "Quantity": 7,
        "Items": [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
          "HEAD",
          "OPTIONS"
        ]
      },
      "AccessControlAllowCredentials": true,
      "AccessControlExposeHeaders": {
        "Quantity": 2,
        "Items": [
          "Content-Length",
          "Access-Control-Allow-Origin"
        ]
      },
      "AccessControlMaxAgeSec": 86400,
      "OriginOverride": true
    },
    "CustomHeadersConfig": {
      "Quantity": 1,
      "Items": [
        {
          "Header": "Cache-Control",
          "Value": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Override": true
        }
      ]
    }
  }
}'

echo "Política criada com sucesso!"
