import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1588967",
    key: "b4e34059d460669d7fcb",
    secret: "8dd4ed245c2c6d09618e",
    cluster: "ap2",
    useTLS: true
  });

app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers","*");
//     next();
// })

const connection_url = 'mongodb+srv://admin:VPAYz6ikIq1bk9jE@cluster0.jq9sbgl.mongodb.net/whatsappdb?retryWrites=true&w=majority';
// password = VPAYz6ikIq1bk9jE

mongoose.connect(connection_url, {
    // useCreateIndex: true,
    // useNewUrlParser: true,
    // useUnifiedTopology: true
});

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A change occured", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                receiver: messageDetails.receiver,
            })
        } else {
            console.log("Error triggering Pusher")
        }
    })
    });
  

app.get('/',(req,res) => res.status(200).send('Hello World'));

app.get("/messages/sync", (req, res) => {
    // const dbMessage = req.body;

    Messages.find()
  .then((data) => {
    res.status(200).send(data); //200 represents OK
    // console.log('Document created successfully:', result);
  })
  .catch((err) => {
    res.status(500).send(err);
    // console.error('Error creating document:', err);
  });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage)
  .then((data) => {
    res.status(201).send(data);
    // console.log('Document created successfully:', result);
  })
  .catch((err) => {
    res.status(500).send(err);
    // console.error('Error creating document:', err);
  });
});


app.listen(port, () => console.log(`Listening on localhost:${port}`));
