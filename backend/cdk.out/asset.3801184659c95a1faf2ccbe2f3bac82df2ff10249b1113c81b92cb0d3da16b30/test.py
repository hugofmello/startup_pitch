def handler(event, context):
    """Função handler da Lambda para testar o API Gateway"""
    return {
        'statusCode': 200,
        'body': '{"message": "Teste endpoint funcionando!"}'
    }
