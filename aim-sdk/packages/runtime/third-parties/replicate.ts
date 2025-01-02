import { getEnvValue } from "../envs";
import Replicate from "replicate";

export const replicate = {
  runModelAndWait: async (modelVersion: `${string}/${string}`, input: unknown) => {
    const token = getEnvValue('REPLICATE_API_KEY');
    
    const replicateClient = new Replicate({
      auth: token,
    });

    try {
      const output = await replicateClient.run(modelVersion, {
        input: input as object
      });

      return output;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Replicate API error: ${error.message}`);
      }
      throw error;
    }
  },

  getModelSchema: async (modelVersion: `${string}/${string}`) => {
    const token = getEnvValue('REPLICATE_API_KEY');
    
    const replicateClient = new Replicate({
      auth: token,
    });

    try {
      const [owner, name] = modelVersion.split('/');
      const model = await replicateClient.models.get(owner, name);
      return model.latest_version?.openapi_schema;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Replicate API error getting model schema: ${error.message}`);
      }
      throw error;
    }
  }
}