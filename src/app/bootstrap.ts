import { logger, NuRoon } from "./nuRoon";
import { BootstrapCore } from "./roon/bootstrapCore";
import { DeviceDiscoveryManager, NuimoControlDevice } from "rocket-nuimo";
import { Observable } from "rxjs";
import * as fs from "fs";
import { ControllerCore } from "./roon/controllerCore";
import { BootstrapManager } from "./bootstrapManager"

class Bootstrap {
  static run(): void {
    Bootstrap.findRoonCore().subscribe((bootstrapCore) => {
      Bootstrap.startNuimoDiscovery().subscribe((nuimo) => {
        this.setupWorkingDirectory(nuimo.id);
        BootstrapManager.findOrCreate(bootstrapCore, nuimo)
          .startControl()
          .then(nuRoon => logger.info(`Paired: Roon: ${nuRoon.roonCore.id()}, Nuimo: ${nuRoon.nuimo.id}`));
      });
    });
  }

  static runController(nuimoId: string): void {
    process.chdir(this.setupWorkingDirectory(nuimoId));

    const nuimoDiscovery: Promise<NuimoControlDevice> = new Promise(
      (resolve) => {
        const manager = DeviceDiscoveryManager.defaultManager;
        manager.startDiscoverySession({ deviceIds: [nuimoId] });
        manager.on("device", (device: NuimoControlDevice, _) => {
          // Not sure if deviceIds option works so checking again here.
          if (device.id === nuimoId) return resolve(device);
        });
      }
    )

    const roonDiscovery = new ControllerCore().initiateSubscription(nuimoId);

    Promise.all([nuimoDiscovery, roonDiscovery]).then(([nuimo, roon]) => {
      const nuRoon = new NuRoon(roon, nuimo);
      nuRoon.connect()
        .then((success) => {
          if (success) {
            nuRoon.startControl().then((nuRoon) => {
              logger.info("Controller launched successfully");
              return nuRoon;
            }).catch(() => {
              logger.fatal("Connection to Roon interrupted?")
              process.kill(process.pid)
            });
          }
        })
        .catch((error) => logger.fatal(error));
    });
  }

  private static setupWorkingDirectory(nuimoId: string): string {
    const workingDirectoryPath = `controllerCoreWorking/${nuimoId}`;
    if (!fs.existsSync(workingDirectoryPath)) {
      fs.mkdirSync(workingDirectoryPath, { recursive: true });
      fs.copyFileSync("./config.json", `${workingDirectoryPath}/config.json`);
      fs.linkSync(
        "./controllers.json",
        `${workingDirectoryPath}/controllers.json`
      );
    }
    return workingDirectoryPath;
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
