import { logger } from "../nuRoon";
import RoonApi from "node-roon-api";
import RoonApiStatus from "node-roon-api-status";
import RoonApiTransport from "node-roon-api-transport";
import RoonApiSettings from "node-roon-api-settings";
import { ConfigStore, roonPluginProps } from "../configStore";
import { ControllerSetting } from "./controllerSetting";

class ControllerCore {
  public core: any;
  public roonStatus: typeof RoonApiStatus;
  public roonApiSettings: typeof RoonApiSettings;
  private nuimoId!: string;
  public setting!: ControllerSetting;

  initiateSubscription(nuimoId: string): Promise<ControllerCore> {
    this.nuimoId = nuimoId;
    return ConfigStore.loadControllerPluginProps(nuimoId).then((conf) =>
      this.subscribe(conf)
    );
  }

  id(): string | undefined {
    if (this.core) {
      return this.core.core_id;
    } else {
      return undefined;
    }
  }

  transport(): any {
    return this.core.services.RoonApiTransport;
  }

  private subscribe(conf: roonPluginProps): Promise<ControllerCore> {
    return new Promise((resolve) => {
      const roon = new RoonApi(
        Object.assign(conf, {
          core_paired: (core: any) => {
            this.core = core;
            logger.info(
              `Subscribed to ${this.core.display_name} (${this.core.display_version}).`
            );
            this.roonStatus.set_status("Subscribed to core", false);
            resolve(this);
          },
          core_unpaired: (_: any) => {
            if (this.core) {
              logger.info(
                `Unpaired ${this.core.display_name} (${this.core.display_version}).`
              );
            }
          },
        })
      );
      this.roonStatus = new RoonApiStatus(roon);
      this.setting = new ControllerSetting(roon, this.nuimoId);
      this.roonApiSettings = this.roonSettings(roon);
      roon.init_services({
        required_services: [RoonApiTransport],
        provided_services: [this.roonStatus, this.roonApiSettings],
      });
      roon.start_discovery();
    });
  }

  private roonSettings(roon: any): any {
    return this.setting.provider;
  }
}

export { ControllerCore };
