import { logger } from "../nuRoon";

enum Command {
  TogglePlay = "playpause",
  NextTrack = "next",
  PreviousTrack = "previous",
  Stop = "stop",
}

type simpleControls = "togglePlay" | "previousTrack" | "nextTrack" | "noop";

type parameterControls = "turnVolume";

type roonOutputState =
  | "playing"
  | "paused"
  | "loading"
  | "stopped"
  | "next"
  | "previous";

class Control {
  constructor(private transport: any, private outputId: string) {}

  noop(): Promise<roonOutputState> {
    return this.roonOutput().then((o) => o.state as roonOutputState);
  }

  togglePlay(): Promise<roonOutputState> {
    return this.controlOutput(Command.TogglePlay);
  }

  stop(): Promise<roonOutputState> {
    return this.controlOutput(Command.Stop);
  }

  nextTrack(): Promise<roonOutputState> {
    return this.controlOutput(Command.NextTrack).then((_) => "next");
  }

  previousTrack(): Promise<roonOutputState> {
    return this.controlOutput(Command.PreviousTrack).then((_) => "previous");
  }

  turnVolume(value: number): void {
    this.roonOutput().then((o) =>
      this.transport.change_volume(o, "relative", value)
    );
  }

  volumePct(): Promise<number> {
    return this.volumeObject().then(
      (v) => ((v.value - v.hard_limit_min) / (v.hard_limit_max - v.hard_limit_min)) * 100
    );
  }

  isPlaying(): Promise<boolean> {
    return this.roonOutput().then((o) => {
      if (o) {
        return this.transport.zone_by_zone_id(o.zone_id).state === "playing";
      } else {
        return false;
      }
    });
  }

  private volumeObject(): Promise<any> {
    return this.roonOutput().then((o) => o.volume);
  }

  transfer(destinationOutput: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transport.transfer_zone(
        this.roonOutput(),
        destinationOutput,
        (fail: boolean) => {
          if (fail) {
            reject(this);
          } else {
            resolve(destinationOutput);
          }
        }
      );
    });
  }

  private roonOutput(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.transport.get_outputs(
        (fail: boolean, body: { outputs: Array<any> }) => {
          if (fail) {
            reject("Failed to get Roon Outputs");
          } else {
            resolve(body.outputs.find((o) => o.output_id === this.outputId));
          }
        }
      );
    });
  }

  private controlOutput(command: string): Promise<roonOutputState> {
    return new Promise((resolve, reject) => {
      // noinspection TypeScriptValidateJSTypes
      this.roonOutput().then((o) =>
        this.transport.control(o, command, (fail: boolean) => {
          if (fail) {
            reject(`Failed to ${ command }.`);
          } else {
            setTimeout(() => {
              resolve(this.transport.zone_by_zone_id(o.zone_id).state);
            }, 70); // We need to wait some time to get the latest status
          }
        })
      );
    });
  }
}

export { Control, simpleControls, parameterControls };
