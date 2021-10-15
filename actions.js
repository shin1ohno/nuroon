const matrix = require("./matrix.js");
const logger = require("pino")();
const delay = ms => new Promise(res => setTimeout(res, ms));

class Actions {
    constructor(roon, device) {
        this.roon = roon;
        this.device = device;
    }

    connect = () => {
        logger.info(`Nuroon connected to Nuimo(${this.device.uuid}).`);
        matrix("connected", this.device);
        const l = this.device.batteryLevel;
        if (l > 10) {
            logger.info(`Battery: ${l}%.`);
        } else {
            logger.warn(`Battery level low: ${l}%.`);
        }
    }

    toggle_play = () => {
        this.roon.toggle_play()
            .then(async () => await delay(50))
            .then(() => this.roon.play_state())
            .then(
                status => {
                    matrix(status, this.device);
                    logger.debug(status);
                    return status;
                });
    }

    next_track = () => {
        this.roon.next_track();
        matrix("next_track", this.device);
    }

    previous_track = () => {
        this.roon.previous_track();
        matrix("previous_track", this.device);
    }

    switch_zone = (zone_name) => {
        this.roon.change_current_zone_by_display_name(zone_name)
            .then(() => matrix("zone_switched", this.device));
    }

    noop = () => {
    }
}

module.exports = Actions;
