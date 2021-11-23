declare module "node-roon-api" {
  class RoonApi {
    public paired_core_id: string;
    public paired_core: {
      core_id: string;
      display_name: string;
      display_version: string;
      services: { RoonApiTransport: any };
    };

    constructor(any: any);

    init_services({ required_services: Array, provided_services: Array }): void;

    start_discovery(): void;
  }

  export = RoonApi;
}
