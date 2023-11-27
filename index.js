const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config()


const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.50cvwuz.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const usersCollection = client.db('diagnostic-center').collection('users')
        /* User Related API */
        app.post("/users", async (req, res) => {
            const user = req.body;
            //   console.log(user);
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.send(result);
        });
        app.get("/users", async (req, res) => {
            // const email = req.query.email;
            const user = await usersCollection.find().toArray()
            res.send(user)
        })
        app.get("/user", async (req, res) => {
            const email = req.query.email;
            const user = await usersCollection.findOne({ email })
            res.send(user)
        })
        app.put("/users/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            console.log("id", id, data);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedUSer = {
                $set: {
                    name: data.name,
                    bloodGroup: data.bloodGroup,
                    district: data.district,
                    upazila: data.upazila

                },
            };
            const result = await usersCollection.updateOne(
                filter,
                updatedUSer,
                options
            );
            res.send(result);
        });
        app.patch("/user/:id", async (req, res) => {
            const userId = req.params.id;
            const { selectedStatus, selectedUserType } = req.body;
            console.log(selectedUserType);
            const filter = { _id: new ObjectId(userId) };
            try {

                const update = { $set: { status: selectedStatus, userType: selectedUserType } };

                const result = await usersCollection.updateOne(filter, update);

                res.send(result)
            } catch (error) {
                console.error(error);
            }
        });
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})
