import { isModuleNamespaceObject } from "util/types";

function deployFunc() {
  console.log("HI!");
}

module.exports.default = deployFunc;
