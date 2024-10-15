const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let room = {
  occupants: 0,
  person1: null,
  person2: null,
};

app.post("/join", (req, res) => {
  const { name } = req.body;
  if (room.occupants === 0) {
    room.person1 = { name, messages: [] };
    room.occupants++;
    res.json({ status: "joined", as: "person1", otherPerson: null });
  } else if (room.occupants === 1) {
    room.person2 = { name, messages: [] };
    room.occupants++;
    res.json({
      status: "joined",
      as: "person2",
      otherPerson: room.person1.name,
    });
  } else {
    res.status(400).json({ error: "Room is full" });
  }
});

app.get("/checkOtherPerson/:person", (req, res) => {
  const { person } = req.params;
  if (person === "person1" && room.person2) {
    res.json({ otherPerson: room.person2.name });
  } else if (person === "person2" && room.person1) {
    res.json({ otherPerson: room.person1.name });
  } else {
    res.json({ otherPerson: null });
  }
});

app.get("/roomStatus", (req, res) => {
  res.json({
    occupants: room.occupants,
    person1: room.person1 ? room.person1.name : null,
    person2: room.person2 ? room.person2.name : null,
  });
});

app.post("/sendMessage", (req, res) => {
  const { from, message } = req.body;
  if (room.occupants !== 2) {
    return res.status(400).json({
      error: "Both participants must be in the room to send messages",
    });
  }

  const sender = from === "person1" ? room.person1 : room.person2;
  const recipient = from === "person1" ? room.person2 : room.person1;

  if (!sender || !recipient) {
    return res.status(400).json({ error: "Invalid sender or recipient" });
  }

  const newMessage = { from: sender.name, message };
  sender.messages.push(newMessage);
  recipient.messages.push(newMessage);
  res.json({ msg: "Message sent successfully" });
});

app.get("/getMessages/:person", (req, res) => {
  const { person } = req.params;
  if (person === "person1" && room.person1) {
    res.json(room.person1.messages);
  } else if (person === "person2" && room.person2) {
    res.json(room.person2.messages);
  } else {
    res
      .status(400)
      .json({ error: "Invalid person identifier or person not in room" });
  }
});

app.post("/leave", (req, res) => {
  const { person } = req.body;
  if (person === "person1") {
    room.person1 = null;
  } else if (person === "person2") {
    room.person2 = null;
  } else {
    return res.status(400).json({ error: "Invalid person identifier" });
  }
  room.occupants--;
  res.json({ msg: "Left the room successfully" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
