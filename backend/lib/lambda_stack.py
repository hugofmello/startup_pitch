import os
from aws_cdk import (
    Stack,
    Duration,
    CfnOutput,
    Fn,
    aws_lambda as lambda_,
)
from constructs import Construct
import aws_cdk.aws_s3 as s3
import aws_cdk.aws_dynamodb as dynamodb


class LambdaStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Importar recursos da stack de infraestrutura
        upload_bucket_name = Fn.import_value("UploadBucketName")
        tasks_table_name = Fn.import_value("TasksTableName")
        results_table_name = Fn.import_value("ResultsTableName")
        startups_table_name = Fn.import_value("StartupsTableName")

        # Referência aos recursos importados
        upload_bucket = s3.Bucket.from_bucket_name(self, "ImportedUploadBucket", upload_bucket_name)
        tasks_table = dynamodb.Table.from_table_name(self, "ImportedTasksTable", tasks_table_name)
        results_table = dynamodb.Table.from_table_name(self, "ImportedResultsTable", results_table_name)
        startups_table = dynamodb.Table.from_table_name(self, "ImportedStartupsTable", startups_table_name)

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
        self.processor_lambda = lambda_.Function(
            self, "ProcessorLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="processor.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "UPLOAD_BUCKET_NAME": upload_bucket_name,
                "TASKS_TABLE_NAME": tasks_table_name,
                "VOLDEA_API_KEY": "gpIy7drK3k1ht4yDq5tsOIL302ePgkRaekUj6sx4",
                "PDF_DEPLOYMENT_ID": "7739ae6d-a0f5-4716-a7a9-99e7cf9cc7ab",
                "TXT_DEPLOYMENT_ID": "7739ae6d-a0f5-4716-a7a9-99e7cf9cc7ab",
                "EXCEL_DEPLOYMENT_ID": "0ed0a398-de99-4ca6-9f0e-408fc6ed54ee"
            }
        )

        # Lambda para consultar as tarefas
        self.query_lambda = lambda_.Function(
            self, "QueryLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="query.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "TASKS_TABLE_NAME": tasks_table_name,
                "RESULTS_TABLE_NAME": results_table_name,
                "VOLDEA_API_KEY": "gpIy7drK3k1ht4yDq5tsOIL302ePgkRaekUj6sx4"
            }
        )

        # Lambda para gerenciar startups
        self.startups_lambda = lambda_.Function(
            self, "StartupsLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="startups.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "STARTUPS_TABLE_NAME": startups_table_name
            }
        )
        
        # Lambda de teste
        self.test_lambda = lambda_.Function(
            self, "TestLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="test.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30)
        )

        # Lambda de teste simples (sem layers)
        self.hello_lambda = lambda_.Function(
            self, "HelloLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="simplehello.handler",
            timeout=Duration.seconds(30)
        )

        # Lambda para testar acesso ao DynamoDB
        self.dynamo_test_lambda = lambda_.Function(
            self, "DynamoTestLambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset(lambda_code_path),
            handler="dynamo_test.handler",
            layers=[lambda_layer],
            timeout=Duration.seconds(30),
            environment={
                "STARTUPS_TABLE_NAME": startups_table_name
            }
        )

        # Permissões para as Lambdas
        upload_bucket.grant_read_write(self.processor_lambda)
        tasks_table.grant_read_write_data(self.processor_lambda)
        tasks_table.grant_read_write_data(self.query_lambda)
        results_table.grant_read_write_data(self.query_lambda)
        startups_table.grant_read_write_data(self.startups_lambda)
        startups_table.grant_read(self.dynamo_test_lambda)

        # Exportar ARNs das Lambdas
        CfnOutput(self, "ProcessorLambdaArn", value=self.processor_lambda.function_arn, export_name="ProcessorLambdaArn")
        CfnOutput(self, "QueryLambdaArn", value=self.query_lambda.function_arn, export_name="QueryLambdaArn")
        CfnOutput(self, "StartupsLambdaArn", value=self.startups_lambda.function_arn, export_name="StartupsLambdaArn")
        CfnOutput(self, "TestLambdaArn", value=self.test_lambda.function_arn, export_name="TestLambdaArn")
        CfnOutput(self, "HelloLambdaArn", value=self.hello_lambda.function_arn, export_name="HelloLambdaArn")
        CfnOutput(self, "DynamoTestLambdaArn", value=self.dynamo_test_lambda.function_arn, export_name="DynamoTestLambdaArn")
