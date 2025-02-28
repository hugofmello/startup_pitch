#!/bin/bash

# Script para criar uma distribuição CloudFront com API Gateway como origem
API_GATEWAY_URL="i76vr76m51.execute-api.us-east-1.amazonaws.com"

# Criar arquivo de configuração
cat <<EOF > api-distribution-config.json
{
  "CallerReference": "api-distribution-$(date +%s)",
  "Comment": "API Gateway distribution",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "ApiGateway",
        "DomainName": "${API_GATEWAY_URL}",
        "OriginPath": "/prod",
        "CustomHeaders": {
          "Quantity": 0
        },
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": [
              "TLSv1.2"
            ]
          },
          "OriginReadTimeout": 30,
          "OriginKeepaliveTimeout": 5
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ApiGateway",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "OPTIONS",
        "DELETE"
      ],
      "CachedMethods": {
        "Quantity": 2,
        "Items": [
          "GET",
          "HEAD"
        ]
      }
    },
    "Compress": true,
    "DefaultTTL": 0,
    "MinTTL": 0,
    "MaxTTL": 0,
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "all"
      },
      "Headers": {
        "Quantity": 7,
        "Items": [
          "Authorization",
          "Content-Type",
          "Accept",
          "Origin",
          "Referer",
          "Access-Control-Request-Headers",
          "Access-Control-Request-Method"
        ]
      }
    }
  },
  "Enabled": true,
  "HttpVersion": "http2",
  "PriceClass": "PriceClass_All",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

echo "Criando nova distribuição CloudFront para API Gateway..."
aws cloudfront create-distribution --distribution-config file://api-distribution-config.json

# Limpar arquivos temporários
rm -f api-distribution-config.json

echo "Concluído! A distribuição está sendo criada, o que pode levar até 15 minutos para ser concluído."
