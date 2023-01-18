import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import { v4 as uuidv4 } from 'uuid';
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db();
    console.log("MongoDB Connected!");
} catch (error) {
    console.log(error.message);
}

//Cadastro
app.post('/users', async (req, res) => {
    const { name, email, password } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })

    if (schema.validate({ name, email, password }).error) {
        return res.status(422).send("Preencha os campos corretamente!");
    }

    try {
        const userExist = await db.collection("users").findOne({ email });
        if (userExist) return res.status(409).send("Email já cadastrado");
        await db.collection("users").insertOne({
            name, email, password
        });
        res.sendStatus(201);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Login
app.post('/logged', async (req, res) => {
    const { email, password } = req.body;
    
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })

    if (schema.validate({ email, password }).error) {
        return res.status(422).send("Preencha os campos corretamente!");
    }

    const token = uuidv4();

    try {
        const userExist = await db.collection("users").findOne({ email });
        if (!userExist) {
            return res.status(404).send('Email não cadastrado');
        } else {
            if (userExist.password !== password){
                return res.status(401).send('Senha incorreta');
            }
        }

        await db.collection("logged").insertOne({
            email, password, token
        });
        const name = userExist.name;
        
        res.status(201).send({name, email, password, token});
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Home
app.get('/account', async (req, res) => {
    const { token } = req.headers;


});

const PORT = 5000;

app.listen(PORT, () => console.log(`Servidor rodou na porta: ${PORT}`));