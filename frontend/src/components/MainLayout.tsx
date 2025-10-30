import { ChatSidebar } from "@/components/ChatSidebar";
import { Editor } from "@/components/Editor";
import { TopBar } from "@/components/TopBar";

export function MainLayout() {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[320px] border-r">
          <ChatSidebar />
        </div>
        <div className="flex-1 overflow-hidden">
          <Editor />
        </div>
      </div>
    </div>
  );
}
