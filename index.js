const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// --- UTILS ---
// Browser detection
const looksLikeBrowser = (ua) => {
    if (!ua) return false;
    ua = ua.toLowerCase();
    return ua.includes("chrome") || ua.includes("firefox") || ua.includes("safari") ||
           ua.includes("edg") || ua.includes("opera");
};

// Bot detection
const isBot = (ua) => {
    if (!ua) return false;
    const botKeywords = [
        "bot", "crawl", "spider", "slurp", "fetch", "python-requests",
        "axios", "headless", "wget", "curl", "scrapy"
    ];
    return botKeywords.some(keyword => ua.toLowerCase().includes(keyword));
};

// Check for public IP
const isPublicIP = (ip) => {
    if (!ip) return false;
    ip = ip.replace(/^::ffff:/, "");

    if (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        (ip.startsWith("172.") && (() => {
            const second = parseInt(ip.split(".")[1], 10);
            return second >= 16 && second <= 31;
        })())
    ) return false;

    return true;
};

// Parse user-agent for clean output
const formatUA = (ua) => {
    if (!ua) return "Unknown UA";

    const osMatch = ua.match(/\((.*?)\)/); // text inside parentheses
    const os = osMatch ? osMatch[1].split(";")[0] : "Unknown OS";

    let browser = "Unknown Browser";
    if (ua.includes("Chrome/")) browser = "Chrome " + ua.split("Chrome/")[1].split(" ")[0];
    else if (ua.includes("Firefox/")) browser = "Firefox " + ua.split("Firefox/")[1];
    else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg/")) browser = "Edge " + ua.split("Edg/")[1];

    return `OS: ${os} | Browser: ${browser}`;
};

// --- ROUTES ---
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress;
    ip = ip.replace(/^::ffff:/, "");

    const userAgent = req.headers["user-agent"] || "";

    if (looksLikeBrowser(userAgent) && !isBot(userAgent) && isPublicIP(ip)) {
        const formattedUA = formatUA(userAgent);
        const logEntry = `${ip} | ${formattedUA} | ${new Date().toLocaleString()}\n`;

        fs.appendFile("ips.txt", logEntry, (err) => {
            if (err) console.log("Error writing to file:", err);
        });

        // ✅ Console now shows IP + user info
        console.log(`✅ Logged Visitor: ${ip} | ${formattedUA}`);
    } else {
        console.log(`⏭️ Skipped Visitor: ${ip || "Unknown"} (${isBot(userAgent) ? "Bot" : "Not a browser / Private IP"})`);
    }

    res.send(`
        <html>
            <head>
                <title>Hi!</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
                <h2>Hi! Please enter your Discord username!</h2>
                <form method="POST" action="/submit">
                    <input type="text" name="discord" placeholder="Discord username" style="padding: 8px; width: 250px;" required />
                    <button type="submit" style="padding: 8px 16px;">Submit</button>
                </form>
            </body>
        </html>
    `);
});

app.post("/submit", (req, res) => {
    const discordUsername = req.body.discord;
    const forwardedFor = req.headers["x-forwarded-for"];
    let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress;
    ip = ip.replace(/^::ffff:/, "");
    const userAgent = req.headers["user-agent"] || "";

    if (looksLikeBrowser(userAgent) && !isBot(userAgent) && isPublicIP(ip)) {
        const formattedUA = formatUA(userAgent);
        const logEntry = `Discord: ${discordUsername} | IP: ${ip} | ${formattedUA} | ${new Date().toLocaleString()}\n`;
        fs.appendFile("submissions.txt", logEntry, (err) => {
            if (err) console.log("Error writing to file:", err);
        });

        console.log(`✅ Logged Submission: ${discordUsername} | ${ip} | ${formattedUA}`);
    }

    res.send(`
        <html>
            <head>
                <title>Thank you!</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 100px;">
                <h2>Thanks for submitting your Discord username!</h2>
            </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
