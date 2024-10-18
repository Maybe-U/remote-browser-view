// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';



const config = {
    entry: {
        web: './test/webIndex.js',
      },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'test/dist'),
        // libraryTarget: 'commonjs2' // 适用于 Node.js
    },
    devServer: {
        open: true,
        host: '0.0.0.0',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'test/index.html',
        }),
        // Add your plugins here
        // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    ],
    module: {
        rules: [
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            }
        ],
    },
    // devtool: 'source-map',
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
