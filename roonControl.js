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
        this.plugin_props = plugin_props;
        this.core = undefined;
        this.current_zone = undefined;
        this.zones = [];
        this.playingstate = "";
        this.status = undefined
        let roon = this.initialise_roon();
        this.status.set_status("Starting discovery", false);
        roon.start_discovery();
    }

    toggle_play = () => this.core.services.RoonApiTransport.control(this.current_zone, "playpause");
    next_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "next");
    previous_track = () => this.core.services.RoonApiTransport.control(this.current_zone, "previous");

    turn_volume = (value) => {
        this.current_zone.outputs.forEach((o) => {
            this.core.services.RoonApiTransport.change_volume(o, 'relative', value / 5.);
        });
    }

    change_current_zone_by_display_name = (name) => {
        this.core.services.RoonApiTransport.get_zones((msg, body) => {
            this.current_zone = body.zones.find(z => z.display_name === name);
        });

        logger.info(`${this.current_zone.display_name} is the current zone now.`)
    }

    zone_subscribed(response, msg) {
        if (response === "Subscribed") {
            this.zones = msg.zones;
            this.current_zone = this.zones.find((z) => z.zone_id === DEFAULT_ZONE);
            if (this.current_zone) this.playingstate = this.current_zone.playingstate;
            logger.debug(this.playingstate);
        } else if (response === "Changed" && msg['zones_changed']) {
            let z = msg.zones_changed.find(z => z.zone_id = this.current_zone.zone_id)
            if (z) this.playingstate = z.state;
            logger.debug(this.playingstate);
        }
        this.status.set_status(`Controlling ${this.current_zone.display_name}.`, false);
    }

    initialise_roon() {
        let roon = new RoonApi(
            Object.assign(this.plugin_props,
                {
                    core_paired: (core) => {
                        this.core = core;
                        this.status.set_status("Paired to core", false);
                        this.core.services.RoonApiTransport.subscribe_zones((response, msg) => {
                            try {
                                this.zone_subscribed(response, msg)
                            } catch (e) {
                                logger.info(e);
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
        return roon;
    }
}

module.exports = RoonControl;
