import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import Joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import dayjs from "dayjs";
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
    const { name, email, password, confirmPassword } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required()
    })

    if (schema.validate({ name, email, password, confirmPassword }).error) {
        return res.status(422).send("Preencha os campos corretamente!");
    }

    if (password !== confirmPassword) return res.status(400).send("Senhas estão diferentes");

    const encryptedPassword = bcrypt.hashSync(password, 10);

    try {
        const userExist = await db.collection("users").findOne({ email });
        if (userExist) return res.status(409).send("Email já cadastrado");
        
        await db.collection("users").insertOne({
            name, email, password: encryptedPassword
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

    try {
        const userExist = await db.collection("users").findOne({ email });
        if (!userExist || !bcrypt.compareSync(password, userExist.password)) {
            return res.status(404).send('Email ou senha incorretos');
        }

        const name = userExist.name;
        const token = uuidv4();
        
        const loggedAlready = await db.collection("logged").findOne({ userId: userExist._id });
        if (loggedAlready) {
            await db.collection("logged").updateOne({userId: userExist._id}, {$set: {token: token}});
            return res.status(200).send({name, token});
        }

        await db.collection("logged").insertOne({
            userId: ObjectId(userExist._id), token
        });
        
        res.status(201).send({name, token});
    } catch (error) {
        res.status(500).send(error.message);
    }
});

//Home
app.get('/transactions', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.status(401).send("Você não tem autorização");

    try {
    const userLogged = await db.collection("logged").findOne({ token });
    
    if (!userLogged) return res.status(401).send("Você não tem autorização");

    //const user = await db.collection("users").findOne({_id: userLogged.userId});
    
    const transactions = await db.collection("transactions").find({userId: userLogged.userId}).toArray();

    const values = await db.collection("transactions").find({userId: userLogged.userId});
    let finalBalance = 0;
    transactions.map(t => {
        if (t.type === "income") {
            const value = t.amount.replace(',','.')
            finalBalance += Number(value)
        } else {
            const value = t.amount.replace(',','.')
            finalBalance -= Number(value)
        }
    })

    res.send({ transactions, finalBalance: finalBalance.toFixed(2).replace('.', ',')});

    } catch (error) {
        res.status(500).send(error.message);
    } 
});

app.post('/transactions', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    const { amount, description, type } = req.body;

    const schema = Joi.object({
        amount: Joi.number().required(),
        description: Joi.string().required(),
        type: Joi.string().valid('income', 'expense').required()
    })

    if (schema.validate({ amount, description, type }).error) {
        return res.status(422).send(schema.validate({ amount, description }).error.message);
    }

    try {
        const userLogged = await db.collection("logged").findOne({ token });

        if (!userLogged) return res.status(401).send("Você não tem autorização");

        const { userId } = userLogged;

        await db.collection("transactions").insertOne({
            amount: Number(amount).toFixed(2).replace('.', ','),
            description,
            type,
            userId,
            date: dayjs().format('DD/MM')
        });
        res.sendStatus(201);
    } catch (error) {
        res.status(500).send(error.message);
    }

});

app.delete('/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    

    if (!token) return res.status(401).send("Você não tem autorização");

    try {
        const userLogged = await db.collection("logged").findOne({ token });
        if (!userLogged) return res.status(401).send("Você não tem autorização");

        const entry = await db.collection("transactions").findOne({ _id: ObjectId(id), userId: userLogged.userId });
        if (!entry) return res.status(404).send("Mensagem não encontrada");

        await db.collection("transactions").deleteOne( {_id: ObjectId(id)});
        res.sendStatus(202);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.get('/balance', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if (!token) return res.status(401).send("Você não tem autorização");

    try {
        const userLogged = await db.collection("logged").findOne({ token });
        
        if (!userLogged) return res.status(401).send("Você não tem autorização");
    
        //const user = await db.collection("users").findOne({_id: userLogged.userId});
        
        const transactions = await db.collection("transactions").find({userId: userLogged.userId}).toArray();
    
        res.send(transactions);
    
        } catch (error) {
            res.status(500).send(error.message);
        } 
})

const PORT = 5000;

app.listen(PORT, () => console.log(`Servidor rodou na porta: ${PORT}`));