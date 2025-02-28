import json
import os
import boto3
import requests
from datetime import datetime

# Inicializar clientes AWS
dynamodb = boto3.resource('dynamodb')

# Obter variáveis de ambiente
TASKS_TABLE_NAME = os.environ['TASKS_TABLE_NAME']
RESULTS_TABLE_NAME = os.environ['RESULTS_TABLE_NAME']
VOLDEA_API_KEY = os.environ['VOLDEA_API_KEY']

# Tabelas do DynamoDB
tasks_table = dynamodb.Table(TASKS_TABLE_NAME)
results_table = dynamodb.Table(RESULTS_TABLE_NAME)

def get_task(task_id):
    """Busca uma tarefa no DynamoDB pelo taskId"""
    response = tasks_table.get_item(
        Key={'taskId': task_id}
    )
    
    return response.get('Item')

def get_result(task_id):
    """Busca um resultado no DynamoDB pelo taskId"""
    response = results_table.get_item(
        Key={'taskId': task_id}
    )
    
    return response.get('Item')

def get_all_tasks():
    """Busca todas as tarefas no DynamoDB"""
    response = tasks_table.scan()
    
    return response.get('Items', [])

def query_voldea_api(task_id):
    """Consulta a API da Voldea para buscar o status e resultado da tarefa"""
    url = f"https://api.voldeaone.ai/docuxtract/tasks/{task_id}"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": VOLDEA_API_KEY
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Erro ao consultar a API da Voldea: {response.status_code} - {response.text}")
    
    return response.json()

def update_task_status(task_id, status):
    """Atualiza o status da tarefa no DynamoDB"""
    timestamp = datetime.now().isoformat()
    
    tasks_table.update_item(
        Key={'taskId': task_id},
        UpdateExpression="set #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': status,
            ':updatedAt': timestamp
        }
    )

def save_result(task_id, result):
    """Salva o resultado da análise no DynamoDB"""
    timestamp = datetime.now().isoformat()
    
    # Primeiro busca a tarefa para obter informações da startup
    task = get_task(task_id)
    
    if not task:
        raise ValueError(f"Tarefa não encontrada: {task_id}")
    
    # Preparar o item para salvar
    result_item = {
        'taskId': task_id,
        'startupId': task.get('startupId'),
        'fileType': task.get('fileType'),
        'fileName': task.get('fileName'),
        'result': result,
        'createdAt': timestamp
    }
    
    # Salvar no DynamoDB
    results_table.put_item(Item=result_item)
    
    return result_item

def process_task_result(task, voldea_response):
    """Processa o resultado da consulta à API da Voldea"""
    task_id = task['taskId']
    status = voldea_response.get('status', 'UNKNOWN')
    
    # Atualizar o status da tarefa
    update_task_status(task_id, status)
    
    # Se o status for COMPLETED, salvar o resultado
    if status == 'COMPLETED':
        result = voldea_response.get('response')
        
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                # Se não for um JSON válido, manter como string
                pass
        
        save_result(task_id, result)
    
    # Retornar a resposta
    response_data = {
        'taskId': task_id,
        'status': status,
        'startupId': task.get('startupId'),
        'fileType': task.get('fileType'),
        'fileName': task.get('fileName')
    }
    
    # Adicionar o resultado se disponível
    if status == 'COMPLETED':
        response_data['result'] = voldea_response.get('response')
    
    return response_data

def handler(event, context):
    """Função handler da Lambda para consultar tarefas"""
    print("Evento recebido:", json.dumps(event))
    try:
        # Verificar se a requisição é para uma tarefa específica
        path_parameters = event.get('pathParameters', {})
        task_id = path_parameters.get('taskId') if path_parameters else None
        
        # Se for uma consulta de tarefa específica
        if task_id:
            # Buscar a tarefa no DynamoDB
            task = get_task(task_id)
            
            if not task:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f"Tarefa não encontrada: {task_id}"})
                }
            
            # Verificar se o status é CONSUMED
            if task.get('status') == 'CONSUMED':
                # Buscar o resultado já salvo
                result = get_result(task_id)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'taskId': task_id,
                        'status': 'CONSUMED',
                        'startupId': task.get('startupId'),
                        'fileType': task.get('fileType'),
                        'fileName': task.get('fileName'),
                        'result': result.get('result') if result else None
                    })
                }
            
            # Consultar a API da Voldea
            voldea_response = query_voldea_api(task_id)
            
            # Processar o resultado
            response_data = process_task_result(task, voldea_response)
            
            # Retornar a resposta
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(response_data)
            }
        
        # Se for uma consulta de todas as tarefas
        else:
            # Buscar todas as tarefas
            tasks = get_all_tasks()
            
            # Retornar a lista de tarefas
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(tasks)
            }
        
    except ValueError as ve:
        # Erro de validação
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(ve)})
        }
    
    except Exception as e:
        # Erro geral
        print(f"Erro ao consultar tarefa: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f"Erro ao consultar tarefa: {str(e)}"})
        }
