import { BootstrapCore } from "./roon/bootstrapCore";
import { ControllerCore } from "./roon/controllerCore";
import {
  digitGlyphs,
  DisplayTransition,
  emptyGlyph,
  errorGlyph,
  filledGlyph,
  Glyph,
  NuimoControlDevice,
  stopGlyph,
} from "rocket-nuimo";
import { pino } from "pino";
import { ChildProcess, fork } from "child_process";
import { fromEvent, interval, Subscription } from "rxjs";
import { Control, parameterControls, simpleControls } from "./roon/control";
import { ConfigStore } from "./configStore";
import * as util from "util";

export const logger = pino({ level: "trace" });

const pauseGlyph = Glyph.fromString([
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
  "  ** **  ",
]);

const playingGlyph = Glyph.fromString([
  "  **     ",
  "  ***    ",
  "  ****   ",
  "  *****  ",
  "  ****** ",
  "  *****  ",
  "  ****   ",
  "  ***    ",
  "  **     ",
]);

const rightGlyphStrings = [
  " **    *",
  " ***   *",
  " ****  *",
  " ***** *",
  " *******",
  " ***** *",
  " ****  *",
  " ***   *",
  " **    *",
];

const rightGlyph = Glyph.fromString(rightGlyphStrings);

const leftGlyph = Glyph.fromString(
  rightGlyphStrings.map((r) => r.split("").reverse().join(""))
);

const volume1 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
]);

const volume2 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
]);

