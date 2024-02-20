// const express = require("express");
// const app = express();
// const port = 5001;
// const { createTransport } = require("nodemailer");

// const transporter = createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587,
//   auth: {
//     user: "gabrieleduera@gmail.com",
//     pass: "g71FMp6aJymt24LB",
//   },
// });

// const mailOptions = {
//   from: "gabrieleduera@gmail.com",
//   to: "youssefkhiraoui15@gmail.com",
//   subject: `Your subject`,
//   text: `Your text content`,
// };

// app.get("/", (req, res) => {
//   const recipient = [
//     "belkhirayoussef770@gmail.com",
//     "youssefkhiraoui15@gmail.com",
//   ];
//   recipient.forEach((element, index) => {
//     const mailOptions = {
//       from: "gabrieleduera@gmail.com",
//       to: element,
//       subject: `Your subject`,
//       html: `<p>This is your HTML content for recipient ${
//         index + 1
//       }</p><p>More HTML content...</p>`,
//     };

//     for (let i = 0; i < 10; i++) {
//       transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//           console.log(error);
//         } else {
//           console.log("Email sent: " + info.response);
//         }
//       });
//     }

//     if (index === recipient.length - 1) {
//       res.send("Emails sent successfully");
//     }
//   });

//   // res.send("Hello World!");
// });

// app.listen(port, () => {
//   console.log(`Example app listening at http://localhost:${port}`);
// });

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const path = require("path");
const app = express();
const server = http.createServer(app);
const fs = require("fs");
const multer = require('multer');


require("dotenv").config({
  override: true,
  path: path.join(__dirname, ".env"),
});

const { Pool, Client } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

(async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT current_user");
    const currentUser = rows[0]["current_user"];
    console.log(currentUser);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    client.release();
  }
})();







const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

let activeClients = 0;

io.on("connection", socket => {
  console.log("A user connected");
  activeClients++;
  
  io.emit("activeClients", activeClients);

  socket.on("disconnect", () => {
    console.log("User disconnected");
    activeClients--;
    io.emit("activeClients", activeClients);
  });

  socket.on("stream", data => {
    io.emit("stream", data);
  });

  socket.on("capturedImage", data => {
    console.log("Received capturedImage event:", data);
    io.emit("capturedImage", data);
  });

  
  
  socket.on("randomValue", randomValue => {
    io.emit("randomValue", randomValue);
    console.log("Random Value:", randomValue);
  });

  
  
  socket.on("history", History => {
    io.emit("history", History);
    console.log("History Value:", History);
  });

  
  socket.on("GetVideo", GetVideo => {
    io.emit("GetVideo", GetVideo);
    console.log("GetVideo Value:", GetVideo);
  });


  socket.on("toggleStream" , isStream  =>{
    io.emit("toggleStream" , isStream);

    _toggleValueStream(isStream.isStream , isStream.device)
    console.log('toggleStream' , isStream)
  })

});




app.post("/api/status", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "'name' property is missing in the request body" });
    }

    const insertQuery = ` SELECT stream FROM public."NFC" where  nom = $1`;
    const value = [name];

    const result = await pool.query(insertQuery, value);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});




const _toggleValueStream = async (value , device) => {
  const selectQuery = 'update public."NFC"  set stream  = $1  where  nom = $2';
  const values = [value ,device];
  const result = await pool.query(selectQuery, values);
  return result;
};





const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
  fileSize: 10000000 // 10000000 Bytes = 10 MB
  }
})

app.post('/upload', videoUpload.single('video'), (req, res) => {
  res.send(req.file)

}, (error, req, res, next) => {
   res.status(400).send({ error: error.message })
})





app.use('/videos', express.static(path.join(__dirname, 'uploads')));



const PORT = 5002;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
