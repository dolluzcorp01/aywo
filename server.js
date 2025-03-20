const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

// ✅ Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true  // ✅ Allows frontend to send cookies
}));
app.use(express.json());
app.use(cookieParser()); // ✅ Allows reading HTTP-only cookies

// ✅ Import Routes Correctly
const loginRoutes = require('./src/backend_routes/Login_server');
const headerRoutes = require('./src/backend_routes/Header_server');
const formBuilderRoutes = require("./src/backend_routes/Form_builder_server");
const publishedFormRoutes = require("./src/backend_routes/PublishedForm_server"); // ✅ FIXED
const responsesRoutes = require("./src/backend_routes/Responses_server");

// ✅ Use Routes
app.use('/api/login', loginRoutes.router);
app.use('/api/header', loginRoutes.verifyJWT, headerRoutes);  // ✅ Protect `/header` with JWT auth
app.use("/api/form_builder", formBuilderRoutes);
app.use("/api/published_form", publishedFormRoutes); // ✅ FIXED ROUTE
app.use("/api/responses", responsesRoutes);

console.log('✅ Routes have been set up');

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
