import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

app.use(cors());

// Simple User model
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Quickride')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Schema
const RideSchema = new mongoose.Schema({
    destination: String,
    timestamp: { type: Date, default: Date.now }
});
const Ride = mongoose.model('Ride', RideSchema);

// API Route to request a ride
app.post('/api/rides', async (req, res) => {
    try {
        const payload = { destination: req.body.destination };
        if (req.body.userEmail) payload.userEmail = req.body.userEmail;
        const newRide = new Ride(payload);
        await newRide.save();
        res.status(201).send({ message: "Ride saved to database!", ride: newRide });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).send({ error: 'Email and password required' });
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).send({ error: 'User already exists' });
        const hash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, passwordHash: hash });
        await user.save();
        res.status(201).send({ message: 'Registered', user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send({ error: 'Email and password required' });
        const user = await User.findOne({ email });
        if (!user) return res.status(401).send({ error: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).send({ error: 'Invalid credentials' });
        res.send({ message: 'Logged in', user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Login failed' });
    }
});

// Images listing (reads files from public/image) and returns { src, name } objects
app.get('/api/images', async (req, res) => {
    try {
        const dir = path.join(__dirname, 'public', 'image');
        const files = await fs.promises.readdir(dir);
        // map of filename -> friendly car name (customize as needed)
        const nameMap = {
            'car1.jpg': 'Sedan',
            'car3.jpg': 'SUV',
            'car4.jpg': 'Coupe',
            'img1.jpg': 'Convertible'
        };
        const images = files
            .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
            .map(f => ({
                src: `/image/${f}`,
                name: nameMap[f] || f.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            }));
        // sort by name for deterministic order
        images.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
        res.send(images);
    } catch (err) {
        console.error('Failed to read images folder', err);
        res.status(500).send({ error: 'Could not read images' });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const DEFAULT_PORT = Number(process.env.PORT) || 3000;

function startServer(port = DEFAULT_PORT, attempts = 0, maxRetries = 3) {
    const server = app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is already in use.`);
            if (attempts < maxRetries) {
                const nextPort = port + 1;
                console.warn(`Attempting to listen on port ${nextPort} (retry ${attempts + 1}/${maxRetries})`);
                setTimeout(() => startServer(nextPort, attempts + 1, maxRetries), 1000);
            } else {
                console.error(`All retries exhausted. Could not bind to a port. Exiting.`);
                process.exit(1);
            }
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

// Global handlers for unexpected failures
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

startServer();