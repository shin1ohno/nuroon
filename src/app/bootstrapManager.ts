import { ChildProcess, spawn } from "child_process";
import { Subscription } from "rxjs";
import { BootstrapCore } from "./roon/bootstrapCore";
import { NuimoControlDevice } from "rocket-nuimo";
import { logger } from "./nuRoon";

class BootstrapManager {
  private static pairs: Array<BootstrapManager> = [];
  private controllerProcess!: ChildProcess;
  private bindings: Array<Subscription> = [];

  constructor(
    public roonCore: BootstrapCore,
    public nuimo: NuimoControlDevice,
    public active: boolean = true
  ) {
    BootstrapManager.pairs.push(this);
  }

  startControl(): Promise<BootstrapManager> {
    return this.roonCore.exposeNuimoToSetting(this.nuimo).then((setting) => {
      if (setting.connectToRoon) {
        this.startControllerCore();
      } else {
        //do nothing
      }
      return this;
    });
  }

  private startControllerCore(): void {
    this.nuimo.disconnect();
    this.active = false;
    this.controllerProcess = spawn(
      process.argv[0], // node
      [
        "-r",
        "ts-node/register",
        process.argv[1], // TS or JS file
        "controller",
        this.nuimo.id,
      ],
      {
        stdio: "inherit"
      }
    );
    this.controllerProcess.on("close", (code) => {
      logger.fatal("child process exited with code " + code);
      this.startControllerCore();
    });
  }

  public static findWithIdPair(
    nuimoId: string,
    roonCoreId: string
  ): BootstrapManager | undefined {
    return this.pairs.find(
      (p) => p && p.nuimo.id === nuimoId && roonCoreId === p.roonCore.id()
    );
  }

  public static find(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice | NuimoLike
  ): BootstrapManager | undefined {
    if (roonCore.id()) {
      return this.findWithIdPair(nuimo.id, roonCore.id() as string);
    } else {
      return undefined;
    }
  }

  public static findOrCreate(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice
  ): BootstrapManager {
    const existing = this.find(roonCore, nuimo);
    if (existing) {
      return existing;
    } else {
      return new BootstrapManager(roonCore, nuimo, false);
    }
  }

  public static all(): Array<BootstrapManager> {
    return this.pairs;
  }

  public static deleteAll(): void {
    this.pairs = [];
  }

  public static unpair(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice | NuimoLike
  ): void {
    const res = this.find(roonCore, nuimo);
    if (res) {
      delete this.pairs[this.pairs.indexOf(res)];
    }
  }
}

interface NuimoLike {
  id: string;
}

export { BootstrapManager }
