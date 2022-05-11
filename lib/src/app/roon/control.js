"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Control = void 0;
var Command;
(function (Command) {
    Command["TogglePlay"] = "playpause";
    Command["NextTrack"] = "next";
    Command["PreviousTrack"] = "previous";
    Command["Stop"] = "stop";
})(Command || (Command = {}));
class Control {
    constructor(transport, outputId) {
        this.transport = transport;
        this.outputId = outputId;
    }
    noop() {
        return this.roonOutput().then((o) => o.state);
    }
    togglePlay() {
        return this.controlOutput(Command.TogglePlay);
    }
    stop() {
        return this.controlOutput(Command.Stop);
    }
    nextTrack() {
        return this.controlOutput(Command.NextTrack).then((_) => "next");
    }
    previousTrack() {
        return this.controlOutput(Command.PreviousTrack).then((_) => "previous");
    }
    turnVolume(value) {
        this.roonOutput().then((o) => this.transport.change_volume(o, "relative", value));
    }
    volumePct() {
        return this.volumeObject().then((v) => ((v.value - v.hard_limit_min) / (v.hard_limit_max - v.hard_limit_min)) * 100);
    }
    isPlaying() {
        return this.roonOutput().then((o) => {
            if (o) {
                return this.transport.zone_by_zone_id(o.zone_id).state === "playing";
            }
            else {
                return false;
            }
        });
    }
    volumeObject() {
        return this.roonOutput().then((o) => o.volume);
    }
    transfer(destinationOutput) {
        return new Promise((resolve, reject) => {
            this.transport.transfer_zone(this.roonOutput(), destinationOutput, (fail) => {
                if (fail) {
                    reject(this);
                }
                else {
                    resolve(destinationOutput);
                }
            });
        });
    }
    roonOutput() {
        return new Promise((resolve, reject) => {
            this.transport.get_outputs((fail, body) => {
                if (fail) {
                    reject("Failed to get Roon Outputs");
                }
                else {
                    resolve(body.outputs.find((o) => o.output_id === this.outputId));
                }
            });
        });
    }
    controlOutput(command) {
        return new Promise((resolve, reject) => {
            // noinspection TypeScriptValidateJSTypes
            this.roonOutput().then((o) => this.transport.control(o, command, (fail) => {
                if (fail) {
                    reject(`Failed to ${command}.`);
                }
                else {
                    setTimeout(() => {
                        resolve(this.transport.zone_by_zone_id(o.zone_id).state);
                    }, 70); // We need to wait some time to get the latest status
                }
            }));
        });
    }
}
exports.Control = Control;
