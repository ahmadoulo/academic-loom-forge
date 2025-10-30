import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar shadow-2xl z-50 lg:hidden transform transition-transform duration-300 ease-out border-r border-border">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
