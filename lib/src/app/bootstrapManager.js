"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapManager = void 0;
const child_process_1 = require("child_process");
const nuRoon_1 = require("./nuRoon");
class BootstrapManager {
    constructor(roonCore, nuimo, active = true) {
        this.roonCore = roonCore;
        this.nuimo = nuimo;
        this.active = active;
        this.bindings = [];
        BootstrapManager.pairs.push(this);
    }
    startControl() {
        return this.roonCore.exposeNuimoToSetting(this.nuimo).then((setting) => {
            if (setting.connectToRoon) {
                this.startControllerCore();
            }
            else {
                //do nothing
            }
            return this;
        });
    }
    startControllerCore() {
        this.nuimo.disconnect();
        this.active = false;
        this.controllerProcess = (0, child_process_1.spawn)(process.argv[0], // node
        [
            "-r",
            "ts-node/register",
            process.argv[1],
            "controller",
            this.nuimo.id,
        ], {
            stdio: "inherit"
        });
        this.controllerProcess.on("close", (code) => {
            nuRoon_1.logger.fatal("child process exited with code " + code);
            this.startControllerCore();
        });
    }
    static findWithIdPair(nuimoId, roonCoreId) {
        return this.pairs.find((p) => p && p.nuimo.id === nuimoId && roonCoreId === p.roonCore.id());
    }
    static find(roonCore, nuimo) {
        if (roonCore.id()) {
            return this.findWithIdPair(nuimo.id, roonCore.id());
        }
        else {
            return undefined;
        }
    }
    static findOrCreate(roonCore, nuimo) {
        const existing = this.find(roonCore, nuimo);
        if (existing) {
            return existing;
        }
        else {
            return new BootstrapManager(roonCore, nuimo, false);
        }
    }
    static all() {
        return this.pairs;
    }
    static deleteAll() {
        this.pairs = [];
    }
    static unpair(roonCore, nuimo) {
        const res = this.find(roonCore, nuimo);
        if (res) {
            delete this.pairs[this.pairs.indexOf(res)];
        }
    }
}
exports.BootstrapManager = BootstrapManager;
BootstrapManager.pairs = [];
