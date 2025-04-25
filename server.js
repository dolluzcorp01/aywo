const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

// ✅ Middleware
const allowedOrigins = ['http://localhost:3000', 'https://app.dforms.in'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // ✅ Allows reading HTTP-only cookies

// ✅ Import Routes Correctly
const loginRoutes = require('./src/backend_routes/Login_server');
const leftnavbarRoutes = require('./src/backend_routes/LeftNavBar_server');
const formBuilderRoutes = require("./src/backend_routes/Form_builder_server");
const publishedFormRoutes = require("./src/backend_routes/PublishedForm_server"); // ✅ FIXED
const responsesRoutes = require("./src/backend_routes/Responses_server");

// ✅ Use Routes
app.use('/api/login', loginRoutes.router);
app.use('/api/leftnavbar', loginRoutes.verifyJWT, leftnavbarRoutes);  // ✅ Protect `/leftnavbar` with JWT auth
app.use("/api/form_builder", formBuilderRoutes);
app.use("/api/published_form", publishedFormRoutes); // ✅ FIXED ROUTE
app.use("/api/responses", responsesRoutes);
app.use("/uploads", express.static("uploads"));

console.log('✅ Routes have been set up');

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
