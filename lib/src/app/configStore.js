"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigStore = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const ROON_DEFAULT_FILE = "./config.json";
const CONTROLLERS_CONFIG = "./controllers.json";
const BOOTSTRAP_PROPS = {
    extension_id: "be.ohno.nuroon",
    display_name: "Nuimo Manager",
    display_version: "1.0.0",
    publisher: "Shinichi Ohno",
    email: "foo@example.com",
    website: "https://example.com",
    log_level: "none",
};
const ConfigStore = {
    loadConfigFile(fileName) {
        return (0, promises_1.access)(fileName, fs_1.constants.R_OK).then(() => (0, promises_1.readFile)(fileName, { encoding: "utf8" }));
    },
    loadRoonConfig() {
        return this.loadConfigFile(ROON_DEFAULT_FILE)
            .then((jsonContent) => JSON.parse(jsonContent).x)
            .then((config) => {
            if (config && config.nuimoDevices) {
                return config;
            }
            else {
                return { nuimoDevices: [] };
            }
        });
    },
    saveConfigFile(fileName, key, value) {
        return this.loadConfigFile(fileName).then((content) => {
            const config = JSON.parse(content);
            config[key] = value;
            return (0, promises_1.writeFile)(fileName, JSON.stringify(config, null, "    "), {
                encoding: "utf-8",
            });
        });
    },
    saveRoonConfig(value) {
        return this.saveConfigFile(ROON_DEFAULT_FILE, "x", value);
    },
    loadBootstrapPluginProps() {
        return this.loadConfigFile(ROON_DEFAULT_FILE).then((config) => {
            return Object.assign(BOOTSTRAP_PROPS, JSON.parse(config).roon_plugin_props || {});
        });
    },
    loadControllerPluginProps(nuimoId) {
        return this.loadBootstrapPluginProps().then((props) => {
            props.extension_id = `${props.extension_id}.${nuimoId}`;
            props.display_name = `Nuimo: ${nuimoId}`;
            return props;
        });
    },
    loadControllerConfig(nuimoId) {
        return this.loadConfigFile(CONTROLLERS_CONFIG)
            .then((config) => {
            return (JSON.parse(config).x.controllerSettings || []).find((s) => s.nuimoId === nuimoId);
        })
            .then((selection) => {
            return selection || { nuimoId: nuimoId, settings: {} };
        });
    },
    saveControllerConfig(config, nuimoId) {
        return this.loadConfigFile(CONTROLLERS_CONFIG)
            .then((config) => JSON.parse(config).x.controllerSettings || [])
            .then((configs) => {
            const selection = configs.find((s) => s.nuimoId === nuimoId);
            const newValues = {
                nuimoId: nuimoId,
                settings: config.settings,
            };
            if (selection) {
                Object.assign(selection, newValues);
            }
            else {
                configs.push(newValues);
            }
            return configs;
        })
            .then((configs) => this.saveConfigFile(CONTROLLERS_CONFIG, "x", { controllerSettings: configs }));
    },
};
exports.ConfigStore = ConfigStore;
