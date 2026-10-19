import { useState } from "react";
import { PageHeader, Kpi, Panel, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, ShieldAlert, Award, Calendar } from "lucide-react";
import { toast } from "sonner";

export function NotificationsModule() {
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "New High-Priority Enquiry Assigned",
      detail: "CAT Aspirant Aarav Sharma (+91 9810007919) requested a diagnostic consultation.",
      time: "10 mins ago",
      type: "admissions",
      read: false,
    },
    {
      id: "2",
      title: "Academic Risk Alert: Stagnant Mock Score",
      detail: "Student Aditi Verma scored below 70 %ile in DILR for 2 consecutive mocks. Mentoring meeting recommended.",
      time: "1 hour ago",
      type: "risk",
      read: false,
    },
    {
      id: "3",
      title: "Batch Class Attendance Check Complete",
      detail: "Prof. Raghav completed attendance for CAT Comprehensive Classroom — Jan 2026 Weekend (94% Present).",
      time: "3 hours ago",
      type: "attendance",
      read: true,
    },
    {
      id: "4",
      title: "Fee Instalment Received",
      detail: "Payment of ₹42,500 recorded for student Rohan Banerjee via UPI reference UTR-948271.",
      time: "Yesterday",
      type: "finance",
      read: true,
    },
    {
      id: "5",
      title: "CAT 2026 Official Registration Reminder",
      detail: "IIM CAT registration portal window notification issued for all eligible aspirants.",
      time: "2 days ago",
      type: "exam",
      read: true,
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filtered = notifications.filter((n) => (filter === "UNREAD" ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity Feeds"
        title="Notification Centre"
        description="Real-time operational alerts, lead follow-ups, academic risk notifications, and payment confirmations."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={filter === "UNREAD" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("UNREAD")}
            >
              Unread ({unreadCount})
            </Button>
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Unread Notifications" value={unreadCount} hint="Requires staff attention" tone="primary" />
        <Kpi label="Admissions Alerts" value="1 Pending" hint="Immediate follow-ups" tone="warning" />
        <Kpi label="Academic Risks" value="1 Flagged" hint="Mentoring action items" />
        <Kpi label="System Integrations" value="Active" hint="Connected to MongoDB Atlas" />
      </div>

      <Panel title="Recent Notifications">
        <div className="divide-y text-sm">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 py-3.5 transition-colors ${
                !n.read ? "bg-primary/5 px-3 rounded-md my-1" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full border bg-background p-1.5 text-primary">
                  {n.type === "risk" ? (
                    <ShieldAlert className="size-4" />
                  ) : n.type === "finance" ? (
                    <Award className="size-4" />
                  ) : (
                    <Bell className="size-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{n.title}</span>
                    {!n.read && <Tag tone="primary">New</Tag>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.detail}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{n.time}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => toggleRead(n.id)}
              >
                {n.read ? "Mark unread" : "Mark read"}
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No unread notifications at this time.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
