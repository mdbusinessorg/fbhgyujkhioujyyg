import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
    },
  });
}
