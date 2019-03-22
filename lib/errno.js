import { ORGANIZATION } from './Shared';

const ENOPROP = 1;
const EINVALID = 2;
const EINVALCODE = 3;
const EOUTDATE = 4;
const EEXIST = 5;

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
  EOUTDATE,
  EEXIST,
  EINVALID,
  code,
  throw: (c, msg) => { throw { c, msg }; },
  strerr: (err) => {
    switch (code(err)) {
      case ENOPROP:
        return '`module.prop` does not exist on `master` branch';
      case EINVALID:
        return `Invalid prop \`id\`: \`${err.msg}\``;
      case EINVALCODE:
        return `Invalid prop \`versionCode\`: \`${err.msg}\``;
      case EOUTDATE:
        return `Your module is outdated! Minimum Required: \`1500\`. Current: \`${err.msg}\``;
      case EEXIST:
        return `The \`id\`: \`${err.msg}\` is already used in ${ORGANIZATION}, please choose another one`;
      default:
        return err;
    }
  },
};

export default errno;
