const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log("New visitor IP:", ip);

    // Log IP to file
    fs.appendFile("ips.txt", `${ip} - ${new Date().toLocaleString()}\n`, (err) => {
        if (err) console.log(err);
    });

    // Send dummy HTML page
    res.send(`
        <html>
            <head>
                <title>Hi!</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
                <h2>Hi! Please enter your Discord username!</h2>
                <form method="POST" action="/submit">
                    <input type="text" name="discord" placeholder="Discord username" style="padding: 8px; width: 250px;" />
                    <button type="submit" style="padding: 8px 16px;">Submit</button>
                </form>
            </body>
        </html>
    `);
});

// Dummy POST endpoint (does nothing with the input)
app.post("/submit", (req, res) => {
    res.send(`
        <html>
            <head><title>Thanks!</title></head>
            <body style="text-align: center; margin-top: 100px; font-family: Arial, sans-serif;">
                <h2>Thanks! Your username has been received.</h2>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});
