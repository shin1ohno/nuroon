#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("./app/bootstrap");
const nuRoon_1 = require("./app/nuRoon");
if (process.argv[2] === "controller") {
    const nuimoId = process.argv[3];
    if (nuimoId) {
        bootstrap_1.Bootstrap.runController(nuimoId);
    }
    else {
        nuRoon_1.logger.warn("Please specify the nuimo id to control");
    }
}
else {
    bootstrap_1.Bootstrap.run();
}
