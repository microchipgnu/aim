import type { AIMAdapter } from '../../core/types';
import { runQuickJS } from './quickjs';

export const codeAdapter: AIMAdapter = {
  type: 'code',
  init: async () => {
    console.log('codeAdapter init');
  },
  handlers: {
    eval: async (args: {
      code: string;
      language: string;
      variables: Record<string, any>;
    }) => {
      const { evalCode } = await runQuickJS({
        env: {
          __AIM_VARIABLES__: JSON.stringify(args.variables),
        },
      });

      const evalResult = await evalCode(`
                import { aimVariables } from "load-vars";
                import { evaluate } from "eval-code";
        
                const run = async () => {
                    ${args.code}
                }
        
                export default await run();
            `);

      return evalResult;
    },
  },
};
