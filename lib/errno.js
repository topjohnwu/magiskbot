import { ORGANIZATION } from './Shared';

const ENOPROP = 1;
const EINVALID = 2;
const EINVALCODE = 3;
const EEXIST = 4;

const code = (err) => {
  let c = err;
  if (err.code !== undefined) {
    c = err.code;
  }
  return c;
};

const errno = {
  ENOPROP,
  EINVALCODE,
  EEXIST,
  EINVALID,
  code,
  throw: (c, msg) => { throw { code: c, msg }; },
  strerr: (err) => {
    switch (code(err)) {
      case ENOPROP:
        return '`module.prop` does not exist on `master` branch';
      case EINVALID:
        return `Invalid prop \`id\`: \`${err.msg}\``;
      case EINVALCODE:
        return `Invalid prop \`versionCode\`: \`${err.msg}\``;
      case EEXIST:
        return `The \`id\`: \`${err.msg}\` is already used in ${ORGANIZATION}, please choose another one`;
      default:
        return err;
    }
  },
};

export default errno;
