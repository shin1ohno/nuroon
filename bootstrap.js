const logger = require("pino")();
const Nuimo = require("nuimojs");
const forever = require("async/forever");
const Nuroon = require("./nuroon");
const RoonControl = require("./roonControl");
const matrix = require("./matrix.js");
const FileConfig = require("./file_config.js");
const delay = ms => new Promise(res => setTimeout(res, ms));

const nuroon = new Nuroon(new Nuimo());
const roon = new RoonControl();

const actions = {
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
    toggle_play: (device) => {
        roon.toggle_play()
            .then(async () => await delay(50))
            .then(() => roon.play_state())
            .then(
                status => {
                    matrix(status, device);
                    logger.debug(status);
                    return status;
                })
    },
    next_track: (device) => {
        roon.next_track();
        matrix("next_track", device);
    },
    previous_track: (device) => {
        roon.previous_track();
        matrix("previous_track", device);
    },
    switch_zone: (device, zone_name) => {
        roon.change_current_zone_by_display_name(zone_name)
            .then(() => matrix("zone_switched", device))
    },
    noop: (device) => device
}

FileConfig.load_config_file()
    .then(conf => roon.subscribe_to_roon(conf))
    .then(() => {
        nuroon.bootstrap({
            connect: (device) => actions.connect(device),
            press: (device) => actions[roon.roon_settings.x.press](device),
            swipe: (device, direction) => {
                switch (direction) {
                    case (Nuimo.Swipe.LEFT):
                        actions[roon.roon_settings.x.swipe_left](device);
                        break;
                    case (Nuimo.Swipe.RIGHT):
                        actions[roon.roon_settings.x.swipe_right](device);
                        break;
                    case (Nuimo.Swipe.UP):
                        actions[roon.roon_settings.x.swipe_up](device);
                        break;
                    case (Nuimo.Swipe.DOWN):
                        actions[roon.roon_settings.x.swipe_down](device);
                        break;
                }
            },
            touch: (device, area) => {
                switch (area) {
                    case (Nuimo.Area.LEFT):
                        actions[roon.roon_settings.x.touch_left](device);
                        break;
                    case (Nuimo.Area.RIGHT):
                        actions[roon.roon_settings.x.touch_right](device);
                        break;
                    case (Nuimo.Area.TOP):
                        actions[roon.roon_settings.x.touch_top](device);
                        break;
                    case (Nuimo.Area.BOTTOM):
                        actions[roon.roon_settings.x.touch_bottom](device);
                        break;
                    case (Nuimo.Area.LONGLEFT):
                        actions.switch_zone(device, roon.roon_settings.x.long_left.name);
                        break;
                    case (Nuimo.Area.LONGRIGHT):
                        actions.switch_zone(device, roon.roon_settings.x.long_right.name);
                        break;
                    case (Nuimo.Area.LONGTOP):
                        actions.switch_zone(device, roon.roon_settings.x.long_top.name);
                        break;
                    case (Nuimo.Area.LONGBOTTOM):
                        actions.switch_zone(device, roon.roon_settings.x.long_bottom.name);
                        break;
                }
            },
            rotate: (device, amount) => {
                logger.debug(`Rotated by ${amount}`);
                roon.turn_volume(amount / parseFloat(roon.roon_settings.x.rotary_damping_factor).toFixed(1))
                    .then(volume => Math.round(10 * (volume.value - volume.hard_limit_min) / (volume.hard_limit_max - volume.hard_limit_min)))
                    .then(rel_vol => Math.min(rel_vol, 9))
                    .then(
                        rel_vol => {
                            matrix(`volume_changed_${rel_vol}`, device);
                            logger.debug(`volume: ${rel_vol}`);
                            return rel_vol;
                        });
            },
            fly: (device, direction, speed) => {
                switch (direction) {
                    case (Nuimo.Fly.LEFT):
                        actions[roon.roon_settings.x.fly_left](device)
                        logger.info(`Flew left by speed ${speed}`);
                        break;
                    case (Nuimo.Fly.RIGHT):
                        actions[roon.roon_settings.x.fly_right](device)
                        logger.info(`Flew right by speed ${speed}`);
                        break;
                }
            },
            detect: (device, distance) => {
                logger.info(`Detected hand at distance ${distance}`);
            },
            heartbeat: (device) => {
                forever(
                    async () => {
                        await delay(roon.roon_settings.x.heartbeat_delay * 1_000);
                        if (roon.play_state() === "playing") {
                            logger.debug(`Pinging Nuimo.`);
                            matrix("heart_beat", device);
                        }
                    },
                    (err) => {
                        logger.warn(err)
                    }
                )

            },
            callback: (device) => {
                device.connect();
            }
        })
    });

