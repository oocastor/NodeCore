function hasAllProperties(obj, props) {
  let check = (obj) => {
    let objProps = [];

    for (let o in obj) {
      if (obj[o] === undefined || obj[o] === null || obj[o] === "") continue;
      if (typeof obj[o] !== "object") {
        objProps.push(o);
      } else {
        objProps.push(o);
        objProps = objProps.concat(check(obj[o]));
      }
    }
    return objProps;
  };
  return props.reduce((a, r) => a = !check(obj).includes(r) ? false : a, true);
}

function deepCopy (obj) {
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

