const RoonApi = require("node-roon-api");
const RoonSetting = require("./roon_setting.js");
const RoonApiStatus = require("node-roon-api-status");
const RoonApiTransport = require("node-roon-api-transport");
const logger = require("pino")();

class RoonSubscription {
    constructor() {
        this.core = undefined;
        this.current_zone = undefined;
        this.status = undefined
        this.roon_settings = undefined;
    }

    subscribe_to_roon = (conf) => {
        let initialise_roon = () => {
            return new Promise(resolve => {
                let roon = new RoonApi(
                    Object.assign(conf.roon_plugin_props,
                        {
                            core_paired: (core) => {
                                this.core = core;
                                this.status.set_status("Paired to core", false);
                                this.core.services.RoonApiTransport.subscribe_zones((response, msg) => {
                                    if (response === "Subscribed") {
                                        resolve(msg);
                                    } else if (response === "Changed") {
                                        if (this.current_zone) {
                                            logger.debug(this.current_zone.display_name + " | " + this.current_zone.state);
                                            this.status.set_status(`Controlling ${this.current_zone.display_name}.`, false);
                                        } else {
                                            logger.warn("No zone available")
                                        }
                                    }
                                });
                            },
                            core_unpaired: function (_) {
                                this.core = undefined;
                                this.current_zone = undefined;
                                this.zones = [];
                            }
                        }
                    )
                )

                this.roon_settings = new RoonSetting(roon, conf.x);
                this.status = new RoonApiStatus(roon);
                roon.init_services({
                    required_services: [RoonApiTransport],
                    provided_services: [this.status, this.roon_settings.provider],
                });
                this.status.set_status("Starting discovery", false);
                roon.start_discovery();
            });
        }

        return initialise_roon()
            .then(msg => this.current_zone = msg.zones.find((z) => z.display_name === this.roon_settings.x.default_zone.name))
            .then(zone => {
                logger.info(`Subscribed to ${this.core.display_name} (${this.core.display_version}).`);
                logger.info(`Controlling ${zone.display_name} ${zone.state} ${zone.now_playing.one_line.line1}`);
                return this;
            });
    }
}

module.exports = RoonSubscription;
