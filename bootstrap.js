const Nuimo = require("nuimojs");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const Nuroon = require("./nuroon");
const RoonControl = require("./roon_control");
const RoonSubscription = require("./roon_subscripton");
const Actions = require("./actions");
const logger = require("pino")();
const forever = require("async/forever");
const FileConfig = require("./file_config.js");
const matrix = require("./matrix.js");

const delay = ms => new Promise(res => setTimeout(res, ms));

let sentry_transacton = Sentry.startTransaction({
    op: "Initialisation",
    name: "Initialisation of Nuroon"
});

const init_raven = (dsn, sample_rate) => {
    Sentry.init({
        dsn: dsn,
        tracesSampleRate: sample_rate,
    });
}

try {
    FileConfig.load_config_file()
        .then(conf => {
            init_raven(conf.development.sentry_dsn, conf.development.sentry_sample_rate);
            return conf;
        })
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
                            actions.transfer_zone(roon.roon_settings.x.long_left);
                            break;
                        case (Nuimo.Area.LONGRIGHT):
                            actions.transfer_zone(roon.roon_settings.x.long_right);
                            break;
                        case (Nuimo.Area.LONGTOP):
                            actions.transfer_zone(roon.roon_settings.x.long_top);
                            break;
                        case (Nuimo.Area.LONGBOTTOM):
                            actions.transfer_zone(roon.roon_settings.x.long_bottom);
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
        }).catch(e => Sentry.captureException(e) && logger.warn(e));
} catch (e) {
    loger.warn(e);
    Sentry.captureException(e);
}
