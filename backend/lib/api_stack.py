from aws_cdk import (
    Stack,
    CfnOutput,
    Fn,
    aws_apigateway as apigateway,
)
from constructs import Construct
import aws_cdk.aws_lambda as lambda_


class ApiGatewayStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Importar ARNs das Lambdas
        processor_lambda_arn = Fn.import_value("ProcessorLambdaArn")
        query_lambda_arn = Fn.import_value("QueryLambdaArn")
        startups_lambda_arn = Fn.import_value("StartupsLambdaArn")
        test_lambda_arn = Fn.import_value("TestLambdaArn")
        hello_lambda_arn = Fn.import_value("HelloLambdaArn")
        dynamo_test_lambda_arn = Fn.import_value("DynamoTestLambdaArn")

        # Referência às funções Lambda importadas
        processor_lambda = lambda_.Function.from_function_arn(
            self, "ImportedProcessorLambda", processor_lambda_arn
        )
        query_lambda = lambda_.Function.from_function_arn(
            self, "ImportedQueryLambda", query_lambda_arn
        )
        startups_lambda = lambda_.Function.from_function_arn(
            self, "ImportedStartupsLambda", startups_lambda_arn
        )
        test_lambda = lambda_.Function.from_function_arn(
            self, "ImportedTestLambda", test_lambda_arn
        )
        hello_lambda = lambda_.Function.from_function_arn(
            self, "ImportedHelloLambda", hello_lambda_arn
        )
        dynamo_test_lambda = lambda_.Function.from_function_arn(
            self, "ImportedDynamoTestLambda", dynamo_test_lambda_arn
        )

        # Criar API Gateway
        api = apigateway.RestApi(
            self, "VoldeaIntegrationApi",
            rest_api_name="VoldeaIntegrationApi",
            description="API para integração com Voldea",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=apigateway.Cors.DEFAULT_HEADERS
            ),
            binary_media_types=["*/*"]  # Permitir tipos binários para suportar uploads grandes
        )

        # Endpoints para upload de arquivos
        upload_resource = api.root.add_resource("upload")
        upload_integration = apigateway.LambdaIntegration(processor_lambda)
        upload_resource.add_method("POST", upload_integration)
        
        # Endpoint para status de upload em chunks
        upload_status_resource = upload_resource.add_resource("status")
        upload_status_integration = apigateway.LambdaIntegration(processor_lambda)
        upload_status_resource.add_method("GET", upload_status_integration)

        # Endpoints para consulta de tarefas
        tasks_resource = api.root.add_resource("tasks")
        tasks_integration = apigateway.LambdaIntegration(query_lambda)
        tasks_resource.add_method("GET", tasks_integration)
        
        task_resource = tasks_resource.add_resource("{taskId}")
        task_integration = apigateway.LambdaIntegration(query_lambda)
        task_resource.add_method("GET", task_integration)

        # Endpoints para gerenciamento de startups
        startups_resource = api.root.add_resource("startups")
        startups_integration = apigateway.LambdaIntegration(startups_lambda)
        startups_resource.add_method("GET", startups_integration)
        startups_resource.add_method("POST", startups_integration)
        
        startup_resource = startups_resource.add_resource("{startupId}")
        startup_integration = apigateway.LambdaIntegration(startups_lambda)
        startup_resource.add_method("GET", startup_integration)
        startup_resource.add_method("PUT", startup_integration)
        startup_resource.add_method("DELETE", startup_integration)

        # Criar API Gateway com configuração CORS
        cors_options = apigateway.CorsOptions(
            allow_origins=["*"],
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization", "Origin", "Accept"]
        )
        
        # Criar um novo API Gateway para teste
        test_api = apigateway.RestApi(
            self, "TestApi",
            rest_api_name="Voldea Test API",
            description="API para testes da aplicação Voldea",
            default_cors_preflight_options=cors_options,
            binary_media_types=["*/*"]  # Permitir tipos binários para suportar uploads grandes
        )
        
        # Endpoint de teste simples
        test_resource = test_api.root.add_resource("hello")
        test_integration = apigateway.LambdaIntegration(hello_lambda)
        test_resource.add_method("GET", test_integration)
        
        # Endpoint para teste
        test_resource = api.root.add_resource("test")
        test_integration = apigateway.LambdaIntegration(test_lambda)
        test_resource.add_method("GET", test_integration)
        
        # Endpoint para teste de DynamoDB
        dynamo_test_resource = api.root.add_resource("dynamo-test")
        dynamo_test_integration = apigateway.LambdaIntegration(dynamo_test_lambda)
        dynamo_test_resource.add_method("GET", dynamo_test_integration)

        # Exportar URL da API
        CfnOutput(self, "ApiEndpoint", value=api.url, export_name="ApiEndpoint")
        
        # Exportar URL da API de teste
        CfnOutput(self, "TestApiEndpoint", value=test_api.url, export_name="TestApiEndpoint")
