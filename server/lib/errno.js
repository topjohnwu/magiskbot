import { ORGANIZATION } from './Shared';

const ENOPROP = 1;
const ENOID = 2;
const EINVALCODE = 3;
const EOUTDATE = 4;
const EOWNER = 5;
const EEXIST = 6;

const code = err => {
  let code = err;
  if (err.code !== undefined)
    code = err.code;
  return code;
};

const errno = {
  ENOPROP,
  ENOID,
  EINVALCODE,
  EOUTDATE,
  EOWNER,
  EEXIST,
  code,
  throw: (code, msg) => { throw { code, msg } },
  strerr: err => {
    switch (code(err)) {
      case ENOPROP:
        return '`module.prop` does not exist on `master` branch';
      case ENOID:
        return 'Missing prop `id`';
      case EINVALCODE:
        return `Invalid prop \`versionCode\`: \`${err.msg}\``;
      case EOUTDATE:
        return `Your module is outdated! Minimum Required: \`1500\`. Current: \`${err.msg}\``;
      case EOWNER:
        return `The repo does not belong to [${err.msg}](https://github.com/${err.msg})`;
      case EEXIST:
        return `The \`id\`: \`${err.msg}\` is already used in ${ORGANIZATION}, please choose another one`;
      default:
        return err;
    }
  }
};

export default errno;