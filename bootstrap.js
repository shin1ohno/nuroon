const logger = require("pino")();
const Nuimo = require("nuimojs");
const Nuroon = require("./nuroon");
const RoonControl = require("./roonControl");
const Fs = require("fs")

let config = JSON.parse(Fs.readFileSync("./config.json"));
let nuroon = new Nuroon(new Nuimo());
let roon = new RoonControl(config.roon_plugin_props);

nuroon.bootstrap({
    connect: (device) => {
        logger.info("Nuroon started.")
        logger.debug(`Nuimo(${device.uuid}) connected.`);
        device.setLEDMatrix([
            0, 1, 1, 1, 1, 1, 1, 1, 0,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1,
            0, 1, 1, 1, 1, 1, 1, 1, 0
        ], 255, 2000)
    },
    press: (device) => {
        logger.debug("Button pressed");
        roon.toggle_play();
    },
    swipe: (device, direction) => {
        switch (direction) {
            case (Nuimo.Swipe.LEFT):
                logger.debug("Swiped left");
                roon.previous_track();
                break;
            case (Nuimo.Swipe.RIGHT):
                logger.debug("Swiped right");
                roon.next_track();
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
                logger.info("Touched left");
                break;
            case (Nuimo.Area.RIGHT):
                logger.info("Touched right");
                break;
            case (Nuimo.Area.TOP):
                logger.info("Touched top");
                break;
            case (Nuimo.Area.BOTTOM):
                logger.info("Touched bottom");
                break;
            case (Nuimo.Area.LONGLEFT):
                logger.debug("Long touched left");
                roon.change_current_zone_by_display_name('Qutest');
                break;
            case (Nuimo.Area.LONGRIGHT):
                logger.debug("Long touched right");
                roon.change_current_zone_by_display_name('Study');
                break;
            case (Nuimo.Area.LONGTOP):
                logger.info("Long touched top");
                break;
            case (Nuimo.Area.LONGBOTTOM):
                roon.change_current_zone_by_display_name('ZenGo');
                break;
        }
    },
    rotate: (device, amount) => {
        logger.debug(`Rotated by ${amount}`);
        roon.turn_volume(amount);
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

