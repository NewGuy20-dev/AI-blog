"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@auth0/nextjs-auth0/client";

interface TerminalLine {
  type: "input" | "output" | "error" | "success" | "system";
  content: string;
}

const HELP_TEXT = `
Available commands:
  help                    Show this help message
  clear                   Clear terminal
  whoami                  Show current admin info
  status                  Show system stats
  
  posts list              List recent posts
  posts archive --all     Archive all published posts
  posts publish <slug>    Publish a post by slug
  
  delete_article <title>  Delete article by title
  
  users list              List users
  users stats             Show user statistics
  
  admins list             List all admins
  add_admin <user_id>     Add a new admin
  deown_admin <user_id>   Remove admin (cannot remove original)
  
  audit tail              Show recent audit logs
  
  sudo <command>          Execute with elevated privileges
`;

export function Terminal() {
  const { user } = useUser();
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "system", content: "Pageo Admin Terminal v1.0.0" },
    { type: "system", content: 'Type "help" for available commands.\n' },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSudo, setIsSudo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const stats = useQuery(api.admin.getStats);
  const archiveAll = useMutation(api.admin.archiveAllPosts);
  const deleteArticle = useMutation(api.admin.deleteArticle);
  const publishPost = useMutation(api.admin.publishPost);
  const addAdmin = useMutation(api.admin.addAdmin);
  const removeAdmin = useMutation(api.admin.removeAdmin);

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (type: TerminalLine["type"], content: string) => {
    setLines((prev) => [...prev, { type, content }]);
  };

  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Show input
    addLine("input", `admin@pageo:~$ ${trimmed}`);

    // Handle sudo
    let command = trimmed;
    let sudoMode = isSudo;
    if (command.startsWith("sudo ")) {
      command = command.slice(5);
      sudoMode = true;
      addLine("system", "[sudo] Elevated privileges granted");
    }

    const parts = command.split(" ");
    const mainCmd = parts[0].toLowerCase();

    try {
      switch (mainCmd) {
        case "help":
          addLine("output", HELP_TEXT);
          break;

        case "clear":
          setLines([]);
          break;

        case "whoami":
          addLine("output", `User: ${user?.name || "Unknown"}`);
          addLine("output", `Email: ${user?.email || "Unknown"}`);
          addLine("output", `ID: ${user?.sub || "Unknown"}`);
          break;

        case "status":
          if (stats) {
            addLine("success", "System Status:");
            addLine("output", `  Posts: ${stats.posts.total} (${stats.posts.published} published, ${stats.posts.draft} draft, ${stats.posts.archived} archived)`);
            addLine("output", `  Users: ${stats.users}`);
            addLine("output", `  Bookmarks: ${stats.bookmarks}`);
            addLine("output", `  Admins: ${stats.admins}`);
          } else {
            addLine("error", "Failed to fetch stats");
          }
          break;

        case "posts":
          await handlePostsCommand(parts.slice(1), sudoMode);
          break;

        case "delete_article":
          const title = parts.slice(1).join(" ");
          if (!title) {
            addLine("error", "Usage: delete_article <title>");
            break;
          }
          if (!sudoMode) {
            addLine("error", "This command requires sudo privileges");
            break;
          }
          const delResult = await deleteArticle({ title });
          if (delResult.success) {
            addLine("success", delResult.message);
          } else {
            addLine("error", delResult.message);
          }
          break;

        case "users":
          await handleUsersCommand(parts.slice(1));
          break;

        case "admins":
          if (parts[1] === "list") {
            addLine("output", "Fetching admins list...");
            addLine("system", "Use the dashboard to view full admin list");
          } else {
            addLine("error", "Usage: admins list");
          }
          break;

        case "add_admin":
          const newAdminId = parts[1];
          if (!newAdminId) {
            addLine("error", "Usage: add_admin <user_id>");
            break;
          }
          const addResult = await addAdmin({ userId: newAdminId });
          if (addResult.success) {
            addLine("success", addResult.message);
          } else {
            addLine("error", addResult.message);
          }
          break;

        case "deown_admin":
          const removeId = parts[1];
          if (!removeId) {
            addLine("error", "Usage: deown_admin <user_id>");
            break;
          }
          const removeResult = await removeAdmin({ userId: removeId });
          if (removeResult.success) {
            addLine("success", removeResult.message);
          } else {
            addLine("error", removeResult.message);
          }
          break;

        case "audit":
          if (parts[1] === "tail") {
            addLine("output", "Recent audit logs:");
            addLine("system", "Use the dashboard to view full audit logs");
          } else {
            addLine("error", "Usage: audit tail");
          }
          break;

        default:
          addLine("error", `Command not found: ${mainCmd}`);
          addLine("output", 'Type "help" for available commands.');
      }
    } catch (err: any) {
      addLine("error", `Error: ${err.message || "Unknown error"}`);
    }

    setIsSudo(false);
  };

  const handlePostsCommand = async (args: string[], sudoMode: boolean) => {
    const subCmd = args[0];

    switch (subCmd) {
      case "list":
        addLine("output", "Recent posts:");
        addLine("system", "Use the dashboard to view full post list");
        break;

      case "archive":
        if (args[1] === "--all") {
          if (!sudoMode) {
            addLine("error", "This command requires sudo privileges");
            addLine("output", "Usage: sudo posts archive --all");
            return;
          }
          addLine("system", "Archiving all published posts...");
          const result = await archiveAll();
          addLine("success", `Archived ${result.archived} posts`);
        } else {
          addLine("error", "Usage: posts archive --all");
        }
        break;

      case "publish":
        const slug = args[1];
        if (!slug) {
          addLine("error", "Usage: posts publish <slug>");
          return;
        }
        const pubResult = await publishPost({ slug });
        if (pubResult.success) {
          addLine("success", pubResult.message);
        } else {
          addLine("error", pubResult.message);
        }
        break;

      default:
        addLine("error", "Usage: posts [list|archive --all|publish <slug>]");
    }
  };

  const handleUsersCommand = async (args: string[]) => {
    const subCmd = args[0];

    switch (subCmd) {
      case "list":
        addLine("output", "User list:");
        addLine("system", "Use the dashboard to view full user list");
        break;

      case "stats":
        if (stats) {
          addLine("output", `Total users: ${stats.users}`);
          addLine("output", `Total bookmarks: ${stats.bookmarks}`);
        }
        break;

      default:
        addLine("error", "Usage: users [list|stats]");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="h-full bg-[#0d1117] font-mono text-sm overflow-auto p-4"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={`whitespace-pre-wrap ${
            line.type === "input" ? "text-green-400" :
            line.type === "error" ? "text-red-400" :
            line.type === "success" ? "text-green-500" :
            line.type === "system" ? "text-yellow-500" :
            "text-gray-300"
          }`}
        >
          {line.content}
        </div>
      ))}
      
      <div className="flex items-center text-green-400">
        <span>admin@pageo:~$ </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-green-400 caret-green-400"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}
