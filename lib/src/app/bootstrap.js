"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bootstrap = void 0;
const nuRoon_1 = require("./nuRoon");
const bootstrapCore_1 = require("./roon/bootstrapCore");
const rocket_nuimo_1 = require("rocket-nuimo");
const rxjs_1 = require("rxjs");
const fs = __importStar(require("fs"));
const controllerCore_1 = require("./roon/controllerCore");
const bootstrapManager_1 = require("./bootstrapManager");
class Bootstrap {
    static run() {
        Bootstrap.findRoonCore().subscribe((bootstrapCore) => {
            Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
                this.setupWorkingDirectory(nuimo.id);
                bootstrapManager_1.BootstrapManager.findOrCreate(bootstrapCore, nuimo)
                    .startControl()
                    .then(nuRoon => nuRoon_1.logger.info(`Paired: Roon: ${nuRoon.roonCore.id()}, Nuimo: ${nuRoon.nuimo.id}`));
            });
        });
    }
    static runController(nuimoId) {
        process.chdir(this.setupWorkingDirectory(nuimoId));
        const nuimoDiscovery = new Promise((resolve) => {
            const manager = rocket_nuimo_1.DeviceDiscoveryManager.defaultManager;
            manager.startDiscoverySession({ deviceIds: [nuimoId] });
            manager.on("device", (device, _) => {
                // Not sure if deviceIds option works so checking again here.
                if (device.id === nuimoId)
                    return resolve(device);
            });
        });
        const roonDiscovery = new controllerCore_1.ControllerCore().initiateSubscription(nuimoId);
        Promise.all([nuimoDiscovery, roonDiscovery]).then(([nuimo, roon]) => {
            const nuRoon = new nuRoon_1.NuRoon(roon, nuimo);
            nuRoon.connect()
                .then((success) => {
                if (success) {
                    nuRoon.startControl().then((nuRoon) => {
                        nuRoon_1.logger.info("Controller launched successfully");
                        return nuRoon;
                    }).catch(() => {
                        nuRoon_1.logger.fatal("Connection to Roon interrupted?");
                        process.kill(process.pid);
                    });
                }
            })
                .catch((error) => nuRoon_1.logger.fatal(error));
        });
    }
    static setupWorkingDirectory(nuimoId) {
        const workingDirectoryPath = `controllerCoreWorking/${nuimoId}`;
        if (!fs.existsSync(workingDirectoryPath)) {
            fs.mkdirSync(workingDirectoryPath, { recursive: true });
            fs.copyFileSync("./config.json", `${workingDirectoryPath}/config.json`);
            fs.linkSync("./controllers.json", `${workingDirectoryPath}/controllers.json`);
        }
        return workingDirectoryPath;
    }
    static findRoonCore() {
        const roonCore = new bootstrapCore_1.BootstrapCore();
        return roonCore.initiateSubscription();
    }
    static startNuimoDiscovery() {
        const manager = rocket_nuimo_1.DeviceDiscoveryManager.defaultManager;
        manager.startDiscoverySession();
        nuRoon_1.logger.info("Starting Nuimo discovery.");
        nuRoon_1.logger.info("Waiting for Nuimo...");
        return new rxjs_1.Observable((subscriber) => {
            manager.on("device", (device, newDevice) => {
                nuRoon_1.logger.info(`Nuimo found: ${device.id}.`);
                subscriber.next(device);
            });
        });
    }
}
exports.Bootstrap = Bootstrap;
