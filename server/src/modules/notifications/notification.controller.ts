import type { Response } from "express";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireUser } from "../../shared/request";
import * as inboxService from "./inbox.service";
import { subscribeToUser } from "./notification.realtime";

// Proxies (and Render) close connections that sit idle for about a minute.
const HEARTBEAT_MS = 25_000;

const openStreams = new Set<Response>();

// Ends every open stream so the server can shut down.
export const closeNotificationStreams = (): void => {
  openStreams.forEach((stream) => stream.end());
};

// Query: ?unread=true&page=<n> (both optional).
export const listNotifications = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { unread, page } = req.query;
  const pageNumber = page === undefined ? 1 : Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw AppError.badRequest("Invalid page");
  }

  const result = await inboxService.listNotifications(id, { unreadOnly: unread === "true", page: pageNumber });
  sendSuccess(res, 200, {
    data: result.notifications,
    page: result.page,
    totalPages: result.totalPages,
    unreadCount: result.unreadCount,
  });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { count: await inboxService.countUnread(id) });
});

export const markRead = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { unreadCount: await inboxService.markRead(id, req.params.id) });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { unreadCount: await inboxService.markAllRead(id) });
});

// Server-Sent Events: the current unread count on connect, then each new notification and count change.
export const streamNotifications = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const count = await inboxService.countUnread(id);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Stops nginx-style proxies from buffering the stream.
    "X-Accel-Buffering": "no",
  });
  const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  send("unread", { count });
  const unsubscribe = subscribeToUser(id, ({ event, data }) => send(event, data));
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
  openStreams.add(res);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    openStreams.delete(res);
  });
});
