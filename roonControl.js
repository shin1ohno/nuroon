const logger = require('pino')();

class RoonControl {
    constructor(core, initial_zone, roon_settings) {
        this.core = core;
        this.roon_settings = roon_settings;
        this.current_zone = initial_zone;
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

    fetch_all_zones = () => {
        return new Promise(resolve => {
            this.core.services.RoonApiTransport.get_zones((msg, body) => resolve(body.zones))
        })
    }
}

module.exports = RoonControl;
