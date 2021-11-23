import { BootstrapCore } from "./roon/bootstrapCore";
import { ControllerCore } from "./roon/controllerCore";
import {
  digitGlyphs,
  DisplayTransition,
  NuimoControlDevice,
} from "rocket-nuimo";
import { pino } from "pino";
import { ChildProcess, fork } from "child_process";
import { fromEvent } from "rxjs";
import { Control } from "./roon/control";
import { ConfigStore } from "./configStore";

export const logger = pino({ level: "trace" });

class NuRoon {
  private static pairs: Array<NuRoon> = [];
  private controllerProcess!: ChildProcess;

  constructor(
    public roonCore: BootstrapCore | ControllerCore,
    public nuimo: NuimoControlDevice,
    public active: boolean = true
  ) {
    NuRoon.pairs.push(this);
  }

  connect(): Promise<boolean> {
    logger.info(`Connecting to Nuimo: ${this.nuimo.id}`);
    return this.nuimo
      .connect()
      .then((res) => {
        if (res) {
          logger.info(`Connected to Nuimo: ${this.nuimo.id}`);
        } else {
          logger.info(`Failed to connect to Nuimo: ${this.nuimo.id}`);
        }
        return res;
      })
      .then((res) => (this.active = res));
  }

  disconnect(): void {
    this.nuimo.disconnect();
    if (this.controllerProcess) {
      this.controllerProcess.kill("SIGHUP");
    }
    this.active = false;
    logger.info(`Disconnected Nuimo: ${this.nuimo.id}`);
  }

  exposeToRoonSettings(): Promise<NuRoon> {
    if (this.roonCore instanceof BootstrapCore) {
      return this.roonCore.exposeNuimoToSetting(this.nuimo).then((setting) => {
        if (setting.connectToRoon) {
          this.startControllerCore();
        } else {
          this.disconnect();
        }
        return this;
      });
    } else {
      //controller doesn't need explicit setting exposure
      return Promise.reject(this);
    }
  }

  iAmHere(): Promise<NuRoon> {
    const firstDigit = parseInt(this.nuimo.id[0], 10);
    return this.nuimo
      .displayGlyph(digitGlyphs[firstDigit || 0], {
        transition: DisplayTransition.CrossFade,
        timeoutMs: 5_000,
      })
      .then((_) => this);
  }

  startControl(): void {
    if (this.roonCore instanceof ControllerCore) {
      const c = this.roonCore as ControllerCore;
      c.transport().subscribe_outputs((status: string, body: any) => {
        switch (status) {
        case "Subscribed":
          ConfigStore.loadControllerConfig(this.nuimo.id).then((config) => {
            const control = new Control(
              c.transport(),
              config.settings["default_zone"]["output_id"]
            );

            const simpleOperations = {
              select: "togglePlay",
              swipeRight: "nextTrack",
              swipeLeft: "previousTrack",
              touchLeft: "previousTrack",
              touchRight: "nextTrack",
            };

            const parameterOperations = {
              rotate: "turnVolume",
            };

            Object.entries(simpleOperations).forEach(
              (entry: [string, string]) =>
                fromEvent(this.nuimo, entry[0]).subscribe(() =>
                  eval(`control.${entry[1]}()`)
                )
            );

            Object.entries(parameterOperations).forEach(
              (entry: [string, string]) =>
                fromEvent(this.nuimo, entry[0]).subscribe((e) =>
                  eval(`control.${entry[1]}(e[0] * 100)`)
                )
            );
          });
          break;
        case "NetworkError":
          this.disconnect();
          logger.warn(`Controller was killed due to ${status}.`);
          logger.warn(`Rebooting the controller core.`);
          process.chdir("../../");
          this.startControllerCore();
          logger.warn(`Rebooted the controller core.`);
          break;
        case "Changed":
          //do nothing here
          break;
        default:
          logger.warn(`Unexpected Roon subscription status: ${status}.`);
        }
      });
    } else {
      //do nothing
    }
  }

  public static findOrCreate(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice
  ): NuRoon {
    const existing = this.find(roonCore, nuimo);
    if (existing) {
      return existing;
    } else {
      const newPair = new NuRoon(roonCore, nuimo, false);
      return newPair;
    }
  }

  public static unpair(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice | NuimoLike
  ): void {
    const res = this.find(roonCore, nuimo);
    if (res) {
      res.disconnect();
      delete this.pairs[this.pairs.indexOf(res)];
    }
  }

  public static all(): Array<NuRoon> {
    return this.pairs;
  }

  public static deleteAll(): void {
    this.pairs = [];
  }

  public static find(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice | NuimoLike
  ): NuRoon | undefined {
    if (roonCore.id()) {
      return this.findWithIdPair(nuimo.id, roonCore.id() as string);
    } else {
      return undefined;
    }
  }

  public static findWithIdPair(
    nuimoId: string,
    roonCoreId: string
  ): NuRoon | undefined {
    return this.pairs.find(
      (p) => p.nuimo.id === nuimoId && roonCoreId === p.roonCore.id()
    );
  }

  private startControllerCore(): void {
    this.controllerProcess = fork("./src/index.ts", [
      "controller",
      this.nuimo.id,
    ]);
  }
}

interface NuimoLike {
  id: string;
}

export { NuRoon };
