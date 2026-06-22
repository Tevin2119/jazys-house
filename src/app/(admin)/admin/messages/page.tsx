export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MessageThread } from "@/components/admin/message-thread";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { order: selectedId } = await searchParams;

  // All orders that have at least one message — newest message first
  const conversations = await prisma.order.findMany({
    where: { tenantId, messages: { some: {} } },
    select: {
      id:    true,
      name:  true,
      email: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, side: true, isInternal: true, createdAt: true },
      },
      _count: {
        select: {
          messages: {
            where: { side: "CUSTOMER" },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Selected conversation full thread
  let selectedOrder: { id: string; name: string | null; email: string | null } | null = null;
  let threadMessages: {
    id: string;
    content: string;
    side: string;
    senderName: string;
    isInternal: boolean;
    createdAt: string;
  }[] = [];

  if (selectedId) {
    const found = await prisma.order.findFirst({
      where: { id: selectedId, tenantId },
      select: { id: true, name: true, email: true },
    });
    if (found) {
      selectedOrder = found;
      const msgs = await prisma.orderMessage.findMany({
        where:   { orderId: selectedId, tenantId },
        orderBy: { createdAt: "asc" },
      });
      threadMessages = msgs.map((m) => ({
        id:         m.id,
        content:    m.content,
        side:       m.side,
        senderName: m.senderName,
        isInternal: m.isInternal,
        createdAt:  m.createdAt.toISOString(),
      }));
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 20px", fontWeight: 400 }}>
        Messages
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: 600, border: "1px solid #ece2d2", borderRadius: 14, overflow: "hidden", background: "#fffdf9" }}>
        {/* Conversation list */}
        <div style={{ borderRight: "1px solid #ece2d2", overflowY: "auto" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0e8da", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a39685", fontWeight: 700 }}>
            Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "#8a7c6a", fontSize: 13 }}>
              No messages yet
            </div>
          ) : (
            conversations.map((conv) => {
              const lastMsg = conv.messages[0];
              const isActive = conv.id === selectedId;
              return (
                <Link
                  key={conv.id}
                  href={`/admin/messages?order=${conv.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f4ecde",
                    background: isActive ? "#fdf6f0" : "transparent",
                    cursor: "pointer",
                    borderLeft: isActive ? "3px solid #c0563d" : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#2a1f16" }}>
                        {conv.name ?? conv.email ?? "Unknown"}
                      </div>
                      {lastMsg && (
                        <div style={{ fontSize: 10, color: "#a39685", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {new Date(lastMsg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b5d4f", marginBottom: 3 }}>
                      #{conv.id.slice(0, 6)}
                    </div>
                    {lastMsg && (
                      <div style={{ fontSize: 12, color: "#8a7c6a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lastMsg.side === "STORE" ? "You: " : ""}{lastMsg.content}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Thread panel */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {selectedOrder ? (
            <MessageThread
              orderId={selectedOrder.id}
              customerName={selectedOrder.name ?? selectedOrder.email ?? "Customer"}
              messages={threadMessages}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#8a7c6a", fontSize: 14 }}>
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
