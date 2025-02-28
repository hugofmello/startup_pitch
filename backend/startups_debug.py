import json
import os
import traceback

def handler(event, context):
    """Manipulador Lambda para depuração de eventos"""
    try:
        # Registrar todo o evento no log
        print(f"Evento completo recebido: {json.dumps(event)}")
        
        # Registrar detalhes do contexto
        if context:
            print(f"Function name: {context.function_name}")
            print(f"Log group: {context.log_group_name}")
            print(f"Log stream: {context.log_stream_name}")
            print(f"Request ID: {context.aws_request_id}")
        
        # Resposta de sucesso com os detalhes do evento
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Evento processado com sucesso para depuração',
                'event': event
            }),
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
