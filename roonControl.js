const RoonApi = require("node-roon-api"),
    RoonApiStatus = require('node-roon-api-status'),
    RoonApiTransport = require('node-roon-api-transport'),
    logger = require('pino')();
const RoonSetting = require("./roon_setting.js");

class RoonControl {
    constructor() {
        this.core = undefined;
        this.current_zone = undefined;
        this.status = undefined
        this.roon_settings = undefined;
    }

    refreshed_zone = (zone_id) => this.core.services.RoonApiTransport.zone_by_zone_id(zone_id) || {};
    play_state = () => this.refreshed_zone(this.current_zone.zone_id).state;

    toggle_play = () => {
        return new Promise(resolve => {
            this.core.services.RoonApiTransport.control(this.current_zone, "playpause", resolve);
        })
    }

    next_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "next");
    previous_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "previous");

    turn_volume = (value) => {
        let volume = {};

        let refresh_volume = (o) => {
            return new Promise(resolve => {
                this.core.services.RoonApiTransport.get_outputs((msg, body) => {
                    resolve(body.outputs.find(_o => _o.output_id === o.output_id).volume)
                });
            })
        }

        let change_volume = () => {
            return new Promise(resolve => {
                this.current_zone.outputs.filter(o => o.volume).forEach((o) => {
                    this.core.services.RoonApiTransport.change_volume(o, 'relative', value, (_) => {
                        resolve(o);
                    });
                })
            })
        };

        let new_volume_set = async (o) => refresh_volume(o);
        let volume_changed = async () => change_volume()

        return volume_changed()
            .then(new_volume_set)
            .then(new_vol => volume = new_vol)
            .catch(e => logger.warn(e));
    }

    fetch_all_zones = () => {
        return new Promise(resolve => {
            this.core.services.RoonApiTransport.get_zones((msg, body) => resolve(body.zones))
        })
    }

    change_current_zone_by_display_name = (name) => {
        const old_name = this.current_zone.display_name;

        return this.fetch_all_zones()
            .then(zones => {
                const new_zone = zones.find(z => z.display_name === name);
                if (new_zone) {
                    return this.current_zone = new_zone;
                } else {
                    logger.warn(`No zone is available by name: ${name}.`);
                    return this.current_zone = zones.find(z => z.display_name === old_name);
                }
            })
            .then(z => logger.info(`${z.display_name} is the current zone now.`))
            .catch(e => logger.warn(e));
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
            });
    }
}

module.exports = RoonControl;
