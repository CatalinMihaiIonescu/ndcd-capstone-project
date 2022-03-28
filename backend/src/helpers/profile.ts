import { UserProfileAccess } from './profileAcess'
import { UserProfile } from '../models/UserProfile'
import { SetUserProfileRequest } from '../requests/SetUserProfileRequest'

const userProfileAccess = new UserProfileAccess()

export async function getUserProfile(userId: string): Promise<UserProfile> {
    return await userProfileAccess.getUserProfile(userId)
}

export async function setUserProfile(userId: string, profile: SetUserProfileRequest): Promise<UserProfile> {
    
    const newProfile: UserProfile = {
        userId,
        email: profile.email
    }

    return await userProfileAccess.setUserProfile(newProfile)
}

export async function deleteUserProfile(userId: string) {
    await userProfileAccess.deleteUserProfile(userId)
}