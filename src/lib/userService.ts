// src/lib/userService.ts
import { PrismaClient } from '@prisma/client';
import { UserDetail } from '../types';

// Initialize a singleton Prisma client instance (assuming this pattern is followed elsewhere)
const prisma = new PrismaClient();

/**
 * Fetches all required user data for the hover card or full profile page.
 * @param userId The ID of the user to fetch data for.
 * @returns A Promise resolving to UserDetail with comprehensive profile info.
 */
export async function getDetailedProfile(userId: string): Promise<UserDetail> {
  try {
    // 1. Fetch core user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        // Include only necessary profile fields
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // 2. Fetch social connections (Contacts)
    const contacts = await prisma.contact.findMany({
      where: { userId: userId },
      select: { contactId: true, status: true }, // Assuming Prisma maps the enum fields correctly
    });

    // 3. Combine data into the structured type
    const detailedProfile: UserDetail = {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.image,
        role: user.role as any, // Cast due to potential DB/TS mismatch in field name vs ENUM constructor
        contacts: contacts,
    };

    return detailedProfile;
  } catch (error) {
    console.error("Error fetching detailed profile:", error);
    throw new Error("Failed to retrieve user profile.");
  } finally {
    // In a real app, handle connection pooling better than resetting on each call
    await prisma.$disconnect();
  }
}