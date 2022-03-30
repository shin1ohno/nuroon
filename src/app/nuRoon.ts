import { ControllerCore } from "./roon/controllerCore";
import {
  digitGlyphs,
  DisplayTransition,
  filledGlyph,
  NuimoControlDevice,
} from "rocket-nuimo";
import { pino } from "pino";
import { fromEvent, interval, Subscription } from "rxjs";
import { Control, parameterControls, simpleControls } from "./roon/control";
import { ConfigStore } from "./configStore";
import * as util from "util";
import { controlGlyphs, volumeGlyphs } from "./glyphs";

export const logger = pino({ level: "trace" });

class NuRoon {
  private bindings: Array<Subscription> = [];

  constructor(
    public roonCore: ControllerCore,
    public nuimo: NuimoControlDevice,
  ) {}

  startControl(): Promise<NuRoon> {
    return this.updateSettings()
      .then((n) => n.connect())
      .then((_) => this);
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

  ping(): void {
    if (this.nuimo) {
      this.nuimo.displayGlyph(filledGlyph.resize(1, 1), {
        transition: DisplayTransition.Immediate,
        timeoutMs: 50,
        brightness: 0.1,
      });
    } else {
      logger.info("Nuimo is not connected.");
    }
  }

  public updateSettings(): Promise<NuRoon> {
    this.bindings.forEach((s) => s.unsubscribe());
    const c = this.roonCore as ControllerCore;

    return ConfigStore.loadControllerConfig(this.nuimo.id)
      .then((config) => {
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
            rotate: settings.rotate,
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
                    });
                  }
                });
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
              logger.warn(
                `Unhandled operation: ${eventName}, ${util.inspect(
                  controlName
                )}.`
              );
            }
          });
          logger.info(`settings: ${util.inspect(settings)}`);
        } else {
          //Do nothing
        }
      })
      .then((_) => this)
      .catch((reason) => {
        logger.fatal(reason);
        logger.fatal("Rebooting the controller process.");
        NuRoon.restart();
        return this;
      });
  }

  public static restart() {
    process.kill(process.pid);
  }
}

export { NuRoon };
