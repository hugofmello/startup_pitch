#!/usr/bin/env python3
import os

import aws_cdk as cdk

from lib.infra_stack import InfrastructureStack
from lib.lambda_stack import LambdaStack
from lib.api_stack import ApiGatewayStack

app = cdk.App()

# Criar stacks na ordem correta de dependência
infra_stack = InfrastructureStack(app, "VoldeaInfraStack")
lambda_stack = LambdaStack(app, "VoldeaLambdaStack")
api_stack = ApiGatewayStack(app, "VoldeaApiStack")

# Definir dependência explícita entre as stacks
lambda_stack.add_dependency(infra_stack)
api_stack.add_dependency(lambda_stack)

app.synth()
