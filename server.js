const express = require("express");

const app = express();

app.use(express.text({ limit: "100kb" }));
app.use(express.static("public"));

const PHONE_TOKEN = process.env.PHONE_TOKEN;
const ROBLOX_TOKEN = process.env.ROBLOX_TOKEN;

let phoneConnected = false;
let captureRequested = false;
let waitingForFrame = null;
let currentFrame = "";

app.get("/camera/:token", (req, res) => {
    if (req.params.token !== PHONE_TOKEN) {
        return res.status(401).send("Unauthorized");
    }

    phoneConnected = true;
    

    res.sendFile(__dirname + "/index.html");
});

app.get("/camera-command", (req, res) => {
    if (!phoneConnected) {
        return res.status(503).send("Phone not connected");
    }

    if (captureRequested) {
        return res.send("CAPTURE");
    }

    res.send("WAIT");
});

app.post("/camera-frame", (req, res) => {
    console.log("Received frame length:", req.body.length);
    console.log("Is empty:", req.body.trim() === "");

    if (!req.body || req.body.trim() === "") {
        console.log("REJECTED EMPTY FRAME");
        return res.status(400).send("Empty frame");
    }

    currentFrame = req.body;
    captureRequested = false;

    console.log("Stored frame length:", currentFrame.length);

    if (waitingForFrame) {
        waitingForFrame.send(currentFrame);
        waitingForFrame = null;
    }

    res.send("OK");
});

app.get("/frame/:token", (req, res) => {
    if (req.params.token !== ROBLOX_TOKEN) {
        return res.status(401).send("Unauthorized");
    }

    if (!phoneConnected) {
        return res.status(503).send("Phone not connected");
    }

    if (!currentFrame) {
        return res.status(503).send("No frame available");
    }

    captureRequested = true;
    waitingForFrame = res;

    setTimeout(() => {
        if (waitingForFrame === res) {
            waitingForFrame = null;

            if (currentFrame) {
                res.send(currentFrame);
            } else {
                res.status(503).send("No frame available");
            }
        }
    }, 5000);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
