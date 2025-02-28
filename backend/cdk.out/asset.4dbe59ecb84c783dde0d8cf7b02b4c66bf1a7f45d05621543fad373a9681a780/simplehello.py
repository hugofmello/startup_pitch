import json

def handler(event, context):
    """Função handler da Lambda simples para testar o API Gateway"""
    # Retornar uma resposta bem básica, sem depender de outras bibliotecas
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'event': event
        })
    }
