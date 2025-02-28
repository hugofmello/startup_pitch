from aws_cdk import (
    Stack,
    RemovalPolicy,
    CfnOutput,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    Duration,
)
from constructs import Construct


class InfrastructureStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Criar bucket S3 para armazenar os arquivos enviados
        self.upload_bucket = s3.Bucket(
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
        self.frontend_bucket = s3.Bucket(
            self, "FrontendBucket",
            website_index_document="index.html",
            website_error_document="index.html",
            public_read_access=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ACLS,
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
        self.startups_table = dynamodb.Table(
            self, "StartupsTable",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Tabela para tarefas
        self.tasks_table = dynamodb.Table(
            self, "TasksTable",
            partition_key=dynamodb.Attribute(name="taskId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Tabela para resultados
        self.results_table = dynamodb.Table(
            self, "ResultsTable",
            partition_key=dynamodb.Attribute(name="taskId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Criar distribuição CloudFront para o frontend
        self.distribution = cloudfront.Distribution(
            self, "FrontendDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.frontend_bucket),
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
        CfnOutput(self, "UploadBucketName", value=self.upload_bucket.bucket_name, export_name="UploadBucketName")
        CfnOutput(self, "FrontendBucketName", value=self.frontend_bucket.bucket_name, export_name="FrontendBucketName")
        CfnOutput(self, "TasksTableName", value=self.tasks_table.table_name, export_name="TasksTableName")
        CfnOutput(self, "ResultsTableName", value=self.results_table.table_name, export_name="ResultsTableName")
        CfnOutput(self, "StartupsTableName", value=self.startups_table.table_name, export_name="StartupsTableName")
        CfnOutput(self, "CloudFrontURL", value=f"https://{self.distribution.distribution_domain_name}", export_name="CloudFrontURL")
