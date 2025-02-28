def handler(event, context):
    """Função handler da Lambda simples para testar o API Gateway"""
    return {
        'statusCode': 200,
        'body': '{"message": "Hello from Lambda!"}'
    }
