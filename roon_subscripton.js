const RoonApi = require("node-roon-api");
const RoonSetting = require("./roon_setting.js");
const RoonApiStatus = require("node-roon-api-status");
const RoonApiTransport = require("node-roon-api-transport");
const logger = require("pino")();

class RoonSubscription {
    constructor() {
        this.core = undefined;
        this.current_zone = undefined;
        this.roon_status = undefined
        this.roon_settings = undefined;
    }

    subscribe_to_core = (conf) => {
        return new Promise(resolve => {
            let roon = new RoonApi(
                Object.assign(conf.roon_plugin_props,
                    {
                        core_paired: (core) => {
                            this.core = core;
                            this.roon_status.set_status("Paired to core", false);
                            logger.info(`Subscribed to ${this.core.display_name} (${this.core.display_version}).`);
                            core.services.RoonApiTransport.subscribe_zones((status, body) => {
                                if (status === "Subscribed") {
                                    this.roon_status.set_status("Subscribed to zones", false);
                                    resolve(core);
                                }
                            });
                        },
                        core_unpaired: (_) => {
                            this.core = undefined;
                            this.current_zone = undefined;
                        }
                    }
                )
            )

            this.roon_settings = new RoonSetting(roon, conf.x);
            this.roon_status = new RoonApiStatus(roon);
            roon.init_services({
                required_services: [RoonApiTransport],
                provided_services: [this.roon_status, this.roon_settings.provider],
            });
            this.roon_status.set_status("Starting discovery", false);
            roon.start_discovery();
        });
    }

    subscribe_to_roon = (conf) => {
        let select_zone = (core) => {
            let default_zone = core.services.RoonApiTransport.zone_by_object(this.roon_settings.x.default_zone)

            return new Promise((resolve, reject) => {
                if (default_zone) {
                    resolve(default_zone);
                } else {
                    core.services.RoonApiTransport.get_zones((status, msg) => {
                        if (status === "NetworkError") {
                            reject("Network error when selecting zone.");
                        } else {
                            let selection = msg.zones[0]
                            let message = `Default zone(${this.roon_settings.x.default_zone.name}) is not available. Falled back to ${selection.display_name}.`;
                            logger.warn(message);
                            this.roon_status.set_status(message, true);
                            resolve(selection);
                        }
                    })
                }
            })

        }
        return this.subscribe_to_core(conf)
            .then(core => select_zone(core))
            .then(zone => {
                this.current_zone = zone;

                if (zone && zone.now_playing) {
                    logger.info(`Controlling ${zone.display_name} ${zone.state} ${zone.now_playing.one_line.line1}`);
                } else if (zone) {
                    logger.info(`Controlling ${zone.display_name}`);
                } else {
                    logger.info("No zone is available");
                }

                this.roon_status.set_status(`Controlling ${zone.display_name}`, false);

                return this;
            }).catch(e => logger.warn(e));
    }
}

module.exports = RoonSubscription;
