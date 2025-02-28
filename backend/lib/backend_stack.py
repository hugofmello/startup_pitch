from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_s3_notifications as s3n,
    aws_lambda_event_sources as lambda_event_sources,
    aws_cognito as cognito,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3_deployment as s3deploy,
    CfnOutput
)
from constructs import Construct
import os

class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Criar bucket S3 para armazenar os arquivos enviados
        upload_bucket = s3.Bucket(
            self, "UploadBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                )
            ]
        )

        # Criar bucket S3 para o frontend
        frontend_bucket = s3.Bucket(
            self, "FrontendBucket",
            website_index_document="index.html",
            website_error_document="index.html",
            public_read_access=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                )
            ]
        )

        # Criar as tabelas do DynamoDB
        # Tabela para startups
        startups_table = dynamodb.Table(
            self, "StartupsTable",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Tabela para tarefas
        tasks_table = dynamodb.Table(
            self, "TasksTable",
            partition_key=dynamodb.Attribute(name="taskId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Tabela para resultados
        results_table = dynamodb.Table(
            self, "ResultsTable",
            partition_key=dynamodb.Attribute(name="taskId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Caminho absoluto para o diretório lambda_code
        lambda_code_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "lambda_code")
        
        # Criando uma camada Lambda para dependências compartilhadas
        lambda_layer = lambda_.LayerVersion(
            self, "CommonDependenciesLayer",
            code=lambda_.Code.from_asset(os.path.join(lambda_code_path, "layer")),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_9],
            description="Camada com dependências compartilhadas"
        )

        # Criação das Lambdas
        # Lambda para processar upload e chamar a API da Voldea
        processor_lambda = lambda_.Function(
            self, "ProcessorLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(os.path.join(lambda_code_path, "processor_function")),
            handler="processor.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "UPLOAD_BUCKET_NAME": upload_bucket.bucket_name,
                "TASKS_TABLE_NAME": tasks_table.table_name,
                "VOLDEA_API_KEY": "gpIy7drK3k1ht4yDq5tsOIL302ePgkRaekUj6sx4",
                "PDF_DEPLOYMENT_ID": "7739ae6d-a0f5-4716-a7a9-99e7cf9cc7ab",
                "TXT_DEPLOYMENT_ID": "7739ae6d-a0f5-4716-a7a9-99e7cf9cc7ab",
                "EXCEL_DEPLOYMENT_ID": "0ed0a398-de99-4ca6-9f0e-408fc6ed54ee"
            }
        )

        # Lambda para consultar as tarefas
        query_lambda = lambda_.Function(
            self, "QueryLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(os.path.join(lambda_code_path, "query_function")),
            handler="query.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "TASKS_TABLE_NAME": tasks_table.table_name,
                "RESULTS_TABLE_NAME": results_table.table_name,
                "VOLDEA_API_KEY": "gpIy7drK3k1ht4yDq5tsOIL302ePgkRaekUj6sx4"
            }
        )

        # Lambda para gerenciar startups
        startups_lambda = lambda_.Function(
            self, "StartupsLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(os.path.join(lambda_code_path, "startups_function")),
            handler="startups.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "STARTUPS_TABLE_NAME": startups_table.table_name
            }
        )

        # Permissões para as Lambdas
        upload_bucket.grant_read_write(processor_lambda)
        tasks_table.grant_read_write_data(processor_lambda)
        tasks_table.grant_read_write_data(query_lambda)
        results_table.grant_read_write_data(query_lambda)
        startups_table.grant_read_write_data(startups_lambda)

        # Criar API Gateway
        api = apigateway.RestApi(
            self, "VoldeaIntegrationApi",
            rest_api_name="VoldeaIntegrationApi",
            description="API para integração com Voldea",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["https://d399xpdg2x0ndi.cloudfront.net", "http://localhost:3000"],
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token", "X-Amz-User-Agent"],
                allow_credentials=True
            )
        )

        # Endpoints para upload de arquivos
        upload_resource = api.root.add_resource("upload")
        upload_integration = apigateway.LambdaIntegration(processor_lambda)
        upload_resource.add_method("POST", upload_integration)

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

        # Criar distribuição CloudFront para o frontend
        distribution = cloudfront.Distribution(
            self, "FrontendDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(frontend_bucket),
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(30)
                ),
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.minutes(30)
                )
            ]
        )

        # Exportar valores importantes como saídas do CloudFormation
        CfnOutput(self, "ApiEndpoint", value=api.url, export_name="ApiEndpoint")
        CfnOutput(self, "UploadBucketName", value=upload_bucket.bucket_name, export_name="UploadBucketName")
        CfnOutput(self, "FrontendBucketName", value=frontend_bucket.bucket_name, export_name="FrontendBucketName")
        CfnOutput(self, "CloudFrontURL", value=f"https://{distribution.distribution_domain_name}", export_name="CloudFrontURL")
        
        # Armazenar valores para uso no código
        self.api_url = api.url
        self.upload_bucket_name = upload_bucket.bucket_name
        self.frontend_bucket_name = frontend_bucket.bucket_name
        self.distribution_url = f"https://{distribution.distribution_domain_name}"
        self.tasks_table_name = tasks_table.table_name
        self.results_table_name = results_table.table_name
        self.startups_table_name = startups_table.table_name
