const path = require("path");
const envalid = require("envalid");

const { str } = envalid;

const env = envalid.cleanEnv(
	process.env,
	{
		AWS_LAMBDA_FUNCTION_NAME: str({ default: "" }),
		EXECUTION_ID: str({ default: "" }),
		EXECUTION_NAME: str({ default: "" }),
		EXECUTION_STATE_NAME: str({ default: "" }),
		S3_BUCKET_NAME: str({ default: "" }),
		SENTRY_DSN: str({ default: "" }),
		AWS_ACCESS_ID: str({ default: "" }),
		AWS_SECRET_KEY: str({ default: "" })
	},
	{
		dotEnvPath: path.resolve(
			__dirname,
			`../../.env.${process.env.NODE_ENV || "development"}`
		)
	}
);

module.exports.isProd = env.isProduction;
module.exports.isTest = env.isTest;
module.exports.functionName = env.AWS_LAMBDA_FUNCTION_NAME;
module.exports.isLambda = !!env.AWS_LAMBDA_FUNCTION_NAME;
module.exports.executionId = env.EXECUTION_ID;
module.exports.executionName = env.EXECUTION_NAME;
module.exports.executionStateName = env.EXECUTION_STATE_NAME;
module.exports.s3BucketName = env.S3_BUCKET_NAME;
module.exports.sentryDSN = env.SENTRY_DSN;
module.exports.awsCredentials =
	!!env.AWS_ACCESS_ID && !!env.AWS_SECRET_KEY
		? {
				accessKeyId: env.AWS_ACCESS_ID,
				secretAccessKey: env.AWS_SECRET_KEY
		  }
		: {};
