import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import db from "../config/database.js";
import { ObjectId } from "mongodb";

export async function signUp (req, res) {
    const { name, email, password } = req.body;

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
}

export async function signIn (req, res) {
    const { email, password } = req.body;
    
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
}
