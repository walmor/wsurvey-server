export default function applyMethods(schema, methods) {
  const copyMethods = (obj) => {
    Object.keys(methods).forEach((key) => {
      if (typeof methods[key] === 'function') {
        obj[key] = methods[key];
      }
    });
  };

  schema.set('toObject', {
    gettters: true,
    transform(doc, ret) {
      copyMethods(ret);
      return ret;
    },
  });

  copyMethods(schema.methods);
}
