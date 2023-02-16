import db from "../config/database.js";
import dayjs from "dayjs";
import { ObjectId } from "mongodb";

export async function listTransactions (req, res) {
    const { userLogged } = res.locals;
    try {    
    const transactions = await db.collection("transactions").find({userId: userLogged.userId}).toArray();

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
}

export async function inputTransaction (req, res) {
    const { amount, description, type } = req.body;
    const { userLogged } = res.locals;

    try {
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
}

export async function deleteTransaction (req, res) {
    const { id } = req.params;
    const { userLogged } = res.locals;

    try {
        const entry = await db.collection("transactions").findOne({ _id: ObjectId(id), userId: userLogged.userId });
        if (!entry) return res.status(404).send("Mensagem não encontrada");

        await db.collection("transactions").deleteOne( {_id: ObjectId(id)});
        res.sendStatus(202);
    } catch (error) {
        res.status(500).send(error.message);
    }
}