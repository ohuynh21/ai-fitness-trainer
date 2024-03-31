import { prismadb } from "@/lib/prismadb";
import { UserMeta, User } from "@prisma/client";
import axios from "axios";
import { NextResponse } from "next/server";
import OpenAI from "openai";

interface UserThreadMap {
  [userId: string]: User;
}

interface UserMetaMap {
  [userId: string]: UserMeta;
}

export async function POST(request: Request) {
  // Validation
  const body = await request.json();

  const { challengeId, secret } = body;

  if (!challengeId || !secret) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      {
        status: 400,
      }
    );
  }

  if (secret !== process.env.APP_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      {
        status: 401,
      }
    );
  }

  // Define work out message prompt
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
        Generate a quick on the spot exercise regiment. Make it a concise, bullet-pointed, no-equipment-needed workout plan. The time of day provided should be taken into account. This output should strictly contain two parts: first, an alert in all caps saying "INCOMING WORKOUT CHALLENGE". The second part should be a workout list: exercises that can be done anywhere, designed to be completed within 10 minutes. The output must only include these two components, nothing else.
        
        Here's an example output that you should follow:
        
        INCOMING WORKOUT CHALLENGE:
        
        You have 10 minutes to complete the following workout. Make every second count!
        
        - 30 Burpees
        - 40 Jumping Jacks
        - 50 Mountain Climbers
        - 60 High Knees
        - 2 Minute Plank
        `,
    },
    {
      role: "user",
      content: `Generate a new workout. Remember, only respond in the format specified earlier. Nothing else`,
    },
  ];

  //  Use OpenAI to generate work out
  const {
    data: { message, success },
  } = await axios.post<{ message?: string; success: boolean }>(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/openai`,
    {
      messages,
      secret: process.env.APP_SECRET_KEY,
    }
  );

  if (!message || !success) {
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong with generate openai response",
      },
      {
        status: 500,
      }
    );
  }

  console.log(message);

  // Grab all challenge preferences
  const challengePreferences = await prismadb.challengePreferences.findMany({
    where: {
      challengeId,
      sendChallenges: true,
    },
  });

  console.log("challengePreferences", challengePreferences);

  const userIds = challengePreferences.map((cp) => cp.userId);

  console.log("userIds", userIds);

  //  Grab all user threads
  const userThreads = await prismadb.user.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  console.log("userThreads", userThreads);

  // Grab all user metadata
  const userMetas = await prismadb.userMeta.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  console.log("userMetas", userMetas);

  const userThreadMap: UserThreadMap = userThreads.reduce((map, thread) => {
    map[thread.userId] = thread;
    return map;
  }, {} as UserThreadMap);

  const userMetaMap = userMetas.reduce((map, meta) => {
    map[meta.userId] = meta;
    return map;
  }, {} as UserMetaMap);

  // Add messages to threads
  const threadAndNotificationsPromises: Promise<any>[] = [];

  try {
    challengePreferences.forEach((cp) => {
      //  FIND THE RESPECTIVE USER
      const userThread = userThreadMap[cp.userId];

      //  ADD MESSAGE TO THREAD
      if (userThread) {
        // Send Message
        threadAndNotificationsPromises.push(
          axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/message/create`, {
            message,
            threadId: userThread.threadId,
            fromUser: "false",
          })
        );

        // Send Notification
        if (cp.sendNotifications) {
          const correspondingUserMeta = userMetaMap[cp.userId];
          threadAndNotificationsPromises.push(
            axios.post(
              `${process.env.NEXT_PUBLIC_BASE_URL}/api/send-notifications`,
              {
                subscription: {
                  endpoint: correspondingUserMeta.endpoint,
                  keys: {
                    auth: correspondingUserMeta.auth,
                    p256dh: correspondingUserMeta.p256dh,
                  },
                },
                message,
              }
            )
          );
        }
      }
    });

    await Promise.all(threadAndNotificationsPromises);

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      {
        status: 500,
      }
    );
  }
}