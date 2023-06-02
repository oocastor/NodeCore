function hasAllProperties(_obj, props) {

  let check = (obj, prefix = "") => {
    let objProps = [];
    for (let o in obj) {
      if (obj[o] === undefined || obj[o] === null || obj[o] === "") continue;
      if (typeof obj[o] === "object") {
        objProps = objProps.concat(check(obj[o], prefix ? `${prefix}.${o}` : o));
      }
      objProps.push(prefix ? `${prefix}.${o}` : o);
    }
    return objProps;
  };

  let res = check(_obj);
  return props.reduce((a, r) => a = !res.includes(r) ? false : a, true);
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}

export {
  hasAllProperties,
  deepCopy,
  isEqual
}

