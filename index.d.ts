interface JsdelivrFileInfo {
  [path: string]: {
    total: number;
    dates: any;
  };
}

interface JsdelivrStats {
  total: number;
  files: JsdelivrFileInfo;
}

interface GithubRepo {
  owner: string;
  repo: string;
}
