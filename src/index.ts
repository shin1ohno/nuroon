import { Bootstrap } from "./app/bootstrap";
import { ControllerCore } from "./app/roon/controllerCore";
import { logger, NuRoon } from "./app/nuRoon";
import {
  DeviceDiscoveryManager,
  linkGlyph,
  NuimoControlDevice,
} from "rocket-nuimo";

if (process.argv[2] === "controller") {
  const nuimoId: string = process.argv[3];
  if (nuimoId) {
    const workingDir = `./controllerCoreWorking/${nuimoId}`;
    process.chdir(workingDir);

    const nuimoDiscovery: Promise<NuimoControlDevice> = new Promise(
      (resolve) => {
        const manager = DeviceDiscoveryManager.defaultManager;
        manager.startDiscoverySession({ deviceIds: [nuimoId] });
        manager.on("device", (device: NuimoControlDevice, _) => {
          // Not sure if deviceIds option works so checking again here.
          if (device.id === nuimoId) return resolve(device);
        });
      }
    );

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
              logger.error("Fatal");
            });

          }
        })
        .catch((error) => logger.fatal(error));
    });
  }
}
else {
  Bootstrap.run();
}
