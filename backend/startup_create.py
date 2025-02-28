import json
import os
import boto3
import uuid
from datetime import datetime

def handler(event, context):
    """Manipulador Lambda para criar startups de teste"""
    try:
        # Obter nome da tabela da variável de ambiente
        table_name = os.environ.get('STARTUPS_TABLE_NAME', 'VoldeaInfraStack-StartupsTable7AF56E94-1LJ2FG777VMK3')
        print(f"Tabela utilizada: {table_name}")
        
        # Inicializar resource e tabela
        dynamodb = boto3.resource('dynamodb')
        startups_table = dynamodb.Table(table_name)
        
        # Criar algumas startups de teste
        startups = [
            {
                "id": str(uuid.uuid4()),
                "name": "Startup Teste 1",
                "description": "Uma startup de teste para verificar a integração",
                "website": "https://startup1.example.com",
                "createdAt": datetime.now().isoformat(),
                "sector": "Tecnologia"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Startup Teste 2",
                "description": "Outra startup de teste para verificar a integração",
                "website": "https://startup2.example.com",
                "createdAt": datetime.now().isoformat(),
                "sector": "Finanças"
            }
        ]
        
        # Inserir cada startup na tabela
        for startup in startups:
            print(f"Inserindo startup: {startup['name']}")
            startups_table.put_item(Item=startup)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Criadas {len(startups)} startups de teste com sucesso.',
                'startups': startups
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        print(f"Erro ao criar startups de teste: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Erro ao criar startups de teste: {str(e)}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
