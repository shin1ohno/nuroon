const Fs = require("fs");
let file_config;
const DEFAULT_PROPS = {
    roon_plugin_props: {
        "extension_id": "be.ohno.nuroon",
        "display_name": "Nuimo as Roon Controller",
        "display_version": "1.0.0",
        "publisher": "Shinichi Ohno",
        "email": "foo@example.com",
        "website": "https://example.com",
        "log_level": "quiet"
    }
}

const FileConfig = {
    load_config_file: () => {
        return new Promise(resolve => {
            Fs.access("./config.json", Fs.constants.R_OK, err => {
                if (err) {
                    file_config = DEFAULT_PROPS;
                } else {
                    file_config = JSON.parse(Fs.readFileSync("./config.json"));
                }
                resolve(file_config);
            });
        });
    }
}

module.exports = FileConfig;
