import express from 'express';

import {
    createTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateTask,
} from '../controllers/taskController.js';

const router = express.Router();

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

export default router;
