const func = require('@jupyterlab/testutils/lib/jest-config');
const upstream = func('jupyterlab_python_bytecode', __dirname);

const reuseFromUpstream = [
    'moduleNameMapper',
    'setupFilesAfterEnv',
    'setupFiles',
    'moduleFileExtensions',
];

let local = {
  testRegex: `.*\.spec\.tsx?$`,
  transform: {
    "\\.(ts|tsx)?$": "ts-jest",
    "\\.(js|jsx)?$": "./transform.js",
    '\\.svg$': 'jest-raw-loader'
  },
  transformIgnorePatterns: ["/node_modules/(?!(@jupyterlab/.*)/)"],
  globals: {
    'ts-jest': {
      tsConfig: `./tsconfig.json`,
    },
  },
};

for (option of reuseFromUpstream) {
    local[option] = upstream[option];
}

module.exports = local;
