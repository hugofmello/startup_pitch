import json
import os
import boto3
import uuid
import traceback
from datetime import datetime

def handler(event, context):
    """Manipulador Lambda para operações em startups"""
    try:
        # Imprimir o evento para depuração
        print(f"Evento completo recebido: {json.dumps(event)}")
        
        # Obter nome da tabela da variável de ambiente
        table_name = os.environ.get('STARTUPS_TABLE_NAME', 'VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3')
        print(f"Tabela utilizada: {table_name}")
        
        # Inicializar resource e tabela
        dynamodb = boto3.resource('dynamodb')
        startups_table = dynamodb.Table(table_name)
        
        # Recuperar todas as startups (para simplificar, sempre retornamos todas)
        response = startups_table.scan()
        startups = response.get('Items', [])
        print(f"Startups encontradas: {len(startups)}")
        
        # Retornar a resposta com as startups
        return {
            'statusCode': 200,
            'body': json.dumps(startups),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        # Capturar e registrar erros
        error_details = traceback.format_exc()
        print(f"Erro ao processar evento: {str(e)}")
        print(f"Stack trace: {error_details}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Erro interno do servidor: {str(e)}',
                'stackTrace': error_details
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
