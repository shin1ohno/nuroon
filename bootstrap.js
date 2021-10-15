const logger = require("pino")();
const Nuimo = require("nuimojs");
const forever = require("async/forever");
const Nuroon = require("./nuroon");
const RoonControl = require("./roonControl");
const matrix = require("./matrix.js");
const FileConfig = require("./file_config.js");
const RoonSubscription = require("./roon_subscripton");
const Actions = require("./actions");
const delay = ms => new Promise(res => setTimeout(res, ms));

FileConfig.load_config_file()
    .then(conf => (new RoonSubscription()).subscribe_to_roon(conf))
    .then(subscription => new RoonControl(subscription.core, subscription.current_zone, subscription.roon_settings))
    .then((roon) => {
        let device = undefined;
        let actions = undefined;
        (new Nuroon(new Nuimo())).bootstrap({
            connect: (d) => {
                device = d;
                actions = new Actions(roon, d);
                actions.connect();
            },
            press: () => actions[roon.roon_settings.x.press](),
            swipe: (direction) => {
                switch (direction) {
                    case (Nuimo.Swipe.LEFT):
                        actions[roon.roon_settings.x.swipe_left]();
                        break;
                    case (Nuimo.Swipe.RIGHT):
                        actions[roon.roon_settings.x.swipe_right]();
                        break;
                    case (Nuimo.Swipe.UP):
                        actions[roon.roon_settings.x.swipe_up]();
                        break;
                    case (Nuimo.Swipe.DOWN):
                        actions[roon.roon_settings.x.swipe_down]();
                        break;
                }
            },
            touch: (area) => {
                switch (area) {
                    case (Nuimo.Area.LEFT):
                        actions[roon.roon_settings.x.touch_left]();
                        break;
                    case (Nuimo.Area.RIGHT):
                        actions[roon.roon_settings.x.touch_right]();
                        break;
                    case (Nuimo.Area.TOP):
                        actions[roon.roon_settings.x.touch_top]();
                        break;
                    case (Nuimo.Area.BOTTOM):
                        actions[roon.roon_settings.x.touch_bottom]();
                        break;
                    case (Nuimo.Area.LONGLEFT):
                        actions.switch_zone(roon.roon_settings.x.long_left.name);
                        break;
                    case (Nuimo.Area.LONGRIGHT):
                        actions.switch_zone(roon.roon_settings.x.long_right.name);
                        break;
                    case (Nuimo.Area.LONGTOP):
                        actions.switch_zone(roon.roon_settings.x.long_top.name);
                        break;
                    case (Nuimo.Area.LONGBOTTOM):
                        actions.switch_zone(roon.roon_settings.x.long_bottom.name);
                        break;
                }
            },
            rotate: (amount) => {
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
            fly: (direction) => {
                switch (direction) {
                    case (Nuimo.Fly.LEFT):
                        actions[roon.roon_settings.x.fly_left](device)
                        break;
                    case (Nuimo.Fly.RIGHT):
                        actions[roon.roon_settings.x.fly_right](device)
                        break;
                }
            },
            detect: (distance) => {
                logger.info(`Detected hand at distance ${distance}`);
            },
            heartbeat: () => {
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
