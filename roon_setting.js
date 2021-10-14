const RoonApiSettings = require("node-roon-api-settings");
const FileConfig = require("./file_config.js");
const logger = require("pino")();
const PROPS_KEY = "roon_plugin_props"

const default_settings = {
    default_zone: undefined,
    zones: undefined
}

const layout = (settings) => {
    let l = {
        values: settings,
        layout: [],
        has_error: false
    };

    l.layout.push(
        {
            type: "zone",
            title: "Default Zone",
            setting: "default_zone",
        }
    )
    return l;
}

class RoonSetting {
    constructor(roon, initial_props) {
        this.roon = roon;
        this.x = initial_props;

        this.provider = new RoonApiSettings(this.roon, {
            get_settings: this.get_settings,
            save_settings: this.save_settings,
            roon_settings: this
        });
    }

    get_settings(callback) {
        FileConfig.load_config_file()
            .then(config => Object.assign(default_settings, config[PROPS_KEY]))
            .then(c => layout(c))
            .then(l => callback(l))
            .catch(e => logger.info(e))
    }

    save_settings(req, dry_run, settings) {
        let l = layout(settings.values);
        req.send_complete(l.has_error ? "NotValid" : "Success", {settings: l});

        if (!dry_run && !l.has_error) {
            this.roon_settings.x = l.values;
            this.roon_settings.roon.save_config(PROPS_KEY, this.roon_settings.x);
            this.roon_settings.provider.update_settings(l);
        }
    }
}

module.exports = RoonSetting;
