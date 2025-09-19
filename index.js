const express = require("express");
const fs = require("fs");
const path = require("path");
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

    // Append to file
    const logEntry = `${ip} | ${userAgent} | ${new Date().toLocaleString()}\n`;
    fs.appendFile("ips.txt", logEntry, (err) => {
        if (err) console.log("Error writing to file:", err);
    });

    // Send HTML page
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
                </fo
