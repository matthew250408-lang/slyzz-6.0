import { and, desc, eq, ne } from "drizzle-orm";
import {
  db,
  modmailConversationsTable,
  type ModmailConversation,
} from "@workspace/db";

export async function getActiveModmailForUser(
  userId: string,
): Promise<ModmailConversation | undefined> {
  const [conversation] = await db
    .select()
    .from(modmailConversationsTable)
    .where(
      and(
        eq(modmailConversationsTable.userId, userId),
        ne(modmailConversationsTable.status, "closed"),
      ),
    )
    .orderBy(desc(modmailConversationsTable.updatedAt))
    .limit(1);

  return conversation;
}

export async function getModmailByThreadId(
  threadId: string,
): Promise<ModmailConversation | undefined> {
  const [conversation] = await db
    .select()
    .from(modmailConversationsTable)
    .where(eq(modmailConversationsTable.threadId, threadId))
    .limit(1);

  return conversation;
}

export async function createModmailConversation(
  userId: string,
  threadId: string,
): Promise<ModmailConversation> {
  const [conversation] = await db
    .insert(modmailConversationsTable)
    .values({ userId, threadId, status: "open" })
    .returning();

  return conversation;
}

export async function updateModmailStatus(
  threadId: string,
  status: ModmailConversation["status"],
  claimedByUserId?: string | null,
): Promise<void> {
  await db
    .update(modmailConversationsTable)
    .set({
      status,
      ...(claimedByUserId === undefined ? {} : { claimedByUserId }),
      updatedAt: new Date(),
    })
    .where(eq(modmailConversationsTable.threadId, threadId));
}

export async function claimModmailConversation(
  threadId: string,
  claimedByUserId: string,
): Promise<boolean> {
  const claimed = await db
    .update(modmailConversationsTable)
    .set({
      status: "claimed",
      claimedByUserId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(modmailConversationsTable.threadId, threadId),
        eq(modmailConversationsTable.status, "open"),
      ),
    )
    .returning({ id: modmailConversationsTable.id });

  return claimed.length > 0;
}

export async function unclaimModmailConversation(
  threadId: string,
): Promise<boolean> {
  const unclaimed = await db
    .update(modmailConversationsTable)
    .set({
      status: "open",
      claimedByUserId: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(modmailConversationsTable.threadId, threadId),
        eq(modmailConversationsTable.status, "claimed"),
      ),
    )
    .returning({ id: modmailConversationsTable.id });

  return unclaimed.length > 0;
}