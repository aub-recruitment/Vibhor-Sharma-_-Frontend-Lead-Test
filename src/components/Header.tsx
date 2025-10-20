import { Download } from "lucide-react";

export function Header() {
  return (
    <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="font-semibold text-lg">Global Trotter</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center">
              <Download className="text-white" size={20} />
            </div>
            <img
              className="w-8 h-8 rounded-full"
              src="https://i.pravatar.cc/32"
              alt="User avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