const volume3 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume4 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume5 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume6 = Glyph.fromString([
  "         ",
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume7 = Glyph.fromString([
  "         ",
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume8 = Glyph.fromString([
  "         ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

const volume9 = Glyph.fromString([
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
  "    *    ",
]);

export const controlGlyphs: {
  playing: Glyph;
  paused: Glyph;
  stopped: Glyph;
  loading: Glyph;
  next: Glyph;
  previous: Glyph;
} = {
  playing: playingGlyph,
  paused: pauseGlyph,
  stopped: stopGlyph,
  loading: errorGlyph,
  next: rightGlyph,
  previous: leftGlyph,
};

export const volumeGlyphs: {
  volume0: Glyph;
  volume1: Glyph;
  volume2: Glyph;
  volume3: Glyph;
  volume4: Glyph;
  volume5: Glyph;
  volume6: Glyph;
  volume7: Glyph;
  volume8: Glyph;
  volume9: Glyph;
} = {
  volume0: emptyGlyph,
  volume1: volume1,
  volume2: volume2,
  volume3: volume3,
  volume4: volume4,
  volume5: volume5,
  volume6: volume6,
  volume7: volume7,
  volume8: volume8,
  volume9: volume9,
};

class NuRoon {
  private static pairs: Array<NuRoon> = [];
  private controllerProcess!: ChildProcess;
  private bindings: Array<Subscription> = [];

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

  public static findOrCreate(
    roonCore: BootstrapCore,
    nuimo: NuimoControlDevice
  ): NuRoon {
    const existing = this.find(roonCore, nuimo);
    if (existing) {
      return existing;
    } else {
      return new NuRoon(roonCore, nuimo, false);
    }
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

  public static findWithIdPair(
    nuimoId: string,
    roonCoreId: string
  ): NuRoon | undefined {
    return this.pairs.find(
      (p) => p && p.nuimo.id === nuimoId && roonCoreId === p.roonCore.id()
    );
  }

  startControl(): void {
    if (this.roonCore instanceof ControllerCore) {
      const c = this.roonCore as ControllerCore;
      c.transport().subscribe_zones((status: string, body: any) => {
        // do nothing
      });
      c.transport().subscribe_outputs((status: string, body: any) => {
        switch (status) {
        case "Subscribed":
          this.updateSettings();
          break;
        case "NetworkError":
          this.disconnect();
          logger.warn(`Controller was killed due to ${status}.`);
          logger.warn(`Rebooting the controller core.`);
          process.chdir("../../");
          this.startControllerCore();
          process.kill(process.pid);
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

  disconnect(): void {
    this.nuimo.disconnect();
    const i = NuRoon.pairs.indexOf(this);
    if (i) {
      delete NuRoon.pairs[i];
    }
    if (this.controllerProcess) {
      this.controllerProcess.kill("SIGHUP");
    }
    this.active = false;
    logger.info(`Disconnected Nuimo: ${this.nuimo.id}`);
  }

  ping(): void {
    if (this.nuimo) {
      this.nuimo.displayGlyph(filledGlyph.resize(1, 1), {
        transition: DisplayTransition.Immediate,
        timeoutMs: 50,
        brightness: 0.1
      });
    } else {
      logger.info("Nuimo is not connected.");
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

  public updateSettings() {
    this.bindings.forEach((s) => s.unsubscribe());
    const c = this.roonCore as ControllerCore;

    ConfigStore.loadControllerConfig(this.nuimo.id).then((config) => {
      const settings = config.settings;
      const zone = settings["default_zone"];

      if (settings && zone) {
        const control = new Control(c.transport(), zone["output_id"]);

        const simpleOperations: {
          select: simpleControls;
          swipeRight: simpleControls;
          swipeLeft: simpleControls;
          touchLeft: simpleControls;
          touchRight: simpleControls;
          swipeUp: simpleControls;
          swipeDown: simpleControls;
          touchTop: simpleControls;
          touchBottom: simpleControls;
        } = {
          select: settings.select,
          swipeRight: settings.swipeRight,
          swipeLeft: settings.swipeLeft,
          touchLeft: settings.touchLeft,
          touchRight: settings.touchRight,
          swipeUp: settings.swipeUp,
          swipeDown: settings.swipeDown,
          touchTop: settings.touchTop,
          touchBottom: settings.touchBottom,
        };

        const parameterOperations: {
          rotate: parameterControls;
        } = {
          rotate: "turnVolume",
        };

        const advancedParameters: {
          rotary_damping_factor: number;
          heartbeat_delay: number;
        } = {
          rotary_damping_factor: settings.rotary_damping_factor,
          heartbeat_delay: settings.heartbeat_delay,
        };

        Object.entries(settings).forEach((entry) => {
          const eventName = entry[0];
          const controlName = entry[1];

          if (eventName in simpleOperations) {
            const s = fromEvent(this.nuimo, eventName).subscribe(() =>
              control[controlName as simpleControls]().then((state) => {
                logger.info(state);
                if (state in controlGlyphs) {
                  this.nuimo.displayGlyph(controlGlyphs[state], {
                    transition: DisplayTransition.CrossFade,
                    timeoutMs: 500,
                    brightness: 1,
                  });
                }
              })
            );
            this.bindings.push(s);
          } else if (eventName in parameterOperations) {
            const s = fromEvent(this.nuimo, eventName).subscribe((e) => {
              const vol =
                (e as [number])[0] * advancedParameters.rotary_damping_factor;
              control[controlName as parameterControls](vol);
              control.volumePct().then((n) => {
                const i = Math.round(n / 10);
                const key = `volume${i}`;
                logger.debug(`volume: ${i}`);
                if (key in volumeGlyphs) {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  this.nuimo.displayGlyph(volumeGlyphs[key], {
                    timeoutMs: 1000,
                    transition: DisplayTransition.Immediate,
                    brightness: 1,
                  })
                }
              })
            });
            this.bindings.push(s);
          } else if (eventName in advancedParameters) {
            const s = interval(
              advancedParameters.heartbeat_delay * 1000
            ).subscribe(() => {
              control.isPlaying().then((res) => {
                if (res) {
                  this.ping();
                }
              });
            });
            this.bindings.push(s);
          } else {
            logger.warn(`Unhandled operation: ${eventName}, ${util.inspect(controlName)}.`);
          }
        });
        logger.info(`settings: ${util.inspect(settings)}`);
      } else {
        //Write default
      }
    });
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
