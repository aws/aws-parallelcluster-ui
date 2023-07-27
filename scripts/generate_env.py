#!/usr/bin/env python3
import boto3
import argparse
from os import path

parser = argparse.ArgumentParser()
parser.add_argument('-n', '--stack-name', type=str, required=True, help="Name of PCUI stack")
parser.add_argument('-r', '--region', type=str, required=False, help="Region of PCUI stack if different from AWS_DEFAULT_REGION")
args = parser.parse_args()

client = boto3.client('cloudformation', region_name=args.region)
	
def get_nested_stack_name(logical_id, stack_name=args.stack_name):
	nested_stack = client.describe_stack_resource(StackName=stack_name, LogicalResourceId=logical_id)
	return nested_stack['StackResourceDetail']['PhysicalResourceId']

def get_output(stack_name, output_key):
	stack = client.describe_stacks(StackName=stack_name)['Stacks'][0]
	return next((o.get("OutputValue") for o in stack.get('Outputs', []) if o.get("OutputKey") == output_key), None)

pc_api_stack_name = get_nested_stack_name('ParallelClusterApi')
pcui_cognito_stack_name = get_nested_stack_name('Cognito')
outpath = f"{path.dirname(path.dirname(__file__))}/.env"

with open(outpath, 'w') as file:
	file.write(f"export API_BASE_URL={get_output(pc_api_stack_name, 'ParallelClusterApiInvokeUrl')}\n")
	file.write("export ENV=dev\n")
	file.write(f"export SECRET_ID={get_output(args.stack_name, 'UserPoolClientSecretName')}\n")
	file.write("export SITE_URL=http://localhost:5001\n")
	file.write(f"export AUDIENCE={get_output(args.stack_name, 'AppClientId')}\n")
	file.write(f"export AUTH_PATH={get_output(pcui_cognito_stack_name, 'UserPoolAuthDomain')}")
	
print(f"Wrote to {outpath}")
