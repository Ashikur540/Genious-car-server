const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const app = express();




app.use(cors())
app.use(express.json())

// console.log(process.env.DB_USERNAME);




const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.6vknfdj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const DBConnect = async () => {
    try {
        if (client.connect()) {
            console.log("_________________________success_________________________");

        }
    } catch (error) {
        console.log(error.message);
    }
}

// create collections
const serviceCollection = client.db('geniousCar2').collection('services');
const ordersCollection = client.db("geniousCar2").collection("orders")

DBConnect();

// verify jwt : Use this where you want to protect through jwt token.Its a middlware
const verifyJWT = (req, res, next) => {

    const authHeader = (req.headers.authorization);
    if (!authHeader) {
        return res.status(401).send({
            success: false,
            message: 'unauthorized access'
        })
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                success: false,
                message: 'unauthorized access'
            })
        }
        req.decoded = decoded;
        next();
    })

}



// load data .. in client side----
app.get("/services", async (req, res) => {
    try {
        const query = {}
        const cursor = serviceCollection.find(query);
        const servicesData = await cursor.toArray();
        res.send({
            success: true,
            message: `Successfully loaded the data`,
            data: servicesData

        })
        // console.log(servicesData);


    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// get id sepcific route
// query holo jar sathe match korbo sei filed ta r moddhe ami jai id pasi seita
// aita abar client side e load korbo loader od use effect dia 

app.get("/services/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const query = { _id: ObjectId(id) };
        const serviceData = await serviceCollection.findOne(query);
        res.send({
            success: true,
            message: `Successfully got the ${serviceData.title}`,
            data: serviceData

        })
        // console.log(serviceData);
    } catch (error) {
        res.send({
            success: false,
            message: error.message,
        })
    }
})
// get the specific email {order }data through query parameter 
app.get("/orders", verifyJWT, async (req, res) => {
    try {
        // this is a token to protect this specific url so we send the stored token from client to verify
        // const { authorization } = req.headers;
        const { email } = req.query;

        // console.log("from client",authorization);
        // from  verify function
        console.log("inside orders ApI from verifier:", req.decoded);
        // check email missmatch decoed email er sathe jai email dia client req korse ei 2 ta
        if (req.decoded.email !== email) {
            return res.status(403).send({
                success: false,
                message: 'unauthorized access'
            })
        }




        // console.log(email);
        // it must be let always.. not const
        let query = {}
        if (email) {
            // filter through email field and value is email from query
            query = { email: email }
        }

        const cursor = ordersCollection.find(query);
        const ordersData = await cursor.toArray();
        res.send({
            success: true,
            message: `Successfully loaded the data`,
            data: ordersData
        })
        // console.log(servicesData);


    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})


// store orders info into data base in post method

app.post("/orders", async (req, res) => {

    try {
        const { customer_fullName, email, message, phone, price, serviceName, service_id } = req.body;
        const order = { customer_fullName, email, message, phone, price, serviceName, service_id };
        // console.log("order:", order);
        const result = await ordersCollection.insertOne(order);
        if (result.insertedId) {
            res.send({
                success: true,
                successMsg: `Successfully placed order of ${serviceName} on account of ${customer_fullName}`,
                data: result

            })
        }
        else {
            res.send({
                success: false,
                errorMsg: `interrupt insert operation ! something wrong!!!!`
            })
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


// for JWT TOKEN We eil send some data drom the client side .and client johokn successfully log in korte and then kothao jabe sekhane jawar agei tar theke token ta nia nebo.
app.post("/jwt", async (req, res) => {
    try {
        const currentUser = req.body;
        console.log(currentUser);
        // payload,secret,expiray(optional: 60,"10h", "2d")
        const token = jwt.sign(currentUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '4h' });
        // send as json formate {}
        // res.send({ token }) OR 
        // res.json({ token })
        res.send({
            success: true,
            data: { token }
        })

    } catch (error) {
        res.send({
            succes: false,
            message: `Something wrong occured Invalid credential`

        })
    }

})


// UPDATE OPERATION  WITH PATCH MATHOD (PUT=REPLACE OR CREATE , PATCH= PARTIAL CHANGE )

app.patch("/orders/:id", async (req, res) => {
    try {
        const { id, status } = req.params;
        const query = { _id: ObjectId(id) }
        const updatedInfo = {
            $set: {
                status: status
            }
        }

        // Upsert option means that if you want top replace the new one with the old or not?\
        // when to use modified count and matched count ?
        const result = await ordersCollection.updateOne(query, updatedInfo);
        if (result.modifiedCount) {
            res.send({
                success: true,
                message: `Successfully updated`,
                data: result
            })
        }
        else {
            res.send({
                success: false,
                error: ` couldnot update !Operation failed  `
            })
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})



app.delete("/orders/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);
        const query = { _id: ObjectId(id) }
        const result = await ordersCollection.deleteOne(query);
        console.log(result);
        if (result.deletedCount) {
            res.send({
                success: true,
                message: `successfully deleted ${id}`,
                data: result
            })
        }
        else {
            res.send({
                success: false,
                message: `operation interrupts!`,

            })
        }


    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})





app.get("/", (req, res) => {
    res.json({
        message: "server is running"
    })
})


app.listen(process.env.PORT || 5000, () => {
    console.log('server running in  ', process.env.PORT);
})