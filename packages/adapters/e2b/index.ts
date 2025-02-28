import { Sandbox } from '@e2b/code-interpreter';
import type { AIMAdapter } from '../../core/types';

export const codeAdapter: AIMAdapter = {
  type: 'code',
  handlers: {
    eval: async ({ code, language, variables }, { stateManager }) => {
      const apiKey = stateManager.getSecret('E2B_API_KEY');

      const sbx = await Sandbox.create({
        apiKey: apiKey || '',
        logger: console,
      });
      const execution = await sbx.runCode(code, { language });
      await sbx.kill();
      return execution.toJSON();
    },
  },
};
