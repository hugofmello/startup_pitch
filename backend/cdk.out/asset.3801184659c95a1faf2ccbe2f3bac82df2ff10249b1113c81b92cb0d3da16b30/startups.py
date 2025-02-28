import json
import os
import boto3
import uuid
from datetime import datetime

# Inicializar cliente DynamoDB
dynamodb = boto3.resource('dynamodb')

# Obter variável de ambiente
STARTUPS_TABLE_NAME = os.environ.get('STARTUPS_TABLE_NAME', '')
print(f"STARTUPS_TABLE_NAME: {STARTUPS_TABLE_NAME}")

# Verificar todas as tabelas disponíveis
try:
    table_names = [table.name for table in dynamodb.tables.all()]
    print(f"Tabelas disponíveis no DynamoDB: {json.dumps(table_names)}")
    
    # Se não encontrar a tabela pela variável de ambiente, procurar pelo nome parcial
    if STARTUPS_TABLE_NAME not in table_names:
        possible_tables = [t for t in table_names if 'Startup' in t]
        if possible_tables:
            STARTUPS_TABLE_NAME = possible_tables[0]
            print(f"Usando tabela alternativa: {STARTUPS_TABLE_NAME}")
except Exception as e:
    print(f"Erro ao listar tabelas: {str(e)}")
    # Fallback para o nome padrão da tabela
    if not STARTUPS_TABLE_NAME:
        STARTUPS_TABLE_NAME = "VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3"  # Nome conhecido da tabela

# Tabela de startups
try:
    startups_table = dynamodb.Table(STARTUPS_TABLE_NAME)
    # Verificar se a tabela está acessível
    table_desc = startups_table.table_status
    print(f"Tabela {STARTUPS_TABLE_NAME} encontrada com status: {table_desc}")
except Exception as e:
    print(f"Erro ao acessar a tabela {STARTUPS_TABLE_NAME}: {str(e)}")
    # Se tiver uma lista de tabelas, tente usar uma existente
    table_fallback_name = "VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3"
    print(f"Usando tabela de fallback: {table_fallback_name}")
    startups_table = dynamodb.Table(table_fallback_name)

def get_all_startups():
    """Busca todas as startups no DynamoDB"""
    try:
        response = startups_table.scan()
        return response.get('Items', [])
    except Exception as e:
        print(f"Erro ao buscar todas as startups: {str(e)}")
        return []

def get_startup(startup_id):
    """Busca uma startup pelo ID"""
    try:
        response = startups_table.get_item(
            Key={'id': startup_id}
        )
        return response.get('Item')
    except Exception as e:
        print(f"Erro ao buscar startup {startup_id}: {str(e)}")
        return None

def create_startup(startup_data):
    """Cria uma nova startup"""
    try:
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
        
        print(f"Criando startup com dados: {json.dumps(startup_item)}")
        
        # Salvar no DynamoDB
        startups_table.put_item(Item=startup_item)
        
        return startup_item
    except Exception as e:
        print(f"Erro ao criar startup: {str(e)}")
        raise

def update_startup(startup_id, startup_data):
    """Atualiza uma startup existente"""
    try:
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
        
        print(f"Atualizando startup {startup_id} com dados: {json.dumps(startup_data)}")
        
        # Executar a atualização
        startups_table.update_item(
            Key={'id': startup_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        # Retornar a startup atualizada
        return get_startup(startup_id)
    except Exception as e:
        print(f"Erro ao atualizar startup {startup_id}: {str(e)}")
        raise

def delete_startup(startup_id):
    """Exclui uma startup pelo ID"""
    try:
        # Verificar se a startup existe
        existing_startup = get_startup(startup_id)
        
        if not existing_startup:
            raise ValueError(f"Startup não encontrada: {startup_id}")
        
        print(f"Excluindo startup {startup_id}")
        
        # Excluir a startup
        startups_table.delete_item(
            Key={'id': startup_id}
        )
        
        return True
    except Exception as e:
        print(f"Erro ao excluir startup {startup_id}: {str(e)}")
        raise

def handler(event, context):
    """Função handler da Lambda para gerenciar startups"""
    print("Evento recebido no startups:", json.dumps(event))
    print("Contexto da função startups:", context.function_name)
    print("Variáveis de ambiente:", json.dumps(dict(os.environ)))
    
    # Verificar headers de entrada da requisição
    if 'headers' in event:
        print("Headers da requisição:", json.dumps(event.get('headers', {})))
    
    try:
        http_method = event.get('httpMethod')
        path_parameters = event.get('pathParameters', {})
        startup_id = path_parameters.get('startupId') if path_parameters else None
        
        print(f"Método HTTP: {http_method}, Path parameters: {json.dumps(path_parameters)}, startup_id: {startup_id}")
        
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
            body = {}
            try:
                if 'body' in event:
                    body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
                    print(f"Body recebido: {json.dumps(body)}")
            except Exception as e:
                print(f"Erro ao parsear body: {str(e)}")
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Body inválido: {str(e)}"})
                }
            
            if not body.get('name'):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Nome da startup é obrigatório'})
                }
            
            try:
                startup = create_startup(body)
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(startup)
                }
            except Exception as e:
                print(f"Erro ao criar startup: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Erro ao criar startup: {str(e)}"})
                }
        
        # PUT /startups/{startupId} - Atualizar uma startup
        elif http_method == 'PUT' and startup_id:
            body = {}
            try:
                if 'body' in event:
                    body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
                    print(f"Body recebido para atualização: {json.dumps(body)}")
            except Exception as e:
                print(f"Erro ao parsear body para atualização: {str(e)}")
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Body inválido: {str(e)}"})
                }
            
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
            except Exception as e:
                print(f"Erro ao atualizar startup: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Erro ao atualizar startup: {str(e)}"})
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
            except Exception as e:
                print(f"Erro ao excluir startup: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Erro ao excluir startup: {str(e)}"})
                }
        
        # Método OPTIONS para CORS
        elif http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                'body': ''
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
        import traceback
        print(f"Traceback completo: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f"Erro ao processar solicitação: {str(e)}"})
        }
