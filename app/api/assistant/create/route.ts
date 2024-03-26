import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(){
    const openai = new OpenAI()
    try {
        const assistant = await openai.beta.assistants.create({
            model: 'gpt-3.5-turbo',
            name: 'AI Personal Trainer',
            instructions: 'You are a professional personal trainer'
        })
        console.log(assistant)
        return NextResponse.json({assistant}, {status: 201})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error}, {status: 500})
    }
}