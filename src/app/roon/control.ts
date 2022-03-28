enum Command {
  TogglePlay = "playpause",
  NextTrack = "next",
  PreviousTrack = "previous",
  Stop = "stop",
}

type simpleControls =
  | "togglePlay"
  | "previousTrack"
  | "nextTrack"
  | "noop";

type parameterControls = "turnVolume";

class Control {
  constructor(private transport: any, private outputId: string) {}

  noop(): void {
    // do nothing
  }

  togglePlay(): void {
    this.controlOutput(Command.TogglePlay);
  }

  stop(): void {
    this.controlOutput(Command.Stop);
  }

  nextTrack(): void {
    this.controlOutput(Command.NextTrack);
  }

  previousTrack(): void {
    this.controlOutput(Command.PreviousTrack);
  }

  turnVolume(value: number): void {
    this.roonOutput().then((o) =>
      this.transport.change_volume(o, "relative", value)
    );
  }

  volumePct(): Promise<number> {
    return this.volumeObject().then(
      (v) => ((v.value - v.min) / (v.max - v.min)) * 100
    );
  }

  isPlaying(): boolean {
    return true;
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
            resolve(body.outputs.find(o => o.output_id === this.outputId));
          }
        }
      );
    });
  }

  private controlOutput(command: string): void {
    // noinspection TypeScriptValidateJSTypes
    this.roonOutput().then((o) => this.transport.control(o, command));
  }
}

export { Control, simpleControls, parameterControls };
