import json
import os
import boto3
import uuid
from datetime import datetime

def handler(event, context):
    """Manipulador Lambda para operações em startups"""
    try:
        # Imprimir o evento para depuração
        print(f"Evento recebido: {json.dumps(event)}")
        
        # Obter nome da tabela da variável de ambiente
        table_name = os.environ.get('STARTUPS_TABLE_NAME', 'VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3')
        print(f"Tabela utilizada: {table_name}")
        
        # Inicializar resource e tabela
        dynamodb = boto3.resource('dynamodb')
        startups_table = dynamodb.Table(table_name)
        
        # Determinar a operação com base no método HTTP
        # O formato do evento pode variar dependendo de como é invocado
        http_method = None
        
        # Verificar diferentes formatos possíveis
        if isinstance(event, dict):
            # API Gateway REST API
            if 'httpMethod' in event:
                http_method = event.get('httpMethod')
            # API Gateway HTTP API
            elif 'requestContext' in event and 'http' in event['requestContext']:
                http_method = event['requestContext']['http'].get('method')
            # Invocação direta
            elif 'method' in event:
                http_method = event.get('method')
                
        # Padrão para GET se não for especificado
        if not http_method:
            http_method = 'GET'
            
        print(f"Método HTTP: {http_method}")
        
        # Operação GET - listar todas as startups ou obter uma específica
        if http_method == 'GET':
            # Buscar todas as startups
            try:
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
            except Exception as e:
                print(f"Erro ao buscar startups: {str(e)}")
                raise e
                
        elif http_method == 'POST':
            # Criar nova startup
            try:
                # Tentar extrair o corpo da requisição
                body = {}
                if 'body' in event:
                    if isinstance(event['body'], str):
                        body = json.loads(event['body'])
                    elif isinstance(event['body'], dict):
                        body = event['body']
                
                # Verificar se temos um nome
                if not body or 'name' not in body:
                    return {
                        'statusCode': 400,
                        'body': json.dumps({'message': 'Nome da startup é obrigatório'}),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                
                # Criar um novo registro
                startup = {
                    'id': str(uuid.uuid4()),
                    'name': body['name'],
                    'description': body.get('description', ''),
                    'logo': body.get('logo', ''),
                    'industry': body.get('industry', ''),
                    'founded_date': body.get('founded_date', ''),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                # Salvar no DynamoDB
                startups_table.put_item(Item=startup)
                
                return {
                    'statusCode': 201,
                    'body': json.dumps(startup),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            except Exception as e:
                print(f"Erro ao criar startup: {str(e)}")
                raise e
        else:
            # Método HTTP não suportado
            return {
                'statusCode': 405,
                'body': json.dumps({'message': f'Método não permitido: {http_method}'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Erro interno do servidor: {str(e)}'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
