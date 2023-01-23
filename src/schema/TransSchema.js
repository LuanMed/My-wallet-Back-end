import Joi from "joi";

export const transSchema = Joi.object({
    amount: Joi.number().required(),
    description: Joi.string().required(),
    type: Joi.string().valid('income', 'expense').required()
});