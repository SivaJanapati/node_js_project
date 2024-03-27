
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Load Swagger documentation file
const swaggerDocument = YAML.load('./swagger.yaml');

// Endpoint to fetch data from public API with filtering options
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

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});