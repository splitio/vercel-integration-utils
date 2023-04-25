import { SplitFactory, PluggableStorage, ErrorLogger } from '@splitsoftware/splitio-browserjs';
import { EdgeConfigWrapper } from '@splitsoftware/edge-config-wrapper';

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Run API route as an Edge function rather than a Serverless one, because the SDK uses Fetch API to flush data, which is available in Edge runtime but not in Serverless.
export const config = { runtime: "edge" };

const SPLIT_NAME = 'test_split';

export default async function handler(req) {
  // Extract userKey from request query param
  const { searchParams } = new URL(req.url)
  const userKey = searchParams.get('userKey');

  /** @type {SplitIO.IAsyncClient} */
  const client = SplitFactory({
    core: {
      authorizationKey: process.env.SPLIT_API_KEY,
      key: userKey
    },
    mode: 'consumer_partial',
    storage: PluggableStorage({
      wrapper: EdgeConfigWrapper({
        edgeConfigKey: process.env.EDGE_CONFIG_ITEM_KEY
      }),
    }),
    // Disable or keep only ERROR log level in production, to minimize performance impact
    debug: ErrorLogger(),
  }).client();

  await client.ready();

  const treatment = await client.getTreatment(SPLIT_NAME);

  // Flush data asynchronously
  client.destroy();

  return new Response(JSON.stringify({ treatment }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
