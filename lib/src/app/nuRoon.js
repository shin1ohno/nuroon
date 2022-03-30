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
exports.NuRoon = exports.logger = void 0;
const rocket_nuimo_1 = require("rocket-nuimo");
const pino_1 = require("pino");
const rxjs_1 = require("rxjs");
const control_1 = require("./roon/control");
const configStore_1 = require("./configStore");
const util = __importStar(require("util"));
const glyphs_1 = require("./glyphs");
exports.logger = (0, pino_1.pino)({ level: "trace" });
class NuRoon {
    constructor(roonCore, nuimo) {
        this.roonCore = roonCore;
        this.nuimo = nuimo;
        this.bindings = [];
    }
    startControl() {
        return this.updateSettings()
            .then((n) => n.connect())
            .then((_) => this);
    }
    connect() {
        exports.logger.info(`Connecting to Nuimo: ${this.nuimo.id}`);
        return this.nuimo
            .connect()
            .then((res) => {
            if (res) {
                exports.logger.info(`Connected to Nuimo: ${this.nuimo.id}`);
            }
            else {
                exports.logger.info(`Failed to connect to Nuimo: ${this.nuimo.id}`);
            }
            return res;
        });
    }
    iAmHere() {
        const firstDigit = parseInt(this.nuimo.id[0], 10);
        return this.nuimo
            .displayGlyph(rocket_nuimo_1.digitGlyphs[firstDigit || 0], {
            transition: rocket_nuimo_1.DisplayTransition.CrossFade,
            timeoutMs: 5000,
        })
            .then((_) => this);
    }
    ping() {
        if (this.nuimo) {
            this.nuimo.displayGlyph(rocket_nuimo_1.filledGlyph.resize(1, 1), {
                transition: rocket_nuimo_1.DisplayTransition.Immediate,
                timeoutMs: 50,
                brightness: 0.1,
            });
        }
        else {
            exports.logger.info("Nuimo is not connected.");
        }
    }
    updateSettings() {
        this.bindings.forEach((s) => s.unsubscribe());
        const c = this.roonCore;
        return configStore_1.ConfigStore.loadControllerConfig(this.nuimo.id)
            .then((config) => {
            const settings = config.settings;
            const zone = settings["default_zone"];
            if (settings && zone) {
                const control = new control_1.Control(c.transport(), zone["output_id"]);
                const simpleOperations = {
                    select: settings.select,
                    swipeRight: settings.swipeRight,
                    swipeLeft: settings.swipeLeft,
                    touchLeft: settings.touchLeft,
                    touchRight: settings.touchRight,
                    swipeUp: settings.swipeUp,
                    swipeDown: settings.swipeDown,
                    touchTop: settings.touchTop,
                    touchBottom: settings.touchBottom,
                };
                const parameterOperations = {
                    rotate: settings.rotate,
                };
                const advancedParameters = {
                    rotary_damping_factor: settings.rotary_damping_factor,
                    heartbeat_delay: settings.heartbeat_delay,
                };
                Object.entries(settings).forEach((entry) => {
                    const eventName = entry[0];
                    const controlName = entry[1];
                    if (eventName in simpleOperations) {
                        const s = (0, rxjs_1.fromEvent)(this.nuimo, eventName).subscribe(() => control[controlName]().then((state) => {
                            exports.logger.info(state);
                            if (state in glyphs_1.controlGlyphs) {
                                this.nuimo.displayGlyph(glyphs_1.controlGlyphs[state], {
                                    transition: rocket_nuimo_1.DisplayTransition.CrossFade,
                                    timeoutMs: 500,
                                    brightness: 1,
                                });
                            }
                        }));
                        this.bindings.push(s);
                    }
                    else if (eventName in parameterOperations) {
                        const s = (0, rxjs_1.fromEvent)(this.nuimo, eventName).subscribe((e) => {
                            const vol = e[0] * advancedParameters.rotary_damping_factor;
                            control[controlName](vol);
                            control.volumePct().then((n) => {
                                const i = Math.round(n / 10);
                                const key = `volume${i}`;
                                exports.logger.debug(`volume: ${i}`);
                                if (key in glyphs_1.volumeGlyphs) {
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    this.nuimo.displayGlyph(glyphs_1.volumeGlyphs[key], {
                                        timeoutMs: 1000,
                                        transition: rocket_nuimo_1.DisplayTransition.Immediate,
                                        brightness: 1,
                                    });
                                }
                            });
                        });
                        this.bindings.push(s);
                    }
                    else if (eventName in advancedParameters) {
                        const s = (0, rxjs_1.interval)(advancedParameters.heartbeat_delay * 1000).subscribe(() => {
                            control.isPlaying().then((res) => {
                                if (res) {
                                    this.ping();
                                }
                            });
                        });
                        this.bindings.push(s);
                    }
                    else {
                        exports.logger.warn(`Unhandled operation: ${eventName}, ${util.inspect(controlName)}.`);
                    }
                });
                exports.logger.info(`settings: ${util.inspect(settings)}`);
            }
            else {
                //Do nothing
            }
        })
            .then((_) => this)
            .catch((reason) => {
            exports.logger.fatal(reason);
            exports.logger.fatal("Rebooting the controller process.");
            NuRoon.restart();
            return this;
        });
    }
    static restart() {
        process.kill(process.pid);
    }
}
exports.NuRoon = NuRoon;
