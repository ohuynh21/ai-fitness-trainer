'use client'
import Navbar from "@/components/Navbar";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Assistant, User } from "@prisma/client";
import { useAtom } from "jotai";
import { assistantAtom, userAtom } from "@/atoms";
import toast, { Toaster } from "react-hot-toast";
import useServiceWorker from "@/hooks/useServiceWorker";
import NotificationModal from "@/components/NotificationModel";


export default function AppLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
   
    const [user, setUser] = useAtom(userAtom)
    const [assistant, setAssistant] = useAtom(assistantAtom)
    // Hooks
    useServiceWorker();
    
    // use useEffect to prevent calling api on every re-render
    useEffect(() => {

      if(assistant) return

      async function getAssistant() {
        try {
          const response = await axios.get<{
            success: boolean, 
            message ?: string, 
            assistant: Assistant}>('api/assistant')
        
          if (!response.data.success || !response.data.assistant){
            console.error(response.data.message ?? 'Unknown error')
            setAssistant(null)
            return
          }

          setAssistant(response.data.assistant)

        } catch (error) {
          console.error(error)
          setAssistant(null)
        }

      }
      getAssistant()
    }, [setAssistant])
    

    
    
    
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

    // console.log('User: ', user)
    
    return (
      <div className = 'flex flex-col w-full h-full'>
        <Navbar />
        {children}
        <Toaster/>
      </div>
    );
  }
  