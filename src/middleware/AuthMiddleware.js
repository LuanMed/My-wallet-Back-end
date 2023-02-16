import db from "../config/database.js";

export async function authValidation (req, res, next) {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    
    if (!token) return res.status(422).send("Você não possui um token!");

    try {
        const userLogged = await db.collection("logged").findOne({ token });
        if (!userLogged) return res.status(401).send("Você não tem autorização");

        res.locals.userLogged = userLogged;

        next();

    } catch (error) {
        res.status(500).send(error);
    }
}