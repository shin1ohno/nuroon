"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerSetting = void 0;
const node_roon_api_settings_1 = __importDefault(require("node-roon-api-settings"));
const configStore_1 = require("../configStore");
const nuRoon_1 = require("../nuRoon");
const default_settings = {
    default_zone: {},
    longTouchLeft: {},
    longTouchRight: {},
    longTouchBottom: {},
    select: "togglePlay",
    swipeLeft: "previousTrack",
    swipeRight: "nextTrack",
    swipeUp: "noop",
    swipeDown: "noop",
    touchLeft: "previousTrack",
    touchRight: "nextTrack",
    touchTop: "noop",
    touchBottom: "noop",
    rotate: "turnVolume",
    rotary_damping_factor: 150,
    heartbeat_delay: 15,
};
const action_values = [
    { title: "Toggle Play/Pause", value: "togglePlay" },
    { title: "Previous Track", value: "previousTrack" },
    { title: "Next Track", value: "nextTrack" },
    { title: "No action", value: "noop" },
];
const layout = (settings) => {
    const l = {
        values: settings,
        layout: [],
        has_error: false,
    };
    l.layout.push({
        type: "label",
        title: "Zone settings",
    }, {
        type: "zone",
        title: "Default Zone",
        setting: "default_zone",
    }, {
        type: "zone",
        title: "Zone transfer with long left tap",
        setting: "longTouchLeft",
    }, {
        type: "zone",
        title: "Zone transfer with long right tap",
        setting: "longTouchRight",
    }, {
        type: "zone",
        title: "Zone transfer with long bottom tap",
        setting: "longTouchBottom",
    }, {
        type: "title",
        title: "Playback settings",
    }, {
        type: "dropdown",
        title: "Press Action",
        setting: "select",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Swipe Left Action",
        setting: "swipeLeft",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Swipe Right Action",
        setting: "swipeRight",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Swipe Up Action",
        setting: "swipeUp",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Swipe Down Action",
        setting: "swipeDown",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Touch Left Action",
        setting: "touchLeft",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Touch Right Action",
        setting: "touchRight",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Touch Top Action",
        setting: "touchTop",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Touch Bottom Action",
        setting: "touchBottom",
        values: action_values,
    }, {
        type: "dropdown",
        title: "Rotate Acton",
        setting: "rotate",
        values: [
            { title: "Volume", value: "turnVolume" },
        ],
    }, {
        type: "group",
        title: "Advanced settings",
        collapsable: true,
        items: [
            {
                type: "integer",
                title: "Rotary damping factor",
                setting: "rotary_damping_factor",
            },
            {
                type: "integer",
                title: "Heartbeat delay in seconds",
                setting: "heartbeat_delay",
            },
        ],
    });
    return l;
};
class ControllerSetting {
    constructor(roon, nuimoId) {
        this.roon = roon;
        this.nuimoId = nuimoId;
        this.provider = new node_roon_api_settings_1.default(this.roon, {
            get_settings: (callback) => {
                configStore_1.ConfigStore.loadControllerConfig(this.nuimoId).then((config) => callback(layout(ControllerSetting.configToSettings(config))));
            },
            save_settings: (req, dry_run, settings) => {
                const l = layout(settings.values);
                req.send_complete(l.has_error ? "NotValid" : "Success", {
                    settings: l,
                });
                if (!dry_run && !l.has_error) {
                    this.provider.update_settings(l);
                    configStore_1.ConfigStore.saveControllerConfig(ControllerSetting.settingsToConfig(settings.values, this.nuimoId), this.nuimoId).then(() => {
                        nuRoon_1.NuRoon.restart();
                    });
                }
            },
        });
    }
    static configToSettings(config) {
        return Object.assign(default_settings, config.settings);
    }
    static settingsToConfig(settings, nuimoId) {
        return {
            nuimoId: nuimoId,
            settings: settings,
        };
    }
}
exports.ControllerSetting = ControllerSetting;
