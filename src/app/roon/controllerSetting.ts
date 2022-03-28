import RoonApiSettings from "node-roon-api-settings";
import { ConfigStore, controllerConfig } from "../configStore";
import RoonApi from "node-roon-api";
import { NuRoon } from "../nuRoon";

const default_settings = {
  default_zone: {},
  longTouchLeft: {},
  longTouchRight: {},
  longTouchBottom: {},
  select: "togglePlay",
  swipeLeft: "previousTrack",
  swipeRight: "nextTrack",
  swipeUp: "noop",
  swipeDown: "noop",
  touchLeft: "previousTrack",
  touchRight: "nextTrack",
  touchTop: "noop",
  touchBottom: "noop",
  rotate: "turnVolume",
  rotary_damping_factor: 100,
  heartbeat_delay: 5,
};

const action_values = [
  { title: "Toggle Play/Pause", value: "togglePlay" },
  { title: "Previous Track", value: "previousTrack" },
  { title: "Next Track", value: "nextTrack" },
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
      setting: "longTouchLeft",
    },
    {
      type: "zone",
      title: "Zone transfer with long right tap",
      setting: "longTouchRight",
    },
    {
      type: "zone",
      title: "Zone transfer with long bottom tap",
      setting: "longTouchBottom",
    },
    {
      type: "title",
      title: "Playback settings",
    },
    {
      type: "dropdown",
      title: "Press Action",
      setting: "select",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Left Action",
      setting: "swipeLeft",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Right Action",
      setting: "swipeRight",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Up Action",
      setting: "swipeUp",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Swipe Down Action",
      setting: "swipeDown",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Left Action",
      setting: "touchLeft",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Right Action",
      setting: "touchRight",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Top Action",
      setting: "touchTop",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Touch Bottom Action",
      setting: "touchBottom",
      values: action_values,
    },
    {
      type: "dropdown",
      title: "Rotate Acton",
      setting: "rotate",
      values: [
        { title: "Volume", value: "turnVolume" },
      ],
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
              n.updateSettings();
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
          ).then(() => {
            const n = NuRoon.findWithIdPair(
              this.nuimoId,
              this.roon.paired_core_id
            );
            if (n) {
              n.connect().then((r) => {
                if (r) {
                  n.iAmHere();
                  n.updateSettings();
                }
              });
            }
          });
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
