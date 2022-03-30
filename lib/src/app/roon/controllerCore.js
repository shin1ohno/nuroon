"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerCore = void 0;
const nuRoon_1 = require("../nuRoon");
const node_roon_api_1 = __importDefault(require("node-roon-api"));
const node_roon_api_status_1 = __importDefault(require("node-roon-api-status"));
const node_roon_api_transport_1 = __importDefault(require("node-roon-api-transport"));
const configStore_1 = require("../configStore");
const controllerSetting_1 = require("./controllerSetting");
class ControllerCore {
    initiateSubscription(nuimoId) {
        this.nuimoId = nuimoId;
        return configStore_1.ConfigStore.loadControllerPluginProps(nuimoId).then((conf) => this.subscribe(conf));
    }
    id() {
        if (this.core) {
            return this.core.core_id;
        }
        else {
            return undefined;
        }
    }
    transport() {
        return this.core.services.RoonApiTransport;
    }
    subscribe(conf) {
        return new Promise((resolve, reject) => {
            const roon = new node_roon_api_1.default(Object.assign(conf, {
                core_paired: (core) => {
                    this.core = core;
                    nuRoon_1.logger.info(`Subscribed to ${this.core.display_name} (${this.core.display_version}).`);
                    this.roonStatus.set_status("Subscribed to core", false);
                    this.transport().subscribe_zones((status, body) => {
                        switch (status) {
                            case "Subscribed":
                                this.transport().subscribe_outputs((status, body) => {
                                    switch (status) {
                                        case "Subscribed":
                                            resolve(this);
                                            break;
                                        case "NetworkError":
                                            reject(this);
                                            break;
                                        default:
                                    }
                                });
                                break;
                            case "NetworkError":
                                reject(this);
                                break;
                            default:
                        }
                    });
                },
                core_unpaired: (_) => {
                    if (this.core) {
                        nuRoon_1.logger.info(`Unpaired controller core: ${this.core.display_name} (${this.core.display_version}).`);
                    }
                    reject(this);
                },
            }));
            this.roonStatus = new node_roon_api_status_1.default(roon);
            this.setting = new controllerSetting_1.ControllerSetting(roon, this.nuimoId);
            this.roonApiSettings = this.roonSettings(roon);
            roon.init_services({
                required_services: [node_roon_api_transport_1.default],
                provided_services: [this.roonStatus, this.roonApiSettings],
            });
            roon.start_discovery();
        });
    }
    roonSettings(roon) {
        return this.setting.provider;
    }
}
exports.ControllerCore = ControllerCore;
