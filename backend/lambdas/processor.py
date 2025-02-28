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
    elif file_type in ['SHAREHOLDERS_AGREEMENT', 'ARTICLES_OF_ASSOCIATION', 'INVESTMENT_AGREEMENT']:
        # Usar o deployment de PDF para documentos jurídicos
        return PDF_DEPLOYMENT_ID
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
        # Adicionar logs detalhados para depuração
        print("Evento recebido:", json.dumps(event))
        
        # Configuração dos cabeçalhos CORS para qualquer origem
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        }
        
        # Verificar se é uma chamada CORS OPTIONS
        if event.get('httpMethod') == 'OPTIONS':
            print("Requisição OPTIONS recebida, retornando resposta CORS")
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({})
            }
        
        # Parse do corpo da requisição
        if not event.get('body'):
            print("Corpo da requisição vazio ou ausente")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Corpo da requisição vazio ou ausente'})
            }
            
        try:
            body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
            print("Corpo da requisição processado:", json.dumps(body))
        except Exception as parse_error:
            print(f"Erro ao processar corpo da requisição: {str(parse_error)}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'Erro ao processar corpo da requisição: {str(parse_error)}'})
            }
        
        # Obter os parâmetros necessários
        file_content_base64 = body.get('fileContent')
        file_type = body.get('fileType')
        file_name = body.get('fileName')
        startup_id = body.get('startupId')
        
        # Log dos parâmetros recebidos
        print(f"Parâmetros recebidos: tipo={file_type}, nome={file_name}, startup={startup_id}")
        print(f"Tamanho do conteúdo base64: {len(file_content_base64) if file_content_base64 else 'NULO'}")
        
        # Validar parâmetros
        if not all([file_content_base64, file_type, file_name, startup_id]):
            missing = []
            if not file_content_base64: missing.append("fileContent")
            if not file_type: missing.append("fileType")
            if not file_name: missing.append("fileName")
            if not startup_id: missing.append("startupId")
            
            print(f"Parâmetros faltando: {', '.join(missing)}")
            
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'Parâmetros incompletos: {", ".join(missing)}'})
            }
            
        # Validar o tipo de arquivo
        try:
            deployment_id = get_deployment_id(file_type)
            print(f"Tipo de arquivo válido: {file_type}, deployment_id: {deployment_id}")
        except ValueError as type_error:
            print(f"Tipo de arquivo inválido: {file_type}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': str(type_error)})
            }
        
        try:
            # Decodificar o conteúdo do arquivo
            print("Decodificando conteúdo do arquivo...")
            file_content = base64.b64decode(file_content_base64)
            print(f"Arquivo decodificado com sucesso. Tamanho: {len(file_content)} bytes")
        except Exception as decode_error:
            print(f"Erro ao decodificar o arquivo: {str(decode_error)}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'Erro ao decodificar o arquivo: {str(decode_error)}'})
            }
        
        # Gerar nome único para o arquivo no S3
        file_key = f"{startup_id}/{uuid.uuid4()}-{file_name}"
        print(f"Chave do arquivo no S3: {file_key}")
        
        try:
            # Upload do arquivo para o S3
            print(f"Fazendo upload para S3: bucket={UPLOAD_BUCKET_NAME}, key={file_key}")
            s3.put_object(
                Bucket=UPLOAD_BUCKET_NAME,
                Key=file_key,
                Body=file_content,
                ContentType='application/octet-stream'
            )
            print("Upload para S3 concluído com sucesso")
        except Exception as s3_error:
            print(f"Erro no upload para S3: {str(s3_error)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': f'Erro no upload para S3: {str(s3_error)}'})
            }
        
        # Obter URL do arquivo
        file_url = f"https://{UPLOAD_BUCKET_NAME}.s3.amazonaws.com/{file_key}"
        print(f"URL do arquivo: {file_url}")
        
        try:
            # Chamar a API da Voldea
            print("Chamando API da Voldea...")
            voldea_response = call_voldea_api(file_url, deployment_id)
            print(f"Resposta da Voldea: {json.dumps(voldea_response)}")
        except Exception as api_error:
            print(f"Erro ao chamar a API da Voldea: {str(api_error)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': f'Erro ao chamar a API da Voldea: {str(api_error)}'})
            }
        
        # Extrair o ID da tarefa
        task_id = voldea_response.get('taskId')
        
        if not task_id:
            task_id = str(uuid.uuid4())  # Gerar ID se não recebido da Voldea
            print(f"ID da tarefa gerado localmente: {task_id}")
        else:
            print(f"ID da tarefa recebido da Voldea: {task_id}")
        
        try:
            # Salvar informações da tarefa no DynamoDB
            task_item = save_task(task_id, startup_id, file_type, file_url, file_name)
            print(f"Tarefa salva no DynamoDB: {json.dumps(task_item)}")
        except Exception as db_error:
            print(f"Erro ao salvar no DynamoDB: {str(db_error)}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': f'Erro ao salvar no DynamoDB: {str(db_error)}'})
            }
        
        # Retornar resposta
        response_body = {
            'taskId': task_id,
            'startupId': startup_id,
            'fileType': file_type,
            'status': 'PROCESSING'
        }
        
        print(f"Resposta final: {json.dumps(response_body)}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps(response_body)
        }
        
    except ValueError as ve:
        # Erro de validação
        print(f"Erro de validação: {str(ve)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(ve)})
        }
    
    except Exception as e:
        # Erro geral
        print(f"Erro ao processar arquivo: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f"Erro ao processar arquivo: {str(e)}"})
        }
