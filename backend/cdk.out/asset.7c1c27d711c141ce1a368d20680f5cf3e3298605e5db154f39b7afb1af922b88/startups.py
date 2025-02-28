import json
import os
import boto3
import uuid
from datetime import datetime

# Inicializar cliente DynamoDB
dynamodb = boto3.resource('dynamodb')

# Obter variável de ambiente
STARTUPS_TABLE_NAME = os.environ['STARTUPS_TABLE_NAME']

# Tabela de startups
startups_table = dynamodb.Table(STARTUPS_TABLE_NAME)

def get_all_startups():
    """Busca todas as startups no DynamoDB"""
    response = startups_table.scan()
    return response.get('Items', [])

def get_startup(startup_id):
    """Busca uma startup pelo ID"""
    response = startups_table.get_item(
        Key={'id': startup_id}
    )
    return response.get('Item')

def create_startup(startup_data):
    """Cria uma nova startup"""
    timestamp = datetime.now().isoformat()
    
    # Gerar ID se não fornecido
    startup_id = startup_data.get('id', str(uuid.uuid4()))
    
    # Criar item para salvar
    startup_item = {
        'id': startup_id,
        'name': startup_data.get('name'),
        'description': startup_data.get('description', ''),
        'segment': startup_data.get('segment', ''),
        'createdAt': timestamp,
        'updatedAt': timestamp
    }
    
    # Salvar no DynamoDB
    startups_table.put_item(Item=startup_item)
    
    return startup_item

def update_startup(startup_id, startup_data):
    """Atualiza uma startup existente"""
    timestamp = datetime.now().isoformat()
    
    # Obter startup existente
    existing_startup = get_startup(startup_id)
    
    if not existing_startup:
        raise ValueError(f"Startup não encontrada: {startup_id}")
    
    # Atualizar campos
    update_expression = "set updatedAt = :updatedAt"
    expression_attribute_values = {
        ':updatedAt': timestamp
    }
    
    # Adicionar campos que serão atualizados
    for key, value in startup_data.items():
        if key not in ['id', 'createdAt']:  # Não permitir atualizar esses campos
            update_expression += f", {key} = :{key}"
            expression_attribute_values[f":{key}"] = value
    
    # Executar a atualização
    startups_table.update_item(
        Key={'id': startup_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values
    )
    
    # Retornar a startup atualizada
    return get_startup(startup_id)

def delete_startup(startup_id):
    """Exclui uma startup pelo ID"""
    # Verificar se a startup existe
    existing_startup = get_startup(startup_id)
    
    if not existing_startup:
        raise ValueError(f"Startup não encontrada: {startup_id}")
    
    # Excluir a startup
    startups_table.delete_item(
        Key={'id': startup_id}
    )
    
    return True

def handler(event, context):
    """Função handler da Lambda para gerenciar startups"""
    try:
        http_method = event.get('httpMethod')
        path_parameters = event.get('pathParameters', {})
        startup_id = path_parameters.get('startupId') if path_parameters else None
        
        # GET /startups - Listar todas as startups
        if http_method == 'GET' and not startup_id:
            startups = get_all_startups()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(startups)
            }
        
        # GET /startups/{startupId} - Buscar uma startup específica
        elif http_method == 'GET' and startup_id:
            startup = get_startup(startup_id)
            
            if not startup:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Startup não encontrada: {startup_id}"})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(startup)
            }
        
        # POST /startups - Criar uma nova startup
        elif http_method == 'POST':
            body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
            
            if not body.get('name'):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Nome da startup é obrigatório'})
                }
            
            startup = create_startup(body)
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(startup)
            }
        
        # PUT /startups/{startupId} - Atualizar uma startup
        elif http_method == 'PUT' and startup_id:
            body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
            
            try:
                startup = update_startup(startup_id, body)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(startup)
                }
            except ValueError as ve:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(ve)})
                }
        
        # DELETE /startups/{startupId} - Excluir uma startup
        elif http_method == 'DELETE' and startup_id:
            try:
                delete_startup(startup_id)
                
                return {
                    'statusCode': 204,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': ''
                }
            except ValueError as ve:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(ve)})
                }
        
        # Método não suportado
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Método não suportado'})
            }
        
    except Exception as e:
        # Erro geral
        print(f"Erro ao processar solicitação: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f"Erro ao processar solicitação: {str(e)}"})
        }
