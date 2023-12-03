const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config()


const app = express()
app.use(cors({
    origin: ["https://alshifa-diagnostics-mi1357.netlify.app", "https://diagnostic-center-a87d3.firebaseapp.com", "http://localhost:5173"],
    credentials: true
}));

const port = process.env.PORT || 5000
const stripe = require("stripe")(process.env.STRIPE_SECRET);
app.use(express.json())

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
        // await client.connect();

        const usersCollection = client.db('diagnostic-center').collection('users')
        const testCollection = client.db('diagnostic-center').collection('tests')
        const bannerCollection = client.db('diagnostic-center').collection('banners')
        const reservationCollection = client.db('diagnostic-center').collection('reservations')
        const reccommendationsCollection = client.db('diagnostic-center').collection('reccommendations')

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

        /* Test Related API */
        app.post("/test", async (req, res) => {
            const test = req.body;


            const testData = {
                ...test,
                totalBooking: 0,
            };
            console.log(testData);
            const result = await testCollection.insertOne(testData);
            console.log(result);
            res.send(result);
        });

        app.get("/tests", async (req, res) => {
            // const email = req.query.email;
            const tests = await testCollection.find().toArray()
            res.send(tests)
        })
        app.get("/test/:id", async (req, res) => {
            // const email = req.query.email;
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const tests = await testCollection.findOne(query)
            res.send(tests)
        })
        app.put("/tests/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const data = req.body;
            const { availableSlots, testDate, testDescription, testImage, testName, _id, testFee } = data
            // console.log("id", id, data);
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedTest = {
                $set: {
                    availableSlots, testDate, testDescription, testImage, testName, testFee

                },
            };

            const result = await testCollection.updateOne(filter, updatedTest, options);
            res.send(result);
            console.log(result);
            // console.log(availableSlots);

        });
        app.delete("/test/:id", async (req, res) => {
            const id = req.params.id;
            console.log("delete", id);
            const query = {
                _id: new ObjectId(id),
            };
            const result = await testCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        });
        app.put("/confirm", async (req, res) => {
            const { testId } = req.body;

            try {
                // Assuming 'testId' is the MongoDB ObjectId of the test you want to update
                const filter = { _id: new ObjectId(testId) };

                // Decrement availableSlots by 1
                const update = { $inc: { availableSlots: -1, totalBooking: 1 } };
                const options = { upsert: true };

                const result = await testCollection.updateOne(filter, update, options);

                res.send(result)
            } catch (error) {
                console.error("Error updating available slots:", error);
                res.status(500).send({ success: false, message: "Internal server error." });
            }
        });


        /* Banner Related API */
        app.post("/banner", async (req, res) => {
            const banner = req.body;
            //   console.log(user);
            const result = await bannerCollection.insertOne(banner);
            console.log(result);
            res.send(result);
        });
        app.get("/banners", async (req, res) => {
            // const email = req.query.email;
            const banners = await bannerCollection.find().toArray()
            res.send(banners)
        })

        app.delete("/banner/:id", async (req, res) => {
            const id = req.params.id;
            console.log("delete", id);
            const query = {
                _id: new ObjectId(id),
            };
            const result = await bannerCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        });
        /* Update Activit Status of Banner */
        app.put("/banners/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            // console.log(id);


            const { isActive } = data;
            const filter = { _id: new ObjectId(id) };
            const updateData = {
                $set: {
                    isActive: true,
                },
            };

            const result = await bannerCollection.updateOne(filter, updateData);
            res.send(result)

        });
        /* reset all activit status */
        app.put("/banners", async (req, res) => {
            const resetResult = await bannerCollection.updateMany({}, { $set: { isActive: false } });
            res.send(resetResult)
        });
        /* Reservations API */
        app.post("/reservations", async (req, res) => {
            const reservation = req.body;
            //   console.log(user);
            const result = await reservationCollection.insertOne(reservation);
            console.log(result);
            res.send(result);
        });
        app.get("/reservations", async (req, res) => {
            // const email = req.query.email;
            const tests = await reservationCollection.find().toArray()
            res.send(tests)
        })
        app.patch("/reservation/:id", async (req, res) => {
            const userId = req.params.id;
            const { report, reportStatus } = req.body;
            // console.log(selectedUserType);
            const filter = { _id: new ObjectId(userId) };
            try {

                const update = { $set: { reportStatus: reportStatus, report: report } };

                const result = await reservationCollection.updateOne(filter, update);

                res.send(result)
            } catch (error) {
                console.error(error);
            }
        });
        app.delete("/reservation/:id", async (req, res) => {
            const id = req.params.id;
            console.log("delete", id);
            const query = {
                _id: new ObjectId(id),
            };
            const result = await reservationCollection.deleteOne(query);
            console.log(result);
            res.send(result);
        });

        app.get("/reccommendations", async (req, res) => {
            // const email = req.query.email;
            const tests = await reccommendationsCollection.find().toArray()
            res.send(tests)
        })



        /* Stripe Api */
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100)
            if (isNaN(amount)) {
                // Handle the case where price is NaN
                console.error('Invalid price value');
                // Add appropriate error response or fallback value
            } else {
                // Proceed with creating payment intent
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card']
                });
                res.send({
                    clientSecret: paymentIntent.client_secret
                });
            }




        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged MongoDB!");
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
