const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

// ✅ Middleware for CORS - Allow specific origins
const allowedOrigins = [
    'http://localhost:3000',   // Allow React frontend
    'https://app.dforms.in',   // Production URL
    'http://127.0.0.1:3000',   // Allow localhost if accessing via 127.0.0.1
    'http://localhost:5000'     // Allow backend server origin (no trailing slash)
];

// Enable CORS with the allowed origins and credentials
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            callback(null, origin); // <-- ✅ return origin instead of true
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// ✅ Middleware for parsing JSON and reading HTTP-only cookies
app.use(express.json());
app.use(cookieParser());

// ✅ Import Routes Correctly
const loginRoutes = require('./src/backend_routes/Login_server');
const leftnavbarRoutes = require('./src/backend_routes/LeftNavBar_server');
const formBuilderRoutes = require('./src/backend_routes/Form_builder_server');
const publishedFormRoutes = require('./src/backend_routes/PublishedForm_server');
const responsesRoutes = require('./src/backend_routes/Responses_server');

// ✅ Use Routes
app.use('/api/login', loginRoutes.router);
app.use('/api/leftnavbar', loginRoutes.verifyJWT, leftnavbarRoutes); // Protect `/leftnavbar` with JWT auth
app.use('/api/form_builder', formBuilderRoutes);
app.use('/api/published_form', publishedFormRoutes);  // Route for Published Forms
app.use('/api/responses', responsesRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded files

const path = require('path');
app.use('/field_file_uploads', express.static(path.join(__dirname, 'field_file_uploads')));

console.log('✅ Routes have been set up');

// ✅ Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
