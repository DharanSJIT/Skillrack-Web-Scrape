import express from 'express';
import { fetchProfile } from '../controllers/profileController.js';

const router = express.Router();

router.post('/fetch-profile', fetchProfile);

export default router;
