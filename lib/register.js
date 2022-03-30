"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
const tsNode = require("ts-node");
const tsConfigPaths = require("tsconfig-paths");
const mainTSConfig = require("./tsconfig.json");
const testTSConfig = require("./test/tsconfig.json");
tsConfigPaths.register({
    baseUrl: ".",
    paths: Object.assign(Object.assign({}, mainTSConfig.compilerOptions.paths), testTSConfig.compilerOptions.paths),
});
tsNode.register({
    files: true,
    transpileOnly: true,
    project: "./test/tsconfig.json",
});
