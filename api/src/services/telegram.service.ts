import { Telegraf } from "telegraf";
import { prisma } from "../lib/prisma";
import { handleResumeAction } from "./actions.service";
import { ExtractedEvent } from "../types/schema";

export const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  : null;

function humanizeKind(kind?: string | null): string {
  if (!kind) return "";
  return kind
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatActionMessage(item: ExtractedEvent): string {
  const lines = [`*${item.title}*`];
  const dateLine = [item.date, item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : item.startTime]
    .filter(Boolean)
    .join(" · ");
  if (dateLine) lines.push(dateLine);
  if (item.kind) lines.push(humanizeKind(item.kind));
  if (item.notes) lines.push(item.notes);
  return lines.join("\n");
}

export async function notifyIfLinked(
  userId: string,
  actionId: string,
  item: ExtractedEvent
) {
  if (!bot) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });
  if (!user?.telegramChatId) return;

  try {
    await bot.telegram.sendMessage(user.telegramChatId, formatActionMessage(item), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📅 Calendar", callback_data: `approve:CALENDAR_EVENT:${actionId}` },
            { text: "✅ Task", callback_data: `approve:TASK:${actionId}` },
            { text: "✕ Reject", callback_data: `reject:${actionId}` },
          ],
        ],
      },
    });
  } catch (error) {
    console.error("Failed to send Telegram notification", { userId, actionId, error });
  }
}

if (bot) {
  bot.command("start", async (ctx) => {
    const token = ctx.message.text.split(" ")[1]?.trim();
    if (!token) {
      await ctx.reply("Open the link from the extension's settings to connect your account.");
      return;
    }

    const user = await prisma.user.findUnique({ where: { telegramLinkToken: token } });
    if (!user) {
      await ctx.reply("That link is invalid or has expired. Generate a new one from the extension.");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: String(ctx.chat.id) },
    });

    await ctx.reply("Connected. You'll get a message here whenever an action needs your review.");
  });

  bot.action(/^approve:(CALENDAR_EVENT|TASK):(.+)$/, async (ctx) => {
    const [, destination, actionId] = ctx.match;
    const originalText = ctx.callbackQuery.message && "text" in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : "";
    await ctx.answerCbQuery();

    const chatId = String(ctx.chat?.id);
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) {
      await ctx.editMessageText("Couldn't find your linked account for this action.");
      return;
    }

    try {
      await handleResumeAction(user.id, actionId, {
        approved: true,
        destination: destination as "CALENDAR_EVENT" | "TASK",
      });
      await ctx.editMessageText(`${originalText}\n\nApproved → ${destination}`);
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404) {
        await ctx.editMessageText(`${originalText}\n\nAlready resolved elsewhere.`);
        return;
      }
      console.error("Failed to resolve action from Telegram", { actionId, error });
      await ctx.editMessageText(`${originalText}\n\nSomething went wrong, try again from the extension.`);
    }
  });

  bot.action(/^reject:(.+)$/, async (ctx) => {
    const [, actionId] = ctx.match;
    const originalText = ctx.callbackQuery.message && "text" in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : "";
    await ctx.answerCbQuery();

    const chatId = String(ctx.chat?.id);
    const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
    if (!user) {
      await ctx.editMessageText("Couldn't find your linked account for this action.");
      return;
    }

    try {
      await handleResumeAction(user.id, actionId, { approved: false });
      await ctx.editMessageText(`${originalText}\n\nRejected`);
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 404) {
        await ctx.editMessageText(`${originalText}\n\nAlready resolved elsewhere.`);
        return;
      }
      console.error("Failed to resolve action from Telegram", { actionId, error });
      await ctx.editMessageText(`${originalText}\n\nSomething went wrong, try again from the extension.`);
    }
  });
}
