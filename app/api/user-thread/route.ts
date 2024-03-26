import { prismadb } from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function GET() {
    const user = await currentUser();
    if (!user){
        return NextResponse.json(
            {success: false, message: 'unauthorized'},
            {status: 401}
        )
    }
    // check user db to see if user is there
    const cur = await prismadb.user.findUnique({
        where: {userId: user.id}
    })

    // if it is, return the user entry
    if (cur){
        return NextResponse.json({user: cur, success: true}, {status: 200})
    }

    // else get a new thread from openai and create new entry in user db
    try { 
        const openai = new OpenAI()
        const thread = await openai.beta.threads.create();

        // associate the thread with this user
        const newUser = await prismadb.user.create({
            data: {
                userId: user.id,
                threadId: thread.id
            }
        })

        return NextResponse.json({user: newUser, success: true}, {status: 200})
        
    } catch (error) {
        return NextResponse.json(
            {success: false, message: 'error creating new user'},
            {status: 500}
        )
    }
    
}