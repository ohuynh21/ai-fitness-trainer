'use client'
import { ChallengePreferences } from '@prisma/client';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Switch } from "@/components/ui/switch"
import DifficultyCard from './DifficultyCard';
import axios from 'axios';
import toast from 'react-hot-toast';

const difficulties = [
    {
      id: "EASY",
      level: "Easy",
      description:
        "This challenge level is for people who are new to programming. Receive 3 challenges per day (7:30AM, 12PM, & 5:30PM PST).",
    },
    {
      id: "MEDIUM",
      level: "Medium",
      description:
        "This challenge level is for people who are familiar with programming. Receive 4 challenges per day (7AM, 12PM, 5PM, & 8PM PST).",
    },
    {
      id: "HARD",
      level: "Hard",
      description:
        "This challenge level is for people who are experienced with programming. Receive 5 challenges per day (6AM, 9AM, 12PM, 5PM, & 8PM PST).",
    },
  ];

type Difficulties = 'EASY' | 'MEDIUM' | 'HARD'
interface ProfileContainerProps {
    challengePreferences: ChallengePreferences
}

function ProfileContainer({challengePreferences}: ProfileContainerProps) {
    
    const [sendNotifications, setSendNotifications] = useState(challengePreferences.sendNotifications)
    const [sendChallenges, setSendChallenges] = useState(challengePreferences.sendChallenges)
    const [selectedDifficulty, setSelectedDifficulty] = useState(challengePreferences.challengeId)
    const [saving, setSaving] = useState(false)
    
    const handleToggleNotifications = () => {
        setSendNotifications((prev) => (!prev))

    }
    const handleSelectDifficulty = (difficultyId: Difficulties) => {
        setSelectedDifficulty(difficultyId)
    }

    const handleToggleSendChallenges = () => {
        setSendChallenges((prev) => (!prev))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await axios.post<{
                success: Boolean
                data?: ChallengePreferences
                message?: string}>('/api/challenge-preferences', {
                    id: challengePreferences.id,
                    challengeId: selectedDifficulty,
                    sendNotifications,
                    sendChallenges
                })
            if (!response.data.success || !response.data.data) {
                console.error(response.data.message)
                toast.error(response.data.message ?? 'something went wrong')
            }
            toast.success('Preferences Saved')
            
        } catch (error) {
            console.error(error)
            toast.error('something went wrong')
        } finally {
            setSaving(false)
        }

    }
    return (
        <div className='flex flex-col'>
            <div className='flex flex-row justify-between items-center mb-4'>
                <h1 className = 'font-bold text-2xl'>Workout Challenges</h1>
                <Button onClick = {handleSave}> {saving ? 'Saving...' : 'Save'}</Button>
            </div>
            <div className='flex flex-row items-center justify-between mb-4 p-4 shadow rounded-lg'>
                <div>
                    <h3 className = 'font-medium text-lg text-gray-900'>Enable</h3>
                    <p> Periodically receive workout challenges throughout the day based on the selected difficulty level</p>
                </div>
                <Switch checked = {sendChallenges} onCheckedChange={handleToggleSendChallenges}></Switch>
            </div>
            <div className='flex flex-row items-center justify-between mb-4 p-4 shadow rounded-lg'>
                <div>
                    <h3 className = 'font-medium text-lg text-gray-900'>Push Notifications</h3>
                    <p> Receive push notifications when new challenges are available</p>
                </div>
                <Switch checked = {sendNotifications} onCheckedChange={handleToggleNotifications}></Switch>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {difficulties.map((difficulty) => (
                    <DifficultyCard key={difficulty.id} 
                    level={difficulty.level} 
                    description={difficulty.description}
                    selected={difficulty.id === selectedDifficulty}
                    onSelect={() => handleSelectDifficulty(difficulty.id as Difficulties)}/>
                ))}

            </div>
        </div>
      );
}

export default ProfileContainer;