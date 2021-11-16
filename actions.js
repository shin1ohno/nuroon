const matrix = require("./matrix.js");
const logger = require("pino")({level: 'trace'});
const delay = ms => new Promise(res => setTimeout(res, ms));
const NC = require('netcat/client')
const nc = new NC()
nc.addr("fd1d:9547:b6f7:6:cfb:a221:cde6:58ef").port(9999)

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
                })
            .catch(e => {
                logger.warn(e);
                logger.warn(`We lost the zone? ${this.roon.current_zone}`);
                logger.warn("Available zones:")
                this.roon.transport().get_zones((status, body) => {
                    logger.warn(body.zones);
                })
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

    transfer_zone = (zone) => {
        this.roon.transfer_zone(zone)
            .then(() => {
		    nc.connect().send(zone.name);
		    matrix("zone_switched", this.device);
	    });
    }

    switch_zone = (zone) => {
        this.roon.change_current_zone(zone)
            .then(() => matrix("zone_switched", this.device));
    }

    noop = () => {
    }
}

module.exports = Actions;
