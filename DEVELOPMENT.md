# Development

To run AWS ParallelCluster UI locally, start by setting the following environment variables:

```bash
export AWS_ACCESS_KEY_ID=[...]
export AWS_SECRET_ACCESS_KEY=[...]
export AWS_DEFAULT_REGION=us-east-2
export API_VERSION="3.9.0"
export API_BASE_URL=https://[API_ID].execute-api.us-east-2.amazonaws.com/prod  # get this from ParallelClusterApi stack outputs
export ENV=dev
```

If you don't have a virtual environment setup already, you can run from the base dir of the project:
```bash
python3 -m venv venv
. ./venv/bin/activate
```

Install dependencies in your virtual environment:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Dependencies Management
When working on the project, you may need to add/change a dependency.

### Product Dependencies
To add a product dependency, you should add the dependency with a specified version to the `requirements.in` file, 
and generate `requirements.txt` using `pip-compile` from [pip-tools](https://github.com/jazzband/pip-tools),
which is part of dev dependencies (`requirements-dev.txt`). Then update the attribution document in
`frontend/resources/attributions/npm-python-attributions.txt` in the "Python third party dependencies" section 
accordingly with the new versions or dependencies from `requirements.txt`.

When changing a dependency in the frontend project you should add/Change it in `frontend/package.json`,
re-generate `frontend/package-lock.json` with `npm install` 
and update the attribution document in `frontend/resources/attributions/npm-python-attributions.txt` accordingly
in the "Javascript third party dependencies" section.

### Dev Dependencies
To add/change a development dependencies, you can directly change `requirements-dev.txt`.

## Backend with Cognito
From the Cognito service page of the AWS account where PCUI has been deployed, click on the user pool
and then on the *App Integration* tab. In the App client list at the bottom, make note of the *Client ID*, then
click on the App client and click *Edit* in the *Hosted UI* section, adding `http://localhost:5001/login` to the
*Allowed callback URLs*.

Then export the following variables:

```bash
export SECRET_ID=<the value of the UserPoolClientSecretName output from the PCUI stack>
export SITE_URL=http://localhost:5001
export AUDIENCE=<the value of the Client ID noted in the previous step>
export AUTH_PATH=<the UserPoolAuthDomain output of the ParallelClusterCognito nested stack>
```

Set `DISABLE_AUTH=True` in `api/utils.py` to facilitate live reloading.
Notice that cluster creation (both concrete and dryrun) is expected to fail
when authentication is disabled.

Start the API backend by running:

```bash
./scripts/run_flask.sh
```

Start the React frontend by running:

```bash
cd frontend/
npm install # if this is your first time starting the frontend
npm run dev
```

Lastly, navigate to [http://localhost:5001](http://localhost:5001)

## Typescript
The project has been converted to Typescript using [ts-migrate](https://github.com/airbnb/ts-migrate/tree/master/packages/ts-migrate)(an in depth explanation can be found [here](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc)).
The tool automatically adds comments similar to `// @ts-expect-error` when typing errors cannot be fixed automatically: if you fix a type error either by adding a missing third party declaration or tweaking the signature of a function, you can adjust automatically the codebase and remove `//@ts-ignore` comments using `npm run ts-reignore`.

## Testing

Launch tests of the API backend by running:

```bash
pytest
```
For detailed information on how to invoke `pytest`, see this [resource](https://docs.pytest.org/en/7.1.x/how-to/usage.html).

To run frontend tests:
```
npm test
```
