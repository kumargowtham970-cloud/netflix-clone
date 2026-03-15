const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(compression());
const PORT = process.env.PORT || 3000;

// Middleware allows our frontend to connect to this backend
app.use(cors());
app.use(express.json());

// Set up Multer for form uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'video') {
            cb(null, path.join(__dirname, 'videos/'));
        } else if (file.fieldname === 'thumbnail') {
            cb(null, path.join(__dirname, 'uploads/'));
        }
    },
    filename: function (req, file, cb) {
        // Name the file cleanly to avoid duplicates
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// MongoDB Connection String
// Use environment variable for production hosting (e.g. MongoDB Atlas)
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/netflix_clone';

// Connect to MongoDB
mongoose.connect(mongoURI)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB!');
    })
    .catch((error) => {
        console.error('❌ Error connecting to MongoDB:', error);
    });

// Define a Video Schema
const videoSchema = new mongoose.Schema({
    title: String,
    thumbnailUrl: String,
    videoUrl: String,
    description: String,
    category: String
});

// Create a Model based on the Schema
const Video = mongoose.model('Video', videoSchema);

// Define a User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// API test route
app.get('/api/status', (req, res) => {
    res.json({ message: 'Welcome to the Netflix Clone API!' });
});

// API route to get all videos
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find();
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// A temporary route to seed our database with some fake video data
app.get('/api/seed', async (req, res) => {
    try {
        // Commented out clearing so we don't delete user's custom uploaded video
        // await Video.deleteMany({});


        const dummyVideos = [
            {
                title: "Big Buck Bunny",
                thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
                videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                description: "A large and lovable rabbit deals with three bullying rodents.",
                category: "Animation"
            },
            {
                title: "Elephant Dream",
                thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Elephants_Dream_s5_both.jpg",
                videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                description: "The first computer-generated short film.",
                category: "Animation"
            },
            {
                title: "Sintel",
                thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/Sintel_poster.jpg",
                videoUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                description: "A lonely young woman searches for a dragon she once cared for.",
                category: "Fantasy"
            }
        ];

        await Video.insertMany(dummyVideos);
        res.json({ message: "Dummy videos successfully added to MongoDB!" });
    } catch (error) {
        res.status(500).json({ error: 'Failed to seed videos' });
    }
});
// Serve the frontend static files (HTML, CSS, JS) from the current directory
app.use(express.static(__dirname, { maxAge: '1d' }));

// Ensure videos and uploads are served directly
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// --------------------------------------------------------------------------
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide all fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Basic password check for the clone course context
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info minus the password
        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// --------------------------------------------------------------------------
// ADMIN VIDEO UPLOAD ROUTE
// --------------------------------------------------------------------------
app.post('/api/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    try {
        const { title, description, category } = req.body;

        // Grab the file paths from Multer
        const videoFile = req.files['video'] ? req.files['video'][0] : null;
        const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

        if (!title || !description || !category || !videoFile || !thumbnailFile) {
            return res.status(400).json({ error: 'Please provide all details and files.' });
        }

        // Construct the URLs our web browser will use to look for the files
        const videoUrl = '/videos/' + videoFile.filename;
        const thumbnailUrl = '/uploads/' + thumbnailFile.filename;

        // Save directly into the MongoDB Database
        const newVideo = new Video({
            title: title,
            description: description,
            category: category,
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl
        });

        await newVideo.save();

        console.log('🎉 New Video Added:', title);
        res.status(201).json({ message: 'Upload successful!', video: newVideo });

    } catch (error) {
        console.error('Upload Error Details:', error);
        res.status(500).json({ error: 'Server crashed while handling upload.' });
    }
});



// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on your network!`);
    console.log(`- Local:   http://localhost:${PORT}`);

    // Attempt to grab the local IP address for easy copy-pasting
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIp = 'your-computer-ip';
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
    }
    console.log(`- Network: http://${localIp}:${PORT}`);
});
