interface JsdelivrFileInfo {
  name: string;
  hits: {
    total: number;
    dates: any;
  };
  bandwidth: any;
}

interface GithubRepo {
  owner: string;
  repo: string;
}

interface DetailInfo {
  total: number;
  type: {
    apk: number;
    zip: number;
  };
  source: {
    github: number;
    jsdelivr: number;
    xda: number;
  };
  is_canary: boolean;
}

type VersionInfo = { [version: string]: DetailInfo };

type Unpacked<T> = T extends (infer U)[] ? U : T;
