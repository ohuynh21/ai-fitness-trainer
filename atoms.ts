import { Assistant, User } from "@prisma/client";
import { atom } from "jotai";

export const userAtom = atom<User | null>(null)
export const assistantAtom = atom<Assistant| null>(null)