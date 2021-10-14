const logger = require("pino")();
const Nuimo = require("nuimojs");
const Nuroon = require("./nuroon");
const RoonControl = require("./roonControl");
const Fs = require("fs");
const matrix = require("./matrix.js");

const config = JSON.parse(Fs.readFileSync("./config.json"));
const nuroon = new Nuroon(new Nuimo());
const roon = new RoonControl(config.roon_plugin_props);

nuroon.bootstrap({
    connect: (device) => {
        logger.info(`Nuroon connected to Nuimo(${device.uuid}).`)
        matrix("connected", device);
        const l = device.batteryLevel
        if (l > 10) {
            logger.info(`Battery: ${l}%.`);
        } else {
            logger.warn(`Battery level low: ${l}%.`);
        }
    },
    press: (device) => {
        logger.debug("Button pressed");
        roon.toggle_play().then(
            () => roon.play_state()
        ).then(
            status => {
                matrix(status, device);
                logger.debug(status);
                return status;
            }
        )
    },
    swipe: (device, direction) => {
        switch (direction) {
            case (Nuimo.Swipe.LEFT):
                roon.previous_track();
                matrix("previous_track", device);
                break;
            case (Nuimo.Swipe.RIGHT):
                roon.next_track();
                matrix("next_track", device);
                break;
            case (Nuimo.Swipe.UP):
                logger.info("Swiped up");
                break;
            case (Nuimo.Swipe.DOWN):
                logger.info("Swiped down");
                break;
        }
    },
    touch: (device, area) => {
        switch (area) {
            case (Nuimo.Area.LEFT):
                roon.previous_track();
                matrix("previous_track", device);
                break;
            case (Nuimo.Area.RIGHT):
                roon.next_track();
                matrix("next_track", device);
                break;
            case (Nuimo.Area.TOP):
                logger.info("Touched top");
                break;
            case (Nuimo.Area.BOTTOM):
                logger.info("Touched bottom");
                break;
            case (Nuimo.Area.LONGLEFT):
                roon.change_current_zone_by_display_name('Qutest');
                matrix("zone_switched", device);
                break;
            case (Nuimo.Area.LONGRIGHT):
                roon.change_current_zone_by_display_name('Study');
                matrix("zone_switched", device);
                break;
            case (Nuimo.Area.LONGTOP):
                logger.info("Long touched top");
                break;
            case (Nuimo.Area.LONGBOTTOM):
                roon.change_current_zone_by_display_name('ZenGo');
                matrix("zone_switched", device);
                break;
        }
    },
    rotate: (device, amount) => {
        logger.debug(`Rotated by ${amount}`);
        roon.turn_volume(amount / 7.0).then(
            volume => Math.round(10 * (volume.value - volume.hard_limit_min) / (volume.hard_limit_max - volume.hard_limit_min))
        ).then(
            rel_vol => Math.min(rel_vol, 9)
        ).then(
            rel_vol => {
                matrix(`volume_changed_${rel_vol}`, device);
                logger.debug(`volume: ${rel_vol}`);
                return rel_vol;
            }
        )
    },
    fly: (device, direction, speed) => {
        switch (direction) {
            case (Nuimo.Fly.LEFT):
                logger.info(`Flew left by speed ${speed}`);
                break;
            case (Nuimo.Fly.RIGHT):
                logger.info(`Flew right by speed ${speed}`);
                break;
        }
    },
    detect: (device, distance) => {
        logger.info(`Detected hand at distance ${distance}`);
    },
    callback: (device) => {
        device.connect();
    }
});

