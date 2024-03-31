import { prismadb } from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const user = await currentUser()
    if (!user) return NextResponse.json({message: 'unauthorized'}, {status: 401})

    const {id, sendNotifications, challengeId, sendChallenges} = await request.json()

    // adding !sendchallenges seems to break things
    if (!id || sendNotifications == undefined || !challengeId){
        return NextResponse.json({message: 'missing required fields'}, {status: 400})
    }

    try {
        const updatedChallengePreferences = await prismadb.challengePreferences.update({
            where: {id: id, userId: user.id},
            data: {
                challengeId,
                sendNotifications,
                sendChallenges
            }
        })

        return NextResponse.json({success: true, data: updatedChallengePreferences})
    } catch (error) {
        console.error(error)
        return NextResponse.json({success: false, message: 'something went wrong'}, {status: 500})
        
    }
}