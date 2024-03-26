'use client'
import Navbar from "@/components/Navbar";
import axios from "axios";
import { useEffect, useState } from "react";
import { Assistant, User } from "@prisma/client";


export default function AppLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [user, setUser] = useState<User | null>(null)
    // use useEffect to prevent calling api on every re-render
    useEffect(() => {
      async function getUser() {
        try {
          const response = await axios.get<{
            success: boolean, 
            message ?: string, 
            user: User}>('api/user-thread')
        
          if (!response.data.success || !response.data.user){
            console.error(response.data.message ?? 'Unknown error')
            setUser(null)
            return
          }

          setUser(response.data.user)

        } catch (error) {
          console.error(error)
          setUser(null)
        }

      }
      getUser()
    }, [])

    console.log('User: ', user)
    
    return (
      <div className = 'flex flex-col w-full h-full'>
        <Navbar />
        {children}
      </div>
    );
  }
  