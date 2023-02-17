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

type Unpacked<T> = T extends (infer U)[] ? U : T;
