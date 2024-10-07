# How to use rollback/rollforward scripts

The rollback and rollforward scripts in this folder should be used when there are problems on a published release. In particular in the frontend or backend code.

To work properly, the scripts need Admin credentials of the account in which the public ECR is.

As the code is shipped as a Docker-based Lambda in a public ECR, to rollback the code we need to remove the "latest" tag from the broken released image and assign it to the image that was pushed before (latest-1 release).
So the customers won't pull the broken release again.

This is done by simply launching 

```
bash ./rollback_awslambda_image.sh
```

If the rollback script is launched by mistake, the rollforward script helps to restore the situation, putting the "latest" tag on the lastly pushed release, the script can be launched as

```
bash ./rollforward_awslambda_image.sh
```

**NOTE:** The rollforward script should be used only if the rollback script is launched by mistake, the normal procedure to publish a new release after a rollback is by launching the `build_and_release_image.sh --tag YYYY.MM.REVISION` after fixing the code

# How to deploy PCUI in personal account
Create configurations files for your personal environment (una tantum):

```
bash scripts/setup-env.sh [ENVIRONMENT_NAME]
```

where *ENVIRONMENT_NAME* could be your login.

Adapt the configurations files `[ENVIRONMENT_NAME]-*` created in `infrastructure/environments` with your data.

Deploy the local PCUI to your environment:

```
bash scripts/deploy.sh [ENVIRONMENT_NAME]
```

# How to deploy the PCUI image to a private ECR repository
Create an ECR *private* repository in your personal account, where PCUI Docker images will be stored for testing:

```
aws ecr create-repository \
--region us-east-1 \
--repository-name parallelcluster-ui \
--image-tag-mutability MUTABLE
```

Retrieve the repository endpoint:

```
REPOSITORY_URI=$(aws ecr describe-repositories \
--region us-east-1 \
--repository-name parallelcluster-ui \
--query "repositories[0].repositoryUri" \
--output text)
ECR_ENDPOINT=$(echo $REPOSITORY_URI | cut -d '/' -f 1)
```

Build and push the image:

```
./scripts/build_and_release_image.sh \
--ecr-region us-east-1 \
--ecr-endpoint $ECR_ENDPOINT \
--tag YYYY.MM.NN
```
