import { NuimoControlDevice } from "rocket-nuimo";
import { logger, NuRoon } from "../nuRoon";
import RoonApi from "node-roon-api";
import RoonApiStatus from "node-roon-api-status";
import RoonApiTransport from "node-roon-api-transport";
import RoonApiSettings from "node-roon-api-settings";
import {
  ConfigStore,
  nuimoDeviceConfig,
  nuimoDeviceConfigs,
  roonPluginProps,
} from "../configStore";
import { Observable, Subscriber } from "rxjs";
import { BootstrapManager } from "../bootstrapManager";

class BootstrapCore {
  public core: any;
  public roonStatus: typeof RoonApiStatus;
  public roonApiSettings: typeof RoonApiSettings;

  initiateSubscription(): Observable<BootstrapCore> {
    return new Observable((subscriber) => {
      ConfigStore.loadBootstrapPluginProps().then((conf) =>
        this.subscribe(conf, subscriber)
      );
    });
  }

  exposeNuimoToSetting(nuimo: NuimoControlDevice): Promise<nuimoDeviceConfig> {
    return ConfigStore.loadRoonConfig()
      .then((config) => {
        const existing: Array<nuimoDeviceConfig> = config.nuimoDevices;
        return {
          nuimoDevices: BootstrapCore.addOrUpdateNuimoDeviceSettings(
            existing,
            nuimo
          )
        };
      })
      .then((newConfig): nuimoDeviceConfig => {
        ConfigStore.saveRoonConfig(newConfig).catch((e) => logger.warn(e));
        const selection = newConfig.nuimoDevices.find((n) => n.id == nuimo.id);
        if (selection) {
          return selection;
        } else {
          throw new Error("No way to reach here?");
        }
      });
  }

  id(): string | undefined {
    if (this.core) {
      return this.core.core_id;
    } else {
      return undefined;
    }
  }

  private static configToSettings(config: nuimoDeviceConfigs) {
    return config.nuimoDevices.reduce((pre, cur) => {
      const setting: any = {};
      setting[cur.id] = cur.connectToRoon;
      Object.assign(pre, setting);
      return pre;
    }, {});
  }

  private static settingsToConfig(settings: any): nuimoDeviceConfigs {
    const ss = Object.entries(settings).map(([key, value]) => {
      return { id: key, connectToRoon: !!value };
    });
    return { nuimoDevices: ss };
  }

  private static addOrUpdateNuimoDeviceSettings(
    existing: Array<nuimoDeviceConfig>,
    nuimo: NuimoControlDevice
  ): Array<nuimoDeviceConfig> {
    if (existing.map((n) => n.id).includes(nuimo.id)) {
      return existing;
    } else {
      return existing.concat([{ id: nuimo.id, connectToRoon: false }]);
    }
  }

  private subscribe(
    conf: roonPluginProps,
    subscriber: Subscriber<BootstrapCore>
  ): void {
    const roon = new RoonApi(
      Object.assign(conf, {
        core_paired: (core: any) => {
          this.core = core;
          logger.info(
            `Subscribed to ${this.core.display_name} (${this.core.display_version}).`
          );
          this.roonStatus.set_status("Subscribed to core", false);
          subscriber.next(this);
        },
        core_unpaired: (_: any) => {
          logger.info(
            `Unpaired ${this.core.display_name} (${this.core.display_version}).`
          );
          roon.start_discovery();
        },
      })
    );
    this.roonStatus = new RoonApiStatus(roon);
    this.roonApiSettings = this.roonSettings(roon);
    roon.init_services({
      required_services: [RoonApiTransport],
      provided_services: [this.roonStatus, this.roonApiSettings],
    });
    roon.start_discovery();
  }

  private roonSettings(roon: any): any {
    const layout = (settings: any) => {
      const l = {
        values: settings,
        layout: <any>[],
        has_error: false,
      };

      l.layout.push({
        type: "title",
        title: "Nuimo Found:",
      });

      Object.keys(settings).forEach((id: string) =>
        l.layout.push({
          type: "dropdown",
          title: `Use ${id} as a Roon Controller`,
          setting: id,
          values: [
            { title: "Yes. Connect on save", value: true },
            { title: "No. Disconnect on save", value: false },
          ],
        })
      );

      return l;
    };

    const roonApiSettings = new RoonApiSettings(roon, {
      get_settings: (callback: any): void => {
        ConfigStore.loadRoonConfig().then((config) =>
          callback(layout(BootstrapCore.configToSettings(config)))
        );
      },
      save_settings: (
        req: any,
        dry_run: boolean,
        settings: { values: any }
      ): void => {
        const l = layout(settings.values);
        req.send_complete(l.has_error ? "NotValid" : "Success", {
          settings: l,
        });

        if (!dry_run && !l.has_error) {
          ConfigStore.saveRoonConfig(
            BootstrapCore.settingsToConfig(l.values)
          ).then(() => {
            roonApiSettings.update_settings(l);
            Object.entries(l.values)
              .map(([key, value]): nuimoDeviceConfig => {
                return { id: key, connectToRoon: !!value };
              })
              .forEach((setting) => {
                const n = BootstrapManager.find(this, { id: setting.id });
                if (!n) return;
                if (setting.connectToRoon) {
                  n.startControl();
                }
              });
          });
        }
      },
    });

    return roonApiSettings;
  }
}

export { BootstrapCore };
