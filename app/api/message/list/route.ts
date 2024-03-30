import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request){

    
    const {threadId} = await req.json()

    if (!threadId) {
        return NextResponse.json({error: 'thread id required', success: false}, {status: 404})
    }

    const openai = new OpenAI()
    try {
        const response = await openai.beta.threads.messages.list(threadId)
        console.log('from openai messages', response)
        return NextResponse.json({messages: response.data, success: true}, {status: 200})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error: error, success: false}, {status: 500})
    }


}