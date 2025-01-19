"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const models_1 = require("../models");
(0, globals_1.beforeAll)(async () => {
    await models_1.sequelize.sync({ force: true });
});
(0, globals_1.afterAll)(async () => {
    await models_1.sequelize.close();
});
