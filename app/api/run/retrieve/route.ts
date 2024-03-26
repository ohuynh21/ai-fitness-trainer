import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request){

    const {threadId, runId} = await req.json()

    if (!threadId || !runId) {
        return NextResponse.json({error: 'thread id and run required', success: false}, {status: 404})
    }

    const openai = new OpenAI()
    try {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId)

        return NextResponse.json({run, success: true}, {status: 201})
        
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error, success: false}, {status: 500})
    }

    
}