def add_cors_headers(response):
    """
    Adiciona cabeçalhos CORS a uma resposta Lambda
    """
    if 'headers' not in response:
        response['headers'] = {}
    
    # Adicionar cabeçalhos CORS
    response['headers']['Access-Control-Allow-Origin'] = '*'
    response['headers']['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    response['headers']['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
    response['headers']['Access-Control-Max-Age'] = '86400'  # 24 horas em segundos
    
    return response

def lambda_handler(event, context):
    # Verificar se é uma requisição OPTIONS (preflight)
    if event['httpMethod'] == 'OPTIONS':
        response = {
            'statusCode': 204,  # No Content
            'body': '',
            'headers': {}
        }
        return add_cors_headers(response)
    
    # Processar requisição normal e adicionar cabeçalhos CORS à resposta
    # ... seu código Lambda aqui ...
    
    response = {
        'statusCode': 200,
        'body': json.dumps({'message': 'Success'}),
        'headers': {}
    }
    
    return add_cors_headers(response)
