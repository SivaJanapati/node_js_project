const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const Web3 = require('web3');
const app = express();
const SECRET_KEY = 'secretkey'; // Change this to a more secure key in production

// Database setup
const db = new sqlite3.Database(':memory:'); // Using in-memory database for simplicity
db.serialize(() => {
    db.run('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT,email TEXT, password TEXT)');
});

// Middleware
app.use(bodyParser.json());

// Endpoint for user registration
app.post('/register', (req, res) => {
    const { username,email, password } = req.body;
    // Insert user into database (You should hash passwords before storing them)
    db.run(`INSERT INTO users (username,email, password) VALUES (?,?,?)`, [username,email, password], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Registration failed' });
        }
        res.status(201).json({ message: 'Registration successful' });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Check user credentials against the database
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jwt.sign({ username: row.username }, SECRET_KEY);
        res.json({ token });
    });
});

// Endpoint for protected route
app.get('/protected', verifyToken, (req, res) => {
    // If token is verified, respond with protected data
    res.json({ message: 'Protected data' });
});

// Function to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.username = decoded.username;
        next();
    });
}

app.get('/public-api', async (req, res) => {
    try {
        const { category, limit } = req.query;
        let apiUrl = 'https://api.publicapis.org/entries';

        // Add filtering options if provided
        if (category) {
            apiUrl += `?category=${category}`;
        }
        if (limit) {
            apiUrl += `&limit=${limit}`;
        }

        // Fetch data from the public API
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Initialize web3 with Infura provider and your API key
const web3 = new Web3('https://mainnet.infura.io/v3/ad05853b97fe4676b889d47618e06d92');

// Endpoint to retrieve Ethereum account balance
app.get('/ethbalance/:address', async (req, res) => {
    try {
        const balanceWei = await web3.eth.getBalance(req.params.address);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        res.send({ balance: balanceEth });
    } catch (error) {
        res.status(500).send('Error fetching balance');
    }
});

app.listen(3011);
