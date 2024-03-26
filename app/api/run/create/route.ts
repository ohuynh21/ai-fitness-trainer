import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request){

    const {threadId, assistantId} = await req.json()

    if (!threadId || !assistantId) {
        return NextResponse.json({error: 'thread id and assistant required', success: false}, {status: 404})
    }

    const openai = new OpenAI()
    try {
        const run = await openai.beta.threads.runs.create(threadId, 
            {assistant_id: assistantId})

        return NextResponse.json({run}, {status: 201})
        
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error, success: false}, {status: 500})
    }

    
}