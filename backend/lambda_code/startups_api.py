import json
import os
import boto3
import uuid
import traceback
from datetime import datetime

def handler(event, context):
    """Manipulador Lambda para operações em startups via API Gateway"""
    try:
        # Registrar evento para depuração
        print(f"Evento completo recebido: {json.dumps(event)}")
        
        # Determinar o método HTTP a partir do evento do API Gateway
        http_method = None
        if event and isinstance(event, dict):
            # Tentar obter o método HTTP direto do evento
            if 'httpMethod' in event:
                http_method = event.get('httpMethod')
            # Tentar obter o método HTTP do requestContext
            elif 'requestContext' in event and isinstance(event['requestContext'], dict):
                http_method = event['requestContext'].get('httpMethod')
        
        print(f"Método HTTP: {http_method}")
        
        # Obter nome da tabela da variável de ambiente
        table_name = os.environ.get('STARTUPS_TABLE_NAME', 'VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3')
        print(f"Tabela utilizada: {table_name}")
        
        # Inicializar resource e tabela
        dynamodb = boto3.resource('dynamodb')
        startups_table = dynamodb.Table(table_name)
        
        # Verificar se é uma solicitação para uma startup específica
        startup_id = None
        if event and isinstance(event, dict):
            # Tentar obter o ID da startup dos pathParameters ou direto do evento
            if 'pathParameters' in event and isinstance(event['pathParameters'], dict) and event['pathParameters']:
                startup_id = event['pathParameters'].get('startupId')
            # Verificar se há um padrão de caminho como /startups/{id}
            elif 'path' in event and isinstance(event['path'], str):
                path_parts = event['path'].strip('/').split('/')
                if len(path_parts) > 1 and path_parts[0] == 'startups':
                    startup_id = path_parts[1]
        
        # Operações baseadas no método HTTP
        if http_method == 'GET':
            if startup_id:
                # Buscar uma startup específica
                print(f"Buscando startup com ID: {startup_id}")
                response = startups_table.get_item(Key={'id': startup_id})
                startup = response.get('Item')
                
                if startup:
                    return {
                        'statusCode': 200,
                        'body': json.dumps(startup),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                else:
                    return {
                        'statusCode': 404,
                        'body': json.dumps({'message': f'Startup com ID {startup_id} não encontrada'}),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
            else:
                # Buscar todas as startups
                print("Buscando todas as startups")
                response = startups_table.scan()
                startups = response.get('Items', [])
                print(f"Startups encontradas: {len(startups)}")
                
                return {
                    'statusCode': 200,
                    'body': json.dumps(startups),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
        elif http_method == 'POST':
            # Obter o corpo da requisição
            body = {}
            if 'body' in event:
                try:
                    # O corpo pode vir como string, precisamos desserializar
                    if isinstance(event['body'], str):
                        body = json.loads(event['body'])
                    else:
                        body = event['body']
                except Exception as e:
                    print(f"Erro ao processar o corpo da requisição: {str(e)}")
            
            # Verificar se os campos necessários estão presentes
            if not body or 'name' not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'Campo obrigatório "name" não fornecido'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            
            # Criar nova startup
            startup_id = str(uuid.uuid4())
            startup = {
                'id': startup_id,
                'name': body['name'],
                'description': body.get('description', ''),
                'website': body.get('website', ''),
                'createdAt': datetime.now().isoformat(),
                'sector': body.get('sector', '')
            }
            
            print(f"Criando nova startup: {startup['name']}")
            startups_table.put_item(Item=startup)
            
            return {
                'statusCode': 201,
                'body': json.dumps(startup),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        else:
            # Método não suportado
            return {
                'statusCode': 405,
                'body': json.dumps({'message': f'Método {http_method} não suportado'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
    except Exception as e:
        # Capturar e registrar erros
        error_details = traceback.format_exc()
        print(f"Erro ao processar evento: {str(e)}")
        print(f"Stack trace: {error_details}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Erro interno do servidor: {str(e)}',
                'stackTrace': error_details
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
