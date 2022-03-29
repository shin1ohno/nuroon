import { logger, NuRoon } from "./nuRoon";
import { BootstrapCore } from "./roon/bootstrapCore";
import { DeviceDiscoveryManager, NuimoControlDevice } from "rocket-nuimo";
import { Observable, map } from "rxjs";
import { mergeMap } from "rxjs/operators";
import * as fs from "fs";

class Bootstrap {
  static run(): void {
    Bootstrap.findRoonCore().subscribe((bootstrapCore) => {
      Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
        this.SetupWorkingDirectory(nuimo.id);
        NuRoon.findOrCreate(bootstrapCore, nuimo)
          .startControl()
          .then(nuRoon => logger.info(`Paired: Roon: ${nuRoon.roonCore.id()}, Nuimo: ${nuRoon.nuimo.id}`));
      });
    });
  }

  private static SetupWorkingDirectory(nuimoId: string): void {
    const workingDirectoryPath = `controllerCoreWorking/${nuimoId}`;
    if (!fs.existsSync(workingDirectoryPath)) {
      fs.mkdirSync(workingDirectoryPath, { recursive: true });
      fs.copyFileSync("./config.json", `${workingDirectoryPath}/config.json`);
      fs.linkSync(
        "./controllers.json",
        `${workingDirectoryPath}/controllers.json`
      );
    }
  }

  private static findRoonCore(): Observable<BootstrapCore> {
    const roonCore = new BootstrapCore();
    return roonCore.initiateSubscription();
  }

  private static startNuimoDiscovery(): Observable<NuimoControlDevice> {
    const manager = DeviceDiscoveryManager.defaultManager;
    manager.startDiscoverySession();
    logger.info("Starting Nuimo discovery.");
    logger.info("Waiting for Nuimo...");
    return new Observable<NuimoControlDevice>((subscriber) => {
      manager.on("device", (device, newDevice) => {
        logger.info(`Nuimo found: ${device.id}.`);
        subscriber.next(device);
      });
    });
  }
}

export { Bootstrap };
