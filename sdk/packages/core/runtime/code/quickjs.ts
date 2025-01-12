import { quickJS } from '@sebastianwessel/quickjs';

export const runQuickJS = async () => {
    const { createRuntime } = await quickJS()
    const { evalCode } = await createRuntime({
        transformTypescript: true,
        allowFetch: true,
        allowFs: true,
    });
    return {
        evalCode
    };
};
