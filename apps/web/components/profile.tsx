"use client";

import { currentUserId } from "@project/auth"
import { getUser } from "@project/domain"
import { redirect } from "next/navigation"

export default async function Profile() {
    const userId = await currentUserId();

    if (!userId){
        redirect("/login");
    }

    const user = await getUser(userId);

    if (!user){ 
        redirect("/login");
    }

    const email = user.email;

    return (
        <>
        <section className="rounded-lg border border-neutral-200 p-6">
            <h2 className= "text-lg font-semibold">Profile</h2>
            <p className = "mt-2 text-sm text-neutral-600"><b><i>User ID</i></b>: {userId}</p>
            <p className = "mt-2 text-sm text-neutral-600"><b><i>Email</i></b>: {email}</p>

            <p className = "mt-2 text-sm text-neutral-600"><b><i>Current Level</i></b>: {user.currentLevelId ?? "Not Set"}</p>
            
        </section>
        
        </>
    )


}