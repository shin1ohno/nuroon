const logger = require("pino")();
const Nuimo = require("nuimojs");
const Nuroon = require("./nuroon");
const RoonControl = require("./roonControl");
const Fs = require("fs")

let config = JSON.parse(Fs.readFileSync("./config.json"));
let nuroon = new Nuroon(new Nuimo());
let roon = new RoonControl(config.roon_plugin_props);

const matrix = (feed_back_pattern, device) => {
    switch (feed_back_pattern) {
        case "connected":
            device.setLEDMatrix([
                0, 1, 1, 1, 1, 1, 1, 1, 0,
                1, 1, 1, 1, 0, 1, 1, 1, 1,
                1, 1, 1, 0, 0, 1, 1, 1, 1,
                1, 1, 0, 1, 0, 1, 1, 1, 0,
                1, 0, 1, 1, 0, 1, 1, 0, 1,
                0, 1, 1, 1, 0, 1, 0, 1, 1,
                1, 1, 1, 1, 0, 0, 1, 1, 1,
                1, 1, 1, 1, 0, 1, 1, 1, 1,
                0, 1, 1, 1, 1, 1, 1, 1, 0
            ], 255, 5000);
            break;
        case "volume_changed_9":
            device.setLEDMatrix([
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_8":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_7":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_6":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_5":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_4":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_3":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_2":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_1":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        case "volume_changed_0":
            device.setLEDMatrix([
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0
            ], 255, 5000, {onion_skinning: 1});
            break;
        default:
            device.setLEDMatrix([
                0, 1, 1, 0, 0, 1, 0, 0, 0,
                0, 0, 1, 1, 0, 0, 1, 0, 0,
                0, 0, 0, 1, 1, 0, 0, 1, 0,
                0, 0, 0, 0, 1, 1, 0, 0, 1,
                0, 0, 0, 0, 0, 1, 1, 0, 1,
                0, 0, 0, 0, 1, 1, 0, 0, 1,
                0, 0, 0, 1, 1, 0, 0, 1, 0,
                0, 0, 1, 1, 0, 0, 1, 0, 0,
                0, 1, 1, 0, 0, 1, 0, 0, 0
            ], 255, 2000);
            break;
    }
}

nuroon.bootstrap({
    connect: (device) => {
        logger.info("Nuroon started.")
        logger.debug(`Nuimo(${device.uuid}) connected.`);
        matrix("connected", device);
        logger.info(`Battery: ${device.batteryLevel}%.`)
    },
    press: (device) => {
        logger.debug("Button pressed");
        let status = roon.toggle_play()
        matrix(status, device);
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
    rotate: async (device, amount) => {
        logger.debug(`Rotated by ${amount}`);
        roon.turn_volume(amount / 7.0).then(
            volume => Math.round(10 * (volume.value - volume.min) / (volume.max - volume.min))
        ).then(
            rel_vol => Math.min(rel_vol, 9)
        ).then(
            rel_vol => {
                matrix(`volume_changed_${rel_vol}`, device);
                logger.info(`volume: ${rel_vol}`);
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

