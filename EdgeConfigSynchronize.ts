import { EdgeConfigApiStorageWrapper } from "./EdgeConfigApiStorageWrapper";
import { Synchronizer } from "@splitsoftware/splitio-sync-tools";

export const config = { runtime: "edge" };

export async function EdgeConfigSynchronize(options: {
  edgeConfigId: string;
  teamId: string;
  apiToken: string;
  edgeConfigKey: string;
  splitApiKey: string;
  waitUntil: (promise: Promise<any>) => void;
}) {
  const { edgeConfigId, teamId, apiToken, edgeConfigKey, splitApiKey, waitUntil } = options

  if (!edgeConfigId) throw new Error(`Unable to synchronize, edgeConfigId not provided`);
  if (!apiToken) throw new Error(`Unable to synchronize, apiToken not provided`);
  if (!edgeConfigKey) throw new Error(`Unable to synchronize, edgeConfigKey not provided`);
  if (!splitApiKey) throw new Error(`Unable to synchronize, splitApiKey not provided`);

  const synchronizer = new Synchronizer({
    core: { authorizationKey: splitApiKey },
    storage: {
      type: "PLUGGABLE",
      wrapper: EdgeConfigApiStorageWrapper({
        teamId: teamId,
        edgeConfigId: edgeConfigId,
        apiToken: apiToken,
        edgeConfigKey: edgeConfigKey,
        waitUntil: waitUntil,
      }),
    },
    // Disable or keep only ERROR log level in production, to minimize performance impact
    debug: "ERROR",
  });

  return synchronizer.execute().then(() => {
    console.log('Synchronization success');
  },
  () => {
    console.log('Synchronization failed');
  });

}
