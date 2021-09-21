import { Construct } from "@aws-cdk/core";
import { Bundling } from '@aws-cdk/aws-lambda-nodejs/lib/bundling';
import { Runtime } from '@aws-cdk/aws-lambda';
import { experimental } from '@aws-cdk/aws-cloudfront';
import { EdgeFunction } from "@aws-cdk/aws-cloudfront/lib/experimental";

export interface RedirectFunctionOptions {
    redirectHost: string,
    // Case-sensitive regular expression matching cloudfront-viewer-country
    supportedRegionsExpression: string,
    // default region code to use when not matched
    defaultRegion: string
}

export class RedirectFunction extends Construct {
    readonly edgeFunction: EdgeFunction;

    constructor(scope: Construct, id: string, options: RedirectFunctionOptions) {
        super(scope, id);

        this.edgeFunction = new experimental.EdgeFunction(
            this,
            'RedirectFunction',
            {
              code: Bundling.bundle({
                entry: `${__dirname}/handlers/redirect.ts`,
                runtime: Runtime.NODEJS_12_X,
                sourceMap: true,
                projectRoot: `${__dirname}/handlers/`,
                depsLockFilePath: `${__dirname}/handlers/package-lock.json`,
                // Define options replace values at build time so we can use environment variables to test locally
                // and replace during build/deploy with static values. This gets around the lambda@edge limitation
                // of no environment variables at runtime.
                define: {
                  'process.env.REDIRECT_HOST': JSON.stringify(options.redirectHost),
                  'process.env.SUPPORTED_REGIONS': JSON.stringify(options.supportedRegionsExpression),
                  'process.env.DEFAULT_REGION': JSON.stringify(options.defaultRegion),
                }
              }),
              runtime: Runtime.NODEJS_12_X,
              handler: 'index.handler',
            }
          );
    }
}
