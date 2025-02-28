import json
import boto3
import os

# Função para criar resposta da API padrão
def create_response(status_code, body):
    """Cria uma resposta padronizada para as APIs do Lambda"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

# Função para inicializar cliente DynamoDB e tabelas
def init_dynamodb():
    """Inicializa cliente DynamoDB e retorna as tabelas configuradas"""
    dynamodb = boto3.resource('dynamodb')
    
    # Obter nomes das tabelas do ambiente
    tables = {}
    
    if 'STARTUPS_TABLE_NAME' in os.environ:
        tables['startups'] = dynamodb.Table(os.environ['STARTUPS_TABLE_NAME'])
    
    if 'TASKS_TABLE_NAME' in os.environ:
        tables['tasks'] = dynamodb.Table(os.environ['TASKS_TABLE_NAME'])
    
    if 'RESULTS_TABLE_NAME' in os.environ:
        tables['results'] = dynamodb.Table(os.environ['RESULTS_TABLE_NAME'])
    
    return tables

# Função para inicializar cliente S3
def init_s3():
    """Inicializa cliente S3"""
    return boto3.client('s3')
