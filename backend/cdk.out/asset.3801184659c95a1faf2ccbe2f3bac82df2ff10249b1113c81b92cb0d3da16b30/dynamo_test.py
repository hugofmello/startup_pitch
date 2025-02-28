import boto3
import json
import os

def handler(event, context):
    print("Evento recebido:", json.dumps(event))
    
    # Listar todas as tabelas do DynamoDB
    dynamodb = boto3.resource('dynamodb')
    table_names = [table.name for table in dynamodb.tables.all()]
    
    # Verificar acesso à tabela de startups
    startups_table_name = os.environ.get('STARTUPS_TABLE_NAME', '')
    
    # Tentar identificar a tabela correta
    possible_tables = [t for t in table_names if 'Startup' in t]
    
    response = {
        'statusCode': 200,
        'body': json.dumps({
            'tables': table_names,
            'startups_table_env': startups_table_name,
            'possible_startup_tables': possible_tables
        }),
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }
    
    return response
