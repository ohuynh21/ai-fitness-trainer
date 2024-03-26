import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request){

    const {message, threadId} = await req.json()
    if (!threadId || !message) {
        return NextResponse.json({error: 'thread id and message required', success: false}, {status: 404})
    }
    
    const openai = new OpenAI()
    
    try {
        const threadMessage = await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: message
        })
        console.log(threadMessage)
        return NextResponse.json({message: threadMessage}, {status: 201})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error, success: false}, {status: 500})
    }
}