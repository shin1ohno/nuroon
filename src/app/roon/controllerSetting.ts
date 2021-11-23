import RoonApiSettings from "node-roon-api-settings";
import { ConfigStore, controllerConfig } from "../configStore";
import RoonApi from "node-roon-api";
import { NuRoon } from "../nuRoon";

const default_settings = {
  default_zone: {},
  long_left: {},
  long_right: {},
  long_top: {},
  long_bottom: {},
  press: "toggle_play",
  swipe_left: "previous_track",
  swipe_right: "next_track",
  swipe_up: "noop",
  swipe_down: "noop",
  touch_left: "previous_track",
  touch_right: "next_track",
  touch_top: "noop",
  touch_bottom: "noop",
  fly_left: "noop",
  fly_right: "noop",
  rotary_damping_factor: 25,
  heartbeat_delay: 5,
};

const action_values = [
  { title: "Toggle Play/Pause", value: "toggle_play" },
  { title: "Previous Track", value: "previous_track" },
  { title: "Next Track", value: "next_track" },
  { title: "No action", value: "noop" },
];

const layout = (settings: any) => {
  const l = {
    values: settings,
    layout: <any>[],
    has_error: false,
  };

  l.layout.push(
    {
      type: "label",
      title: "Zone settings",
    },
    {
      type: "zone",
      title: "Default Zone",
      setting: "default_zone",
    },
    {
      type: "zone",
      title: "Zone transfer with long left tap",
      setting: "long_left",
    },
    {
      type: "zone",
      title: "Zone transfer with long right tap",
      setting: "long_right",
    },
    {
      type: "zone",
      title: "Zone transfer with long top tap (not recommended)",
      setting: "long_top",
    },
    {
      type: "zone",
      title: "Zone transfer with long bottom tap",
      setting: "long_bottom",
    },
    {
      type: "title",
      title: "Playback settings",
    },
    {
      type: "dropdown",
      title: "Press Action",
      setting: "press",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Left Action",
      setting: "swipe_left",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Right Action",
      setting: "swipe_right",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Up Action",
      setting: "swipe_up",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Down Action",
      setting: "swipe_down",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Left Action",
      setting: "touch_left",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Right Action",
      setting: "touch_right",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Top Action",
      setting: "touch_top",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Bottom Action",
      setting: "touch_bottom",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Fly Left Action",
      setting: "fly_left",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Fly Right Action",
      setting: "fly_right",
      values: action_values,
    },
    {
      type: "group",
      title: "Advanced settings",
      collapsable: true,
      items: [
        {
          type: "integer",
          title: "Rotary damping factor",
          setting: "rotary_damping_factor",
        },
        {
          type: "integer",
          title: "Heartbeat delay in seconds",
          setting: "heartbeat_delay",
        },
      ],
    }
  );
  return l;
};

class ControllerSetting {
  public readonly provider: typeof RoonApiSettings;

  constructor(
    private readonly roon: RoonApi,
    private readonly nuimoId: string
  ) {
    this.provider = new RoonApiSettings(this.roon, {
      get_settings: (callback: any) => {
        ConfigStore.loadControllerConfig(this.nuimoId).then((config) =>
          callback(layout(ControllerSetting.configToSettings(config)))
        );
        const n = NuRoon.findWithIdPair(this.nuimoId, this.roon.paired_core_id);
        if (n) {
          n.connect().then((r) => {
            if (r) {
              n.iAmHere();
            }
          });
        }
      },
      save_settings: (
        req: any,
        dry_run: boolean,
        settings: { values: any }
      ) => {
        const l = layout(settings.values);
        req.send_complete(l.has_error ? "NotValid" : "Success", {
          settings: l,
        });

        if (!dry_run && !l.has_error) {
          this.provider.update_settings(l);
          ConfigStore.saveControllerConfig(
            ControllerSetting.settingsToConfig(settings.values, this.nuimoId),
            this.nuimoId
          );
        }
      },
    });
  }

  private static configToSettings(config: controllerConfig) {
    return Object.assign(default_settings, config.settings);
  }

  private static settingsToConfig(
    settings: any,
    nuimoId: string
  ): controllerConfig {
    return {
      nuimoId: nuimoId,
      settings: settings,
    };
  }
}

export { ControllerSetting };
