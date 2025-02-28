#!/usr/bin/env python3
"""
Script para testar a função Lambda processor.py localmente
"""
import json
import os
import sys
from unittest.mock import MagicMock

# Simular variáveis de ambiente
os.environ['UPLOAD_BUCKET_NAME'] = 'meu-bucket-de-teste'
os.environ['TASKS_TABLE_NAME'] = 'minha-tabela-de-teste'
os.environ['VOLDEA_API_KEY'] = 'chave-de-api-de-teste'
os.environ['PDF_DEPLOYMENT_ID'] = 'deployment-pdf-de-teste'
os.environ['TXT_DEPLOYMENT_ID'] = 'deployment-txt-de-teste'
os.environ['EXCEL_DEPLOYMENT_ID'] = 'deployment-excel-de-teste'

# Mock dos serviços AWS
import boto3
boto3.client = MagicMock()
boto3.resource = MagicMock()

# Mock do requests
import requests
requests.post = MagicMock(return_value=MagicMock(
    status_code=200,
    json=lambda: {"taskId": "task-123"},
    text="OK"
))

# Mock desses módulos para que possamos definir o caminho antes de importar
sys.modules['boto3'] = boto3
sys.modules['requests'] = requests

# Agora importamos a função Lambda
from lambdas.processor import handler

# Evento de teste - simula o API Gateway
def create_test_event(file_type, startup_id, file_name, file_content_base64):
    return {
        "httpMethod": "POST",
        "path": "/upload",
        "headers": {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        },
        "body": json.dumps({
            "fileType": file_type,
            "startupId": startup_id,
            "fileName": file_name,
            "fileContent": file_content_base64
        })
    }

def test_with_file_types():
    """Testa a função Lambda com diferentes tipos de arquivos"""
    
    # Conteúdo de teste simples em base64
    test_content = "VGVzdGUgZGUgY29udGV1ZG8="  # "Teste de conteudo" em base64
    
    test_cases = [
        # Tipos originais
        {"file_type": "pitch-pdf", "name": "teste.pdf", "expect_success": True},
        {"file_type": "pitch-txt", "name": "teste.txt", "expect_success": True},
        {"file_type": "pl-xlsx", "name": "teste.xlsx", "expect_success": True},
        
        # Novos tipos adicionados
        {"file_type": "SHAREHOLDERS_AGREEMENT", "name": "acordo.pdf", "expect_success": True},
        {"file_type": "ARTICLES_OF_ASSOCIATION", "name": "estatuto.pdf", "expect_success": True},
        {"file_type": "INVESTMENT_AGREEMENT", "name": "investimento.pdf", "expect_success": True},
        
        # Tipo inválido
        {"file_type": "tipo-invalido", "name": "teste.xyz", "expect_success": False},
    ]
    
    print("\n===== TESTE DE TIPOS DE ARQUIVO =====")
    
    for i, test in enumerate(test_cases):
        print(f"\nCaso de teste #{i+1}: {test['file_type']}")
        
        # Criar evento de teste
        event = create_test_event(
            file_type=test["file_type"],
            startup_id="startup-teste-123",
            file_name=test["name"],
            file_content_base64=test_content
        )
        
        # Chamar o handler
        context = {}
        response = handler(event, context)
        
        # Verificar resposta
        print(f"Status: {response['statusCode']}")
        print(f"Corpo: {response['body']}")
        
        status_ok = 200 <= response['statusCode'] < 300
        test_success = status_ok == test["expect_success"]
        
        if test_success:
            print(f"✅ SUCESSO: O teste para {test['file_type']} se comportou como esperado")
        else:
            print(f"❌ FALHA: O teste para {test['file_type']} não se comportou como esperado")
            print(f"   Esperava status {'sucesso' if test['expect_success'] else 'falha'}, recebeu: {'sucesso' if status_ok else 'falha'}")

def test_missing_parameters():
    """Testa a função Lambda com parâmetros faltando"""
    
    # Conteúdo de teste simples em base64
    test_content = "VGVzdGUgZGUgY29udGV1ZG8="  # "Teste de conteudo" em base64
    
    test_cases = [
        # Casos com parâmetros faltando
        {"file_type": None, "startup_id": "startup-123", "file_name": "teste.pdf", "file_content": test_content},
        {"file_type": "pitch-pdf", "startup_id": None, "file_name": "teste.pdf", "file_content": test_content},
        {"file_type": "pitch-pdf", "startup_id": "startup-123", "file_name": None, "file_content": test_content},
        {"file_type": "pitch-pdf", "startup_id": "startup-123", "file_name": "teste.pdf", "file_content": None},
    ]
    
    print("\n===== TESTE DE PARÂMETROS FALTANTES =====")
    
    for i, test in enumerate(test_cases):
        missing = [k for k, v in test.items() if v is None]
        missing_str = ", ".join(missing)
        
        print(f"\nCaso de teste #{i+1}: Parâmetro faltante: {missing_str}")
        
        # Criar dicionário para o corpo, removendo None
        body_dict = {k: v for k, v in test.items() if v is not None}
        
        # Criar evento de teste
        event = {
            "httpMethod": "POST",
            "path": "/upload",
            "headers": {
                "Content-Type": "application/json",
                "Origin": "http://localhost:3000"
            },
            "body": json.dumps(body_dict)
        }
        
        # Chamar o handler
        context = {}
        response = handler(event, context)
        
        # Verificar resposta
        print(f"Status: {response['statusCode']}")
        print(f"Corpo: {response['body']}")
        
        # Devemos esperar um erro 400
        expected_status = 400
        if response['statusCode'] == expected_status:
            print(f"✅ SUCESSO: Parâmetro faltante {missing_str} gerou status {expected_status} como esperado")
        else:
            print(f"❌ FALHA: Parâmetro faltante {missing_str} gerou status {response['statusCode']}, esperava {expected_status}")

def main():
    """Função principal para executar todos os testes"""
    print("===== TESTANDO LAMBDA processor.py =====")
    print("Nota: Este teste usa mocks para simular AWS e API externa")
    
    # Testar com diferentes tipos de arquivo
    test_with_file_types()
    
    # Testar com parâmetros faltando
    test_missing_parameters()
    
    print("\n===== TESTES CONCLUÍDOS =====")

if __name__ == "__main__":
    main()
