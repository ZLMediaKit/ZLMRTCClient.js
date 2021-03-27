// Rollup plugins
import { babel } from '@rollup/plugin-babel';
import eslint from '@rollup/plugin-eslint';
import replace from '@rollup/plugin-replace';
import { nodeResolve }  from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/export.js',
    output: [
        {
            file: 'demo/ZLMRTCClient.js',
            format: 'iife',
            name: 'ZLMRTCClient',
            sourcemap: true // 'inline'
        }
    ],
    plugins: [
        eslint(),
        nodeResolve({
            browser: true,
        }),
        commonjs(),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled' 
            
        }),
        replace({
            exclude: 'node_modules/**',
            preventAssignment:true,
            ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        (process.env.NODE_ENV === 'production'),
    ],
};