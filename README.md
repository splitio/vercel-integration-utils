# Vercel integration using Edge Config and Split SDK

## Overview

This package provides a Split Storage Wrapper for Vercel Edge Config, a low latency data storage used to store and retrieve feature flag definitions for running the Split SDK on the Edge.

Keeping feature flag definitions within an Edge Config instance enables the Split SDK to operate in [partial consumer mode](https://help.split.io/hc/en-us/articles/360058730852-Browser-SDK#sharing-state-with-a-pluggable-storage). This mode means that the SDK doesn't fetch feature flags from the Split backend, and instead relies on those stored in the Edge Config, thereby significantly reducing the latency during feature flag evaluations.

The package includes the storage wrapper module (`src/EdgeConfigWrapper.ts`), as well as an `example` folder to quickly get started with the integration.

The project overall architecture is ilustrated in the following diagram:

<p align="center">
  <img alt="Overview" src="./diagram.png" width="720">
</p>

## Setup

1. Install the [Split integration](https://TODO) to start synchronizing feature flag definitions into your Edge Config instance.
2. Setup the Split SDK in your application project:
    - Install dependencies: `npm install @splitsoftware/splitio-browserjs @splitsoftware/vercel-integration-utils`
    - Import and use the Split SDK with the EdgeConfig wrapper in your Edge function or middleware (check [API route example here](./example/pages/api/get-treatment.js)):
    ```javascript
    import { SplitFactory, PluggableStorage } from '@splitsoftware/splitio-browserjs';
    import { EdgeConfigWrapper } from '@splitsoftware/vercel-integration-utils';
    import { NextApiRequest, NextApiResponse } from 'next';

    // Deploy as an Edge function
    export const config = { runtime: "edge" };

    export default async function handler(req) {
      // Extract user key. In this case from a request query param
      const { searchParams } = new URL(req.url)
      const userKey = searchParams.get('userKey');

      const splitClient = SplitFactory({
        core: {
          authorizationKey: '<YOUR_SPLIT_API_KEY>',
          key: userKey,
        },
        mode: 'PARTIAL_CONSUMER',
        storage: PluggableStorage({
          wrapper: EdgeConfigWrapper({
            // The Edge Config item where Split stores feature flag definitions, specified in the Split integration step
            edgeConfigKey: '<YOUR_EDGE_CONFIG_ITEM_KEY>'
          })
        })
      }).client();

      // Wait to load feature flag definitions from the Edge Config
      await splitClient.ready();

      const treatment = await client.getTreatment('SOME_FEATURE_FLAG');

      // Destroy and flush impressions asynchronously. Avoid 'await' to not delay the response.
      client.destroy();

      return new Response(JSON.stringify({ treatment }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    ```
    - Remember to update the Split API Key and Edge Config item key in the code above.
3. Deploy your application to Vercel and test the integration.