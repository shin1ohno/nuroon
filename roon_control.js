const logger = require('pino')();

class RoonControl {
    constructor(core, initial_zone, roon_settings) {
        this.core = core;
        this.roon_settings = roon_settings;
        this.current_zone = initial_zone;
    }

    transport = () => this.core.services.RoonApiTransport

    refreshed_zone = (zone_id) => this.transport().zone_by_zone_id(zone_id) || {};
    play_state = () => this.refreshed_zone(this.current_zone.zone_id).state;

    toggle_play = () => {
        return new Promise(resolve => {
            this.transport().control(this.current_zone, "playpause", resolve);
        })
    }

    next_track = () => this.transport().control(this.current_zone, "next");
    previous_track = () => this.transport().control(this.current_zone, "previous");

    turn_volume = (value) => {
        let volume = {};

        let refresh_volume = (o) => {
            return new Promise(resolve => {
                this.transport().get_outputs((msg, body) => {
                    resolve(body.outputs.find(_o => _o.output_id === o.output_id).volume)
                });
            })
        }

        let change_volume = () => {
            return new Promise(resolve => {
                this.current_zone.outputs.filter(o => o.volume).forEach((o) => {
                    this.transport().change_volume(o, 'relative', value, (_) => {
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

    transfer_zone = async (zone) => {
        let old_z = this.current_zone;
        this.change_current_zone(zone)
            .then(new_z => this.transport().transfer_zone(old_z, new_z, () => Promise.resolve(this.current_zone)));
    }

    change_current_zone = (zone) => {
        const old = this.current_zone;

        let new_zone = this.transport().zone_by_object(zone);
        if (new_zone) {
            this.current_zone = new_zone;
        } else {
            logger.warn(`zone: ${zone.name} is now available.`);
            this.current_zone = old;
        }

        logger.info(`${this.current_zone.display_name} is the current zone now.`);
        return Promise.resolve(this.current_zone);
    }
}

module.exports = RoonControl;
