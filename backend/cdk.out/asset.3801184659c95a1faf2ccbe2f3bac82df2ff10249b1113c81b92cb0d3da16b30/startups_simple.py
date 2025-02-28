import json
import os
import boto3

def handler(event, context):
    """Manipulador Lambda para testes de startups"""
    try:
        # Inicializar cliente DynamoDB
        dynamodb = boto3.resource('dynamodb')
        
        # Obter tabelas
        table_names = [table.name for table in dynamodb.tables.all()]
        
        # Construir resposta
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Teste de função Lambda para startups',
                'tabelas': table_names,
                'var_ambiente': os.environ.get('STARTUPS_TABLE_NAME', 'não definida')
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        response = {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Erro: {str(e)}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    
    return response
