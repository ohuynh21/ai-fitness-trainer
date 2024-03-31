'use client'
import { assistantAtom, userAtom } from '@/atoms';
import axios from 'axios';
import { useAtom } from 'jotai';
import { Run, ThreadMessage } from 'openai/resources/beta/threads/index.mjs';
import toast from 'react-hot-toast'

import React, {useCallback, useEffect, useRef, useState} from 'react';

const POLLING_FREQUENCY_MS = 1000
function ChatPage () {
    const [fetching, setFetching] = useState(true)
    const [messages, setMessages] = useState<ThreadMessage[]>([])
    const [user] = useAtom(userAtom)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [assistant] = useAtom(assistantAtom)
    const [polling, setPolling] = useState(false)

    //console.log('input:', message)
    //console.log('user:', user)
    //console.log('messages', messages)

    const fetchMessage = useCallback(async () => {
      if (!user) return;
      
      setFetching(true);
      try {
        const response = await axios.post<{
          success: boolean, 
          error?: string,
          messages?: ThreadMessage[]}>('/api/message/list', {threadId: user.threadId})
        
          if (!response.data.success || !response.data.messages) {
            console.error(response.data.error ?? 'Could not fetch messages')
            return
          }
    
          let newMessages = response.data.messages;
          console.log('new_msgs: ', newMessages)
          
          newMessages.sort((a,b) => {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          }).filter((message) => 
            message.content[0].type === 'text' && 
            message.content[0].text.value.trim() !== '')
            
            setMessages(newMessages)
      } catch (error) {
        console.error(error)
        setFetching(false)
        // sometimes message.content will be unavailable, which causes an error to occur, triggering setMessages([]), this causes flickering to occur
        //setMessages([])
      } finally {
        setFetching(false)
      }
    }, [user])

    useEffect(() => {
      const interval = setInterval(fetchMessage, POLLING_FREQUENCY_MS)
      return () => clearInterval(interval)
    }, [fetchMessage])
    
    const sendMessage = async () => {
      if (!user || sending || !assistant) return

      setSending(true)
      try {
        const {data: {message: newMessages}} = await axios.post<{
          success: boolean
          message?: ThreadMessage
          error?: string}>('/api/message/create', {message, threadId: user.threadId, fromUser: 'true'
        })
  
        if (!newMessages) {
          console.error('No Message Returned')
          toast.error('Failed to send message. Please try again')
          return
        }
  
        setMessages((prev) => [...prev, newMessages])
        setMessage('')
        toast.success('Message Sent')
        
        const runId = await startRun(user.threadId, assistant.assistantId)
        
        pullRunStatus(user.threadId, runId)

      } catch (error) {
        console.error(error)
        toast.error('Failed to send message. Please try again')
      } finally {
        setSending(false)
      }
      
    }

    const startRun = async (threadId: string, assistantId: string): Promise<string> => {
      
      try {
        const {data: {success, run, error}} =  await axios.post<{success: boolean, error?: string, run: Run}>('/api/run/create', {
          threadId,
          assistantId
        })

        if (!success || !run) {
          console.error(error)
          toast.error('failed to start run!')
        }

        return run.id

      } catch (error) {
        console.error(error)
        toast.error('failed to start run')
        return '';
      }
    }

    const pullRunStatus = async (threadId: string, runId: string) => {
      setPolling(true)

      const intervalId = setInterval(async () => {
        try {
          const {data: {run, success, error}} = await axios.post<{success: boolean, error?: string, run: Run}>('/api/run/retrieve', 
          {threadId, runId})

          if (!success || !run){
            console.error(error)
            toast.error('Failed to get run status')
            return
          }

          if (run.status === 'completed'){
            clearInterval(intervalId)
            setPolling(false)
            fetchMessage()
          }
          else if (run.status === 'failed') {
            clearInterval(intervalId)
            setPolling(false)
            toast.error('Run failed')
            return
          }

        } catch (error) {
          clearInterval(intervalId)
          console.error(error)
          toast.error('Run failed')
        }

      }, POLLING_FREQUENCY_MS)

      return () => clearInterval(intervalId)
    }

    // every time sending changes state, auto-scroll to the bottom of the div
    useEffect(() => {
      const div = document.querySelector('.flex-grow.overflow-y-scroll.p-8.space-y-2');
      if (div) {
        div.scrollTop = div.scrollHeight - div.clientHeight
        console.log('here')
      }
      
    }, [messages.length, polling]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const div = document.querySelector('.flex-grow.overflow-y-scroll.p-8.space-y-2');
      if (div) {
        div.scrollTop = div.scrollHeight - div.clientHeight;
      }
    }, [polling]);


    return (
        <div className = 'w-screen h-[calc(100vh-64px)] flex flex-col bg-black text-white'> 
          <div className = 'flex-grow overflow-y-scroll p-8 space-y-2'>
            {fetching && messages.length == 0 &&
              <div className = 'text-center font-bold'> Fetching Chat Logs...</div>}
            {messages.length === 0 && !fetching && (
              <div className = 'text-center font-bold'> No Messages </div>
            )}
            
            {messages.map((message) => (

              <div key = {message.id}
              className = {`px-4 py-2 mb-3 rounded-lg w-fit text-lg ${
                  ["true", "True"].includes(
                    (message.metadata as {fromUser?: string}).fromUser ?? ""
                  )
                  ? "bg-yellow-500 ml-auto"
                  : "bg-gray-700"
              
                }`}
              >
                {message.content[0].type === 'text' 
                ? message.content[0].text.value
                  .split('\n')
                  .map((text, index) => <p key = {index}> {text} </p>) 
                : null}
                </div>
            ))}
          </div>
          
          <div className = 'mt-auto p-4 bg-gray-800'>
            <div className = 'flex items-center bg-white p-2'>
                <input
                type = 'text'
                className = 'flex-grow bg-transparent text-black focus:outline-none'
                placeholder = 'Type a message...'
                value = {message}
                onChange = {(e) => setMessage(e.target.value)}
                onKeyDown = {(event) => {
                  if (event.key === 'Enter') { 
                    event.preventDefault(); 
                    sendMessage(); 
                  }}}
                />
                
                <button disabled = {!user?.threadId || !assistant || sending || !message.trim()} 
                  className = 'ml-4 bg-yellow-500 text-white px-4 py-2 rounded-full focus:outline-none disabled:bg-yellow-700'
                  onClick = {sendMessage}
                >
                  {sending ? 'Sending...': polling ? 'Fetching Response...': 'Send'}
                </button>
            </div>
          </div>

        </div>
      );
}

export default ChatPage ;