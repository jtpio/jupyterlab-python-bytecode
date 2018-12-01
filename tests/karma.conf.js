var path = require('path');
var webpack = require('./webpack.config');

module.exports = function (config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'karma-typescript'],
    reporters: ['mocha', 'karma-typescript'],
    client: {
      captureConsole: true,
      mocha: {
        timeout : 10000, // 10 seconds - upped from 2 seconds
        retries: 3 // Allow for slow server on CI.
      }
    },
    files: [
      { pattern: path.resolve('./build/injector.js'), watched: false },
      { pattern: "tests/src/**/*.ts" },
      { pattern: "src/**/*.ts*" }
    ],
    preprocessors: {
      'tests/build/injector.js': ['webpack'],
      '**/*.ts*': ['karma-typescript']
    },
    webpack: webpack,
    webpackMiddleware: {
      noInfo: true,
      stats: 'errors-only'
    },
    browserNoActivityTimeout: 31000, // 31 seconds - upped from 10 seconds
    browserDisconnectTimeout: 31000, // 31 seconds - upped from 2 seconds
    browserDisconnectTolerance: 2,
    port: 9876,
    colors: true,
    singleRun: true,
    logLevel: config.LOG_INFO,

    karmaTypescriptConfig: {
      tsconfig: 'tests/src/tsconfig.json',
      reports: {
        "text-summary": "",
        "html": "coverage",
        "lcovonly": {
          "directory": "coverage",
          "filename": "coverage.lcov"
        }
      }
    }
  });
};
