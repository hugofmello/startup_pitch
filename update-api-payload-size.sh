#!/bin/bash

# Script para atualizar o tamanho máximo de payload da API Gateway
API_ID="i76vr76m51"
STAGE_NAME="prod"
REST_API_ID="i76vr76m51"

echo "Configurando limite de tamanho de payload para API Gateway..."

# Atualizar as configurações do estágio para aumentar o tamanho máximo do payload
aws apigateway update-stage \
  --rest-api-id $REST_API_ID \
  --stage-name $STAGE_NAME \
  --patch-operations \
    op=replace,path=/variables/maxPayloadSize,value="10" \
    op=replace,path=/variables/maxDataSize,value="10485760"

# Também atualizar as configurações da API para aumentar o limite
aws apigateway update-rest-api \
  --rest-api-id $REST_API_ID \
  --patch-operations \
    op=replace,path=/binaryMediaTypes/*~1*,value="" \
    op=replace,path=/minimumCompressionSize,value="0"

echo "Configuração concluída. Implantando as alterações..."

# Implantar as alterações para o estágio
aws apigateway create-deployment \
  --rest-api-id $REST_API_ID \
  --stage-name $STAGE_NAME \
  --description "Aumentar limite de tamanho do payload"

echo "Implantação concluída!"
