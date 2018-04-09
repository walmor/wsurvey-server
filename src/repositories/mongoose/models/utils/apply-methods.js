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
    versionKey: false,
    transform(doc, ret) {
      copyMethods(ret);

      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }

      return ret;
    },
  });

  copyMethods(schema.methods);
}
