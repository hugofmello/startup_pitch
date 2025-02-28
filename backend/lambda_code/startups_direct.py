import json
import os
import boto3
import uuid
from datetime import datetime

def handler(event, context):
    """Manipulador Lambda para operações em startups"""
    try:
        # Obter nome da tabela da variável de ambiente
        table_name = os.environ.get('STARTUPS_TABLE_NAME', 'VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3')
        
        # Inicializar resource e tabela
        dynamodb = boto3.resource('dynamodb')
        startups_table = dynamodb.Table(table_name)
        
        # Determinar a operação com base no método HTTP
        http_method = event.get('httpMethod', 'GET')
        
        if http_method == 'GET':
            # Obter startups
            path_parameters = event.get('pathParameters', {}) or {}
            startup_id = path_parameters.get('startupId', None)
            
            if startup_id:
                # Buscar uma startup específica
                response = startups_table.get_item(Key={'id': startup_id})
                startup = response.get('Item', None)
                
                if not startup:
                    return {
                        'statusCode': 404,
                        'body': json.dumps({'message': 'Startup não encontrada'}),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
                
                return {
                    'statusCode': 200,
                    'body': json.dumps(startup),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            else:
                # Buscar todas as startups
                response = startups_table.scan()
                startups = response.get('Items', [])
                
                return {
                    'statusCode': 200,
                    'body': json.dumps(startups),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
        elif http_method == 'POST':
            # Criar nova startup
            try:
                body = json.loads(event['body'])
            except:
                body = {}
            
            if not body or 'name' not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'Nome da startup é obrigatório'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            
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
            
            startups_table.put_item(Item=startup)
            
            return {
                'statusCode': 201,
                'body': json.dumps(startup),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        elif http_method == 'PUT':
            # Atualizar startup existente
            path_parameters = event.get('pathParameters', {}) or {}
            startup_id = path_parameters.get('startupId', None)
            
            if not startup_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'ID da startup é obrigatório'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            try:
                body = json.loads(event['body'])
            except:
                body = {}
                
            # Verificar se a startup existe
            response = startups_table.get_item(Key={'id': startup_id})
            existing_startup = response.get('Item', None)
            
            if not existing_startup:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'message': 'Startup não encontrada'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            # Atualizar os campos alterados
            update_expression = "set "
            expression_attribute_values = {}
            update_items = []
            
            fields = ['name', 'description', 'logo', 'industry', 'founded_date']
            for field in fields:
                if field in body:
                    update_items.append(f"{field} = :{field}")
                    expression_attribute_values[f":{field}"] = body[field]
            
            # Adicionar timestamp de atualização
            update_items.append("updated_at = :updated_at")
            expression_attribute_values[":updated_at"] = datetime.now().isoformat()
            
            # Montar a expressão de atualização
            update_expression += ", ".join(update_items)
            
            # Atualizar no DynamoDB
            response = startups_table.update_item(
                Key={'id': startup_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )
            
            updated_startup = response.get('Attributes', {})
            
            return {
                'statusCode': 200,
                'body': json.dumps(updated_startup),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        elif http_method == 'DELETE':
            # Excluir uma startup
            path_parameters = event.get('pathParameters', {}) or {}
            startup_id = path_parameters.get('startupId', None)
            
            if not startup_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'message': 'ID da startup é obrigatório'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            # Verificar se a startup existe
            response = startups_table.get_item(Key={'id': startup_id})
            existing_startup = response.get('Item', None)
            
            if not existing_startup:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'message': 'Startup não encontrada'}),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
                
            # Excluir do DynamoDB
            startups_table.delete_item(Key={'id': startup_id})
            
            return {
                'statusCode': 204,
                'body': '',
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
        else:
            # Método HTTP não suportado
            return {
                'statusCode': 405,
                'body': json.dumps({'message': 'Método não permitido'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
            
    except Exception as e:
        print(f"Erro ao processar a requisição: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': f'Erro interno do servidor: {str(e)}'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
