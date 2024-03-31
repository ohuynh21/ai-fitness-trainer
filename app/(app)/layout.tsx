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
    const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
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
      if ("Notification" in window) {
        setIsNotificationModalVisible(Notification.permission === "default");
        console.log("Notification permission:", Notification.permission);
      }
    }, []);
  
    const saveSubscription = useCallback(async () => {
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
  
      try {
        const response = await axios.post("/api/subscription", subscription);
  
        if (!response.data.success) {
          console.error(response.data.message ?? "Unknown error.");
          toast.error("Failed to save subscription.");
          return;
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to save subscription.");
      }
    }, []);
  
    useEffect(() => {
      if ("Notification" in window && "serviceWorker" in navigator) {
        if (Notification.permission === "granted") {
          saveSubscription();
        }
      }
    }, [saveSubscription]);
  
    const handleNotificationModalClose = (didConstent: boolean) => {
      setIsNotificationModalVisible(false);
  
      if (didConstent) {
        toast.success("You will now receive notifications.");
      }
    };
    
    
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
        {isNotificationModalVisible && (
        <NotificationModal onRequestClose = {handleNotificationModalClose} saveSubscription = {saveSubscription}/>)}
        <Toaster/>
      </div>
    );
  }
  