import json

def handler(event, context):
    print("Evento recebido:", json.dumps(event))
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({"message": "Lambda de teste executada com sucesso!"})
    }
