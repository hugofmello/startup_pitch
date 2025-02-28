import json
import logging

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    # Log detalhado do evento
    logger.info(f"Evento completo recebido: {json.dumps(event)}")
    
    # Log do contexto (parcial, pois não é serializável)
    logger.info(f"Context function name: {context.function_name}")
    logger.info(f"Context aws request id: {context.aws_request_id}")
    
    try:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": "Lambda de teste executada com sucesso!"})
        }
    except Exception as e:
        logger.error(f"Erro na execução: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"error": str(e)})
        }
