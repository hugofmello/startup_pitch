#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.backend_stack import BackendStack

app = cdk.App()
BackendStack(app, "VoldeaIntegrationStack")

app.synth()
