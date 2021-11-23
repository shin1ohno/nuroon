import { access, readFile, writeFile } from "fs/promises";
import { constants } from "fs";

const ROON_DEFAULT_FILE = "./config.json";
const CONTROLLERS_CONFIG = "./controllers.json";

const BOOTSTRAP_PROPS: roonPluginProps = {
  extension_id: "be.ohno.nuroon",
  display_name: "Nuimo Manager",
  display_version: "1.0.0",
  publisher: "Shinichi Ohno",
  email: "foo@example.com",
  website: "https://example.com",
  log_level: "none",
};

interface controllerConfig {
  nuimoId: string;
  settings: any;
}

interface roonPluginProps {
  extension_id: string;
  display_name: string;
  display_version: string;
  publisher: string;
  email: string;
  website: string;
  log_level: string;
}

interface nuimoDeviceConfig {
  id: string;
  connectToRoon: boolean;
}

interface nuimoDeviceConfigs {
  nuimoDevices: Array<nuimoDeviceConfig>;
}

const ConfigStore = {
  loadConfigFile(fileName: string): Promise<string> {
    return access(fileName, constants.R_OK).then(() =>
      readFile(fileName, { encoding: "utf8" })
    );
  },
  loadRoonConfig(): Promise<nuimoDeviceConfigs> {
    return this.loadConfigFile(ROON_DEFAULT_FILE)
      .then((jsonContent): nuimoDeviceConfigs => JSON.parse(jsonContent).x)
      .then((config): nuimoDeviceConfigs => {
        if (config.nuimoDevices) {
          return config;
        } else {
          return { nuimoDevices: [] };
        }
      });
  },
  saveConfigFile(fileName:string, key: string, value: any): Promise<void> {
    return this.loadConfigFile(fileName).then((content) => {
      const config = JSON.parse(content);
      config[key] = value;
      return writeFile(fileName, JSON.stringify(config, null, "    "), {
        encoding: "utf-8",
      });
    });
  },
  saveRoonConfig(value: any): Promise<void> {
    return this.saveConfigFile(ROON_DEFAULT_FILE,"x", value);
  },
  loadBootstrapPluginProps(): Promise<roonPluginProps> {
    return this.loadConfigFile(ROON_DEFAULT_FILE).then((config) => {
      return Object.assign(
        BOOTSTRAP_PROPS,
        JSON.parse(config).roon_plugin_props || {}
      );
    });
  },
  loadControllerPluginProps(nuimoId: string): Promise<roonPluginProps> {
    return this.loadBootstrapPluginProps().then((props) => {
      props.extension_id = `${props.extension_id}.${nuimoId}`;
      props.display_name = `Nuimo: ${nuimoId}`;
      return props;
    });
  },
  loadControllerConfig(nuimoId: string): Promise<controllerConfig> {
    return this.loadConfigFile(CONTROLLERS_CONFIG)
      .then((config) => {
        return (JSON.parse(config).x.controllerSettings || []).find(
          (s: controllerConfig) => s.nuimoId === nuimoId
        );
      })
      .then((selection: controllerConfig | undefined) => {
        return selection || { nuimoId: nuimoId, settings: {} };
      });
  },
  saveControllerConfig(config: controllerConfig, nuimoId: string): Promise<void> {
    return this.loadConfigFile(CONTROLLERS_CONFIG)
      .then((config) => JSON.parse(config).x.controllerSettings || [])
      .then((configs: Array<controllerConfig>) => {
        const selection = configs.find(
          (s: controllerConfig) => s.nuimoId === nuimoId
        );
        const newValues: controllerConfig = {
          nuimoId: nuimoId,
          settings: config.settings,
        };
        if (selection) {
          Object.assign(selection, newValues);
        } else {
          configs.push(newValues);
        }
        return configs;
      })
      .then((configs) =>
        this.saveConfigFile(CONTROLLERS_CONFIG,"x", { controllerSettings: configs })
      );
  },
};

export {
  ConfigStore,
  nuimoDeviceConfigs,
  nuimoDeviceConfig,
  roonPluginProps,
  controllerConfig,
};
