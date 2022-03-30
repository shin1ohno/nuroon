"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapCore = void 0;
const nuRoon_1 = require("../nuRoon");
const node_roon_api_1 = __importDefault(require("node-roon-api"));
const node_roon_api_status_1 = __importDefault(require("node-roon-api-status"));
const node_roon_api_transport_1 = __importDefault(require("node-roon-api-transport"));
const node_roon_api_settings_1 = __importDefault(require("node-roon-api-settings"));
const configStore_1 = require("../configStore");
const rxjs_1 = require("rxjs");
const bootstrapManager_1 = require("../bootstrapManager");
class BootstrapCore {
    initiateSubscription() {
        return new rxjs_1.Observable((subscriber) => {
            configStore_1.ConfigStore.loadBootstrapPluginProps().then((conf) => this.subscribe(conf, subscriber));
        });
    }
    exposeNuimoToSetting(nuimo) {
        return configStore_1.ConfigStore.loadRoonConfig()
            .then((config) => {
            const existing = config.nuimoDevices;
            return {
                nuimoDevices: BootstrapCore.addOrUpdateNuimoDeviceSettings(existing, nuimo)
            };
        })
            .then((newConfig) => {
            configStore_1.ConfigStore.saveRoonConfig(newConfig).catch((e) => nuRoon_1.logger.warn(e));
            const selection = newConfig.nuimoDevices.find((n) => n.id == nuimo.id);
            if (selection) {
                return selection;
            }
            else {
                throw new Error("No way to reach here?");
            }
        });
    }
    id() {
        if (this.core) {
            return this.core.core_id;
        }
        else {
            return undefined;
        }
    }
    static configToSettings(config) {
        return config.nuimoDevices.reduce((pre, cur) => {
            const setting = {};
            setting[cur.id] = cur.connectToRoon;
            Object.assign(pre, setting);
            return pre;
        }, {});
    }
    static settingsToConfig(settings) {
        const ss = Object.entries(settings).map(([key, value]) => {
            return { id: key, connectToRoon: !!value };
        });
        return { nuimoDevices: ss };
    }
    static addOrUpdateNuimoDeviceSettings(existing, nuimo) {
        if (existing.map((n) => n.id).includes(nuimo.id)) {
            return existing;
        }
        else {
            return existing.concat([{ id: nuimo.id, connectToRoon: false }]);
        }
    }
    subscribe(conf, subscriber) {
        const roon = new node_roon_api_1.default(Object.assign(conf, {
            core_paired: (core) => {
                this.core = core;
                nuRoon_1.logger.info(`Subscribed to ${this.core.display_name} (${this.core.display_version}).`);
                this.roonStatus.set_status("Subscribed to core", false);
                subscriber.next(this);
            },
            core_unpaired: (_) => {
                nuRoon_1.logger.info(`Unpaired ${this.core.display_name} (${this.core.display_version}).`);
                roon.start_discovery();
            },
        }));
        this.roonStatus = new node_roon_api_status_1.default(roon);
        this.roonApiSettings = this.roonSettings(roon);
        roon.init_services({
            required_services: [node_roon_api_transport_1.default],
            provided_services: [this.roonStatus, this.roonApiSettings],
        });
        roon.start_discovery();
    }
    roonSettings(roon) {
        const layout = (settings) => {
            const l = {
                values: settings,
                layout: [],
                has_error: false,
            };
            l.layout.push({
                type: "title",
                title: "Nuimo Found:",
            });
            Object.keys(settings).forEach((id) => l.layout.push({
                type: "dropdown",
                title: `Use ${id} as a Roon Controller`,
                setting: id,
                values: [
                    { title: "Yes. Connect on save", value: true },
                    { title: "No. Disconnect on save", value: false },
                ],
            }));
            return l;
        };
        const roonApiSettings = new node_roon_api_settings_1.default(roon, {
            get_settings: (callback) => {
                configStore_1.ConfigStore.loadRoonConfig().then((config) => callback(layout(BootstrapCore.configToSettings(config))));
            },
            save_settings: (req, dry_run, settings) => {
                const l = layout(settings.values);
                req.send_complete(l.has_error ? "NotValid" : "Success", {
                    settings: l,
                });
                if (!dry_run && !l.has_error) {
                    configStore_1.ConfigStore.saveRoonConfig(BootstrapCore.settingsToConfig(l.values)).then(() => {
                        roonApiSettings.update_settings(l);
                        Object.entries(l.values)
                            .map(([key, value]) => {
                            return { id: key, connectToRoon: !!value };
                        })
                            .forEach((setting) => {
                            const n = bootstrapManager_1.BootstrapManager.find(this, { id: setting.id });
                            if (!n)
                                return;
                            if (setting.connectToRoon) {
                                n.startControl();
                            }
                        });
                    });
                }
            },
        });
        return roonApiSettings;
    }
}
exports.BootstrapCore = BootstrapCore;
