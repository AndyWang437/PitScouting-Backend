"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const team_controller_1 = require("../controllers/team.controller");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
router.post('/', upload_1.default.single('robotImage'), team_controller_1.createTeam);
router.get('/:teamNumber', team_controller_1.getTeam);
router.get('/', team_controller_1.getAllTeams);
router.put('/:teamNumber', upload_1.default.single('robotImage'), team_controller_1.updateTeam);
exports.default = router;
