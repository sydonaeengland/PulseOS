import { Router } from 'express';
import { selfRegister } from '../controllers/patient.controller.js';

const router = Router();

router.post('/', selfRegister);

export default router;
