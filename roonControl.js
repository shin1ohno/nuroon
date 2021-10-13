const RoonApi = require("node-roon-api"),
    RoonApiSettings = require('node-roon-api-settings'),
    RoonApiStatus = require('node-roon-api-status'),
    RoonApiTransport = require('node-roon-api-transport'),
    logger = require('pino')();

const DEFAULT_ZONE = "160198e236817e736bbd314a165cb0b89e53"
// Qutest: "160103b6b4a1dd24c3513106b882312e4c58"
// Study: "160198e236817e736bbd314a165cb0b89e53"

class RoonControl {
    constructor(plugin_props) {
        this.core = undefined;
        this.current_zone = undefined;
        this.playingstate = "";
        this.status = undefined
        this.subscribe_to_roon(plugin_props).catch(
            e => logger.warn(e)
        );
    }

    toggle_play = () => {
        this.core.services.RoonApiTransport.control(this.current_zone, "playpause");
        return this.current_zone.playingstate;
    }
    next_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "next");
    previous_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "previous");

    turn_volume = async (value) => {
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

        await volume_changed().then(new_volume_set).then(
            new_vol => volume = new_vol
        ).catch(err => logger.warn(err));

        return Promise.resolve(volume);
    }

    change_current_zone_by_display_name = (name) => {
        this.core.services.RoonApiTransport.get_zones((msg, body) => {
            this.current_zone = body.zones.find(z => z.display_name === name);
            logger.info(`${this.current_zone.display_name} is the current zone now.`)
        });
    }

    async subscribe_to_roon(plugin_props) {
        let roon = undefined;

        let initialise_roon = () => {
            return new Promise(resolve => {
                roon = new RoonApi(
                    Object.assign(plugin_props,
                        {
                            core_paired: (core) => {
                                this.core = core;
                                this.status.set_status("Paired to core", false);
                                this.core.services.RoonApiTransport.subscribe_zones((response, msg) => {
                                    if (response === "Subscribed") {
                                        resolve(msg);
                                    } else if (response === "Changed") {
                                        logger.debug(this.current_zone.display_name + " | " + this.current_zone.state);
                                        this.status.set_status(`Controlling ${this.current_zone.display_name}.`, false);
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
                this.status = new RoonApiStatus(roon);
                roon.init_services({
                    required_services: [RoonApiTransport],
                    provided_services: [this.status],
                });
                this.status.set_status("Starting discovery", false);
                roon.start_discovery();
            });
        }
        initialise_roon().then(
            msg => this.current_zone = msg.zones.find((z) => z.zone_id === DEFAULT_ZONE)
        );
    }
}

module.exports = RoonControl;
