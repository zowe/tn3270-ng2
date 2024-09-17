

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const baseConfig = require(path.resolve(process.env.MVD_DESKTOP_DIR, 'plugin-config/webpack5.base.js'));
const AotPlugin = require('@ngtools/webpack').AngularWebpackPlugin;

if (process.env.MVD_DESKTOP_DIR == null) {
  throw new Error('You must specify MVD_DESKTOP_DIR in your environment');
}

const config = {
  entry: [
    path.resolve(__dirname, './src/plugin.ts')
  ],
  output: {
    path: path.resolve(__dirname, '../web'),
    filename: 'main.js',
    clean: true
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './node_modules/'),
    }
  },
  module: {
    rules: [
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        use: ['@ngtools/webpack']
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, './src/assets/icon.png'),
          to: path.resolve('../web/assets/icon.png')
        }
      ]
    }),
    new CompressionPlugin({
      threshold: 100000,
      minRatio: 0.8
    }),
    new AotPlugin({
      tsConfigPath: './tsconfig.json',
      entryModule: './webClient/src/app/app.module.ts#AppModule'
    })
  ]
};

function deepMerge(base, extension) {
  if (isObject(base) && isObject(extension)) {
    for (const key in extension) {
      if (isObject(extension[key])) {
        if (!base[key]) base[key] = {};
        deepMerge(base[key], extension[key]);
      } else {
        Object.assign(base, { [key]: extension[key] });
      }
    }
  }
  return base;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

module.exports = deepMerge(baseConfig, config);


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

