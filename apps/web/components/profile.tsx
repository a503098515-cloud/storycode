

import { currentUserId } from "@project/auth"
import { getUser } from "@project/domain"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Profile() {
    const userId = await currentUserId();

    if (!userId){
        redirect("/login");
    }

    const user = await getUser(userId);

    if (!user){ 
        redirect("/login");
    }

    const username = user.username ?? user.email ?? user.name;

    return (
        <>
        <Link
            href="/"
            className="mb-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
            Back to home
        </Link>
        <section className="rounded-lg border border-neutral-200 p-6">
            <h2 className= "text-lg font-semibold">Profile</h2>
            <p className = "mt-2 text-sm text-neutral-600"><b><i>User ID</i></b>: {userId}</p>
            <p className = "mt-2 text-sm text-neutral-600"><b><i>Username</i></b>: {username}</p>

            <p className = "mt-2 text-sm text-neutral-600"><b><i>Current Level</i></b>: {user.currentLevelId ?? "Not Set"}</p>

            
            
        </section>
        
        </>
    )


}