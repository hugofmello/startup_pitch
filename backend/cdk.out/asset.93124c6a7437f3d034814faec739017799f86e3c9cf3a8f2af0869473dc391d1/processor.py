import json
import os
import boto3
import uuid
import requests
import base64
from datetime import datetime

# Inicializar clientes AWS
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Obter variáveis de ambiente
UPLOAD_BUCKET_NAME = os.environ['UPLOAD_BUCKET_NAME']
TASKS_TABLE_NAME = os.environ['TASKS_TABLE_NAME']
VOLDEA_API_KEY = os.environ['VOLDEA_API_KEY']
PDF_DEPLOYMENT_ID = os.environ['PDF_DEPLOYMENT_ID']
TXT_DEPLOYMENT_ID = os.environ['TXT_DEPLOYMENT_ID']
EXCEL_DEPLOYMENT_ID = os.environ['EXCEL_DEPLOYMENT_ID']

# Tabela de tarefas
tasks_table = dynamodb.Table(TASKS_TABLE_NAME)

def get_deployment_id(file_type):
    """Retorna o deployment_id adequado com base no tipo de arquivo"""
    if file_type == 'pitch-pdf':
        return PDF_DEPLOYMENT_ID
    elif file_type == 'pitch-txt':
        return TXT_DEPLOYMENT_ID
    elif file_type in ['pl-xlsx', 'pl-xls', 'pl-csv']:
        return EXCEL_DEPLOYMENT_ID
    else:
        raise ValueError(f"Tipo de arquivo não suportado: {file_type}")

def call_voldea_api(file_url, deployment_id):
    """Chama a API da Voldea para processar o arquivo"""
    url = "https://api.voldeaone.ai/docuxtract/tasks"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": VOLDEA_API_KEY
    }
    
    payload = {
        "deploymentId": deployment_id,
        "fileUrl": file_url
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in (200, 201):
        raise Exception(f"Erro ao chamar a API da Voldea: {response.status_code} - {response.text}")
    
    return response.json()

def save_task(task_id, startup_id, file_type, file_url, file_name):
    """Salva as informações da tarefa no DynamoDB"""
    timestamp = datetime.now().isoformat()
    
    task_item = {
        'taskId': task_id,
        'startupId': startup_id,
        'fileType': file_type,
        'fileUrl': file_url,
        'fileName': file_name,
        'status': 'PROCESSING',
        'createdAt': timestamp,
        'updatedAt': timestamp
    }
    
    tasks_table.put_item(Item=task_item)
    
    return task_item

def handler(event, context):
    """Função handler da Lambda para processar upload de arquivos"""
    try:
        # Parse do corpo da requisição
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # Obter os parâmetros necessários
        file_content_base64 = body.get('fileContent')
        file_type = body.get('fileType')
        file_name = body.get('fileName')
        startup_id = body.get('startupId')
        
        # Validar parâmetros
        if not all([file_content_base64, file_type, file_name, startup_id]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Parâmetros incompletos'})
            }
        
        # Decodificar o conteúdo do arquivo
        file_content = base64.b64decode(file_content_base64)
        
        # Gerar nome único para o arquivo no S3
        file_key = f"{startup_id}/{uuid.uuid4()}-{file_name}"
        
        # Upload do arquivo para o S3
        s3.put_object(
            Bucket=UPLOAD_BUCKET_NAME,
            Key=file_key,
            Body=file_content,
            ContentType='application/octet-stream'
        )
        
        # Obter URL do arquivo
        file_url = f"https://{UPLOAD_BUCKET_NAME}.s3.amazonaws.com/{file_key}"
        
        # Obter o deployment_id adequado
        deployment_id = get_deployment_id(file_type)
        
        # Chamar a API da Voldea
        voldea_response = call_voldea_api(file_url, deployment_id)
        
        # Extrair o ID da tarefa
        task_id = voldea_response.get('taskId')
        
        if not task_id:
            task_id = str(uuid.uuid4())  # Gerar ID se não recebido da Voldea
        
        # Salvar informações da tarefa no DynamoDB
        task_item = save_task(task_id, startup_id, file_type, file_url, file_name)
        
        # Retornar resposta
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'taskId': task_id,
                'startupId': startup_id,
                'fileType': file_type,
                'status': 'PROCESSING'
            })
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
        print(f"Erro ao processar arquivo: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f"Erro ao processar arquivo: {str(e)}"})
        }
