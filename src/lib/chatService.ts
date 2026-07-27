// src/lib/chatService.ts
import { PrismaClient } from '@prisma/client';
import { ChatMessage, UserDetail } from '../types';

const prisma = new PrismaClient();

/**
 * Sends a message between two users or to a group.
 * @param senderId ID of the user sending the message.
 * @param receiverId Optional ID of a single recipient (for 1:1 chats).
 * @param groupId Optional ID of the group chat.
 * @param contentMarkdown The text content using Markdown syntax.
 * @param attachment Optional metadata for an attached file.
 * @returns A Promise resolving to the created Message object.
 */
export async function sendMessage(
  senderId: string, 
  receiverId?: string, 
  groupId?: string, 
  contentMarkdown: string, 
  attachment?: { url: string; fileName: string; mimeType: string; fileSize: number }
): Promise<ChatMessage> {
  try {
    const messageRecord = await prisma.message.create({
      data: {
        senderId: senderId,
        content: contentMarkdown,
        receiverId: receiverId || null,
        groupId: groupId || null,
        fileUrl: attachment?.url,
        fileName: attachment?.fileName,
        fileType: attachment?.mimeType,
        // Note: We don't set sender/receiver objects here; we rely on related Prisma data fetching later.
      },
    });

    // Construct a full ChatMessage object for the public interface
    return {
        id: messageRecord.id,
        contentMarkdown: messageRecord.content,
        senderId: messageRecord.senderId,
        senderName: null, // Will need to be fetched separately or derived from caller context in a real app
        createdAt: new Date(messageRecord.createdAt),
        messageType: attachment ? 'DOCUMENT' : 'TEXT', // Simple heuristic for now
        status: 'SENT', // Initial status
        attachment: attachment || undefined,
    };

  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send the message.");
  } finally {
     await prisma.$disconnect();
  }
}


/**
 * Fetches a paginated history of messages for a specific group or 1:1 chat.
 * @param groupId The ID of the group (or receiverId if fetching private).
 * @param lastTimestamp The timestamp to query messages after (for pagination).
 * @returns A Promise resolving to an array of ChatMessage objects.
 */
export async function fetchMessageHistory(
  groupId: string, 
  lastTimestamp: Date | null = null
): Promise<ChatMessage[]> {
  try {
    const messages = await prisma.message.findMany({
      where: {
        group: {
          id: groupId,
        },
        OR: [
            // Fallback/alternative grouping logic if only receiverId is provided in a 1:1 chat context without groups.
            // Assuming this function is primarily for Group chats based on 'groupId' parameter.
        ]
      },
      orderBy: {
        createdAt: 'asc', // Fetching oldest first is standard for history views, client pagination handles reversal
      },
      take: 100, // Limit the batch size
    });

    // Convert raw Prisma models to defined ChatMessage type
    const formattedMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        contentMarkdown: msg.content,
        senderId: msg.senderId,
        senderName: null, // Needs context/fetch from User table relation
        createdAt: new Date(msg.createdAt),
        messageType: msg.fileUrl ? 'DOCUMENT' : 'TEXT',
        status: 'DELIVERED', // Example default status, ideally fetched per message
        attachment: { 
            url: msg.fileUrl || '', 
            fileName: msg.fileName || '', 
            mimeType: msg.fileType || '', 
            fileSize: parseInt(msg.getSize?.toString() || '0') // Handle potential optional field
        } 
    }));

    return formattedMessages;
  } catch (error) {
    console.error("Error fetching message history:", error);
    throw new Error("Failed to retrieve message history.");
  } finally {
     await prisma.$disconnect();
  }
}