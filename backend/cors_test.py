#!/usr/bin/env python3
import requests
import base64
import json
import os
import sys
import argparse

# Configuração base
API_URL = "https://i76vr76m51.execute-api.us-east-1.amazonaws.com/prod"
LOCAL_PROXY_URL = "http://localhost:3001/api"

def test_cors_headers(base_url):
    """Testa os cabeçalhos CORS retornados pelo servidor"""
    print("\n🔍 Testando cabeçalhos CORS...")
    
    # Definir origem de teste
    test_origin = "http://localhost:3000"
    
    # Realizar solicitação OPTIONS para verificar cabeçalhos CORS
    headers = {
        "Origin": test_origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    try:
        response = requests.options(f"{base_url}/startups", headers=headers)
        
        print(f"Status: {response.status_code}")
        print("Cabeçalhos recebidos:")
        
        # Verificar cabeçalhos CORS específicos
        cors_headers = {
            "Access-Control-Allow-Origin": test_origin,
            "Access-Control-Allow-Methods": None,
            "Access-Control-Allow-Headers": None
        }
        
        all_headers_present = True
        
        for header, expected_value in cors_headers.items():
            value = response.headers.get(header)
            if value:
                if expected_value and expected_value != value:
                    print(f"  ❌ {header}: {value} (esperado: {expected_value})")
                    all_headers_present = False
                else:
                    print(f"  ✅ {header}: {value}")
            else:
                print(f"  ❌ {header}: Não encontrado")
                all_headers_present = False
        
        # Mostrar todos os cabeçalhos para referência
        print("\nTodos os cabeçalhos:")
        for header, value in response.headers.items():
            if not header.startswith("Access-Control"):
                print(f"  {header}: {value}")
        
        if all_headers_present:
            print("\n✅ Cabeçalhos CORS configurados corretamente!")
        else:
            print("\n⚠️ Alguns cabeçalhos CORS estão ausentes ou incorretos.")
            
        return all_headers_present
    
    except Exception as e:
        print(f"\n❌ Erro ao testar cabeçalhos CORS: {str(e)}")
        return False

def test_startups_endpoint(base_url):
    """Testa o endpoint de startups"""
    print("\n🔍 Testando endpoint de startups...")
    
    try:
        response = requests.get(f"{base_url}/startups")
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            startups = response.json().get("data", [])
            print(f"Número de startups retornadas: {len(startups)}")
            
            if startups:
                print("\nPrimeira startup:")
                startup = startups[0]
                for key, value in startup.items():
                    print(f"  {key}: {value}")
                
            print("\n✅ Endpoint de startups funcionando corretamente!")
            return True
        else:
            print(f"\n❌ Falha ao acessar endpoint de startups: {response.text}")
            return False
    
    except Exception as e:
        print(f"\n❌ Erro ao testar endpoint de startups: {str(e)}")
        return False

def test_upload_endpoint(base_url, file_path, startup_id, file_type):
    """Testa o endpoint de upload"""
    print("\n🔍 Testando endpoint de upload...")
    
    try:
        # Verificar se o arquivo existe
        if not os.path.exists(file_path):
            print(f"\n❌ Arquivo não encontrado: {file_path}")
            return False
        
        # Ler e converter arquivo para base64
        with open(file_path, "rb") as file:
            file_content = file.read()
            file_content_base64 = base64.b64encode(file_content).decode("utf-8")
        
        # Preparar dados para upload
        file_name = os.path.basename(file_path)
        upload_data = {
            "fileContent": file_content_base64,
            "fileName": file_name,
            "fileType": file_type,
            "startupId": startup_id
        }
        
        print(f"Enviando arquivo: {file_name}")
        print(f"Tipo: {file_type}")
        print(f"Startup ID: {startup_id}")
        print(f"Tamanho do arquivo: {len(file_content)} bytes")
        
        # Fazer upload
        headers = {
            "Content-Type": "application/json"
        }
        
        response = requests.post(f"{base_url}/upload", json=upload_data, headers=headers)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\nResposta:")
            print(json.dumps(result, indent=2))
            print("\n✅ Upload realizado com sucesso!")
            return True
        else:
            print(f"\n❌ Falha no upload: {response.text}")
            print("\nCabeçalhos de resposta:")
            for header, value in response.headers.items():
                print(f"  {header}: {value}")
            return False
    
    except Exception as e:
        print(f"\n❌ Erro ao testar endpoint de upload: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Testa a configuração CORS e endpoints da API")
    parser.add_argument("--local", action="store_true", help="Usa o proxy local em vez da API direta")
    parser.add_argument("--upload", help="Caminho para o arquivo a ser enviado")
    parser.add_argument("--startup", help="ID da startup para teste de upload")
    parser.add_argument("--type", choices=["pdf", "txt", "excel"], help="Tipo do arquivo")
    
    args = parser.parse_args()
    
    # Determinar URL base
    base_url = LOCAL_PROXY_URL if args.local else API_URL
    print(f"🔗 Usando URL base: {base_url}")
    
    # Testar cabeçalhos CORS
    cors_ok = test_cors_headers(base_url)
    
    # Testar endpoint de startups
    startups_ok = test_startups_endpoint(base_url)
    
    # Testar upload se solicitado
    upload_ok = True
    if args.upload and args.startup and args.type:
        upload_ok = test_upload_endpoint(base_url, args.upload, args.startup, args.type)
    
    # Resumo final
    print("\n===== RESUMO DOS TESTES =====")
    print(f"CORS: {'✅ OK' if cors_ok else '❌ FALHA'}")
    print(f"Startups: {'✅ OK' if startups_ok else '❌ FALHA'}")
    if args.upload:
        print(f"Upload: {'✅ OK' if upload_ok else '❌ FALHA'}")
    
    # Código de saída
    if not (cors_ok and startups_ok and upload_ok):
        sys.exit(1)

if __name__ == "__main__":
    main()
