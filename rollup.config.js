import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
    { 
        input: 'src/web/WebReplayManager.js', // 入口文件
        output: [
          {
            file: './dist/browser/index.js',
            format: 'esm',  // 将软件包保存为 ES 模块文件
            name: 'webPlay',
            // sourcemap: true
          }
        ],
        watch: {  // 配置监听处理
          exclude: 'node_modules/**'
        },
        plugins: [
          // 使用插件 @rollup/plugin-babel
          babel({
            babelHelpers: 'bundled',
            exclude: 'node_modules/**'
          })
        ],
        external: ['rrweb']
      },
      { 
        input: 'src/server/server.cjs', // 入口文件
        output: [
          {
            file: './dist/node/index.cjs',
            format: 'cjs',  // CommonJS，适用于 Node 和 Browserify/Webpack
            name: 'remoteServer',
            exports:"named",
            // sourcemap: true
          }
        ],
        watch: {  // 配置监听处理
          exclude: 'node_modules/**'
        },
        plugins: [
            resolve(),
            commonjs(),
            copy({
              targets: [
                { src: 'src/server/rrweb.min.js', dest: 'srv/' },
                { src: 'src/server/InjectTargetRRWeb.js', dest: 'srv/' }
                // 添加其他文件的复制配置
              ]
            })
        ],
        external: ['path','url','querystring','ws','playwright','uuid']
      }      
]