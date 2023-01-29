const { join } = require("path");

module.exports = {
  template(name, data) {
    return `<template id="${name}_template">${data}</template>`;
  },
  svg(include, name) {
    return include(join(__dirname, "/assets/", name + ".svg"));
    // .match(/(<svg(?:.|\n)*<\/svg>)(?:\s|\n)*$/)[1];
  },
  views: ["/src/"],
};
