"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  X,
  Send,
  Plus,
  Menu,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
  images?: string[];
  typing?: boolean;
}

interface Chat {
  id: string;
  messages: Message[];
  title: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [chats, setChats] = useState<Chat[]>([
    { id: "default", messages: [], title: "Obrolan Pertama" },
  ]);
  const [activeChat, setActiveChat] = useState("default");
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string[]>([]);
  const [showPreset, setShowPreset] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [typingMessage, setTypingMessage] = useState<string>(""); // ✅ animasi ketik

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentChat = chats.find((c) => c.id === activeChat);

  const presetQuestions = [
    "Apa itu React?",
    "Jelaskan TCP/IP secara singkat",
    "Apa perbedaan HTTP dan HTTPS?",
    "Bagaimana cara kerja blockchain?",
  ];

  // ✅ Load dari localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    const savedActive = localStorage.getItem("activeChat");

    if (savedChats) setChats(JSON.parse(savedChats));
    if (savedActive) setActiveChat(savedActive);
  }, []);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("activeChat", activeChat);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, typingMessage]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (text?: string) => {
    if (!currentChat) return;
    const trimmed = text ?? prompt.trim();
    if (!trimmed && imageBase64.length === 0) return;

    const userMessage: Message = {
      role: "user",
      text: trimmed,
      images: selectedImages,
    };

    updateChatMessages([...currentChat.messages, userMessage]);
    setPrompt("");
    setSelectedImages([]);
    setImageBase64([]);
    setLoading(true);
    setTypingMessage(""); // reset typing

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, images: imageBase64 }),
      });

      let aiText = "";
      if (res.ok) {
        const data = await res.json();
        aiText = (data.output || "Saya belum bisa menjawab itu.").replace(/\*/g, "");
      } else {
        aiText = "Terjadi kesalahan server.";
      }

      // ✅ animasi typewriter
      typeWriterEffect(aiText, userMessage);
    } catch {
      updateChatMessages([
        ...currentChat.messages,
        userMessage,
        { role: "ai", text: "Terjadi kesalahan saat memproses jawaban." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi animasi ketik
  const typeWriterEffect = (text: string, userMessage: Message) => {
    let i = 0;
    setTypingMessage("");

    const interval = setInterval(() => {
      i++;
      setTypingMessage(text.slice(0, i));

      if (i >= text.length) {
        clearInterval(interval);

        updateChatMessages([
          ...currentChat!.messages,
          userMessage,
          { role: "ai", text, typing: false },
        ]);
        setTypingMessage("");
      }
    }, 25); // 25ms per huruf
  };

  const updateChatMessages = (newMessages: Message[]) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? {
              ...c,
              messages: newMessages,
              title: newMessages[0]?.text.slice(0, 20) || "Obrolan Baru",
            }
          : c
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImageBase64((prev) => [...prev, base64]);
        setSelectedImages((prev) => [...prev, URL.createObjectURL(file)]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    setChats((prev) => [
      ...prev,
      { id: newId, messages: [], title: "Obrolan Baru" },
    ]);
    setActiveChat(newId);
    setPrompt("");
    setSelectedImages([]);
    setImageBase64([]);
    setShowPreset(true);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChat === id) {
      setActiveChat(chats[0]?.id || "default");
    }
  };

  return (
    <main className="flex h-screen bg-[#111] text-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col transform transition-transform duration-300 z-20 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="font-bold text-lg text-emerald-500">History</h2>
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              className="bg-emerald-600 p-2 rounded-lg hover:bg-emerald-700 transition"
              title="Obrolan baru"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition"
              title="Tutup sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex justify-between items-center px-4 py-3 text-sm border-b border-gray-800 hover:bg-gray-800 transition cursor-pointer ${
                chat.id === activeChat ? "bg-gray-800 text-emerald-400" : ""
              }`}
            >
              <span onClick={() => setActiveChat(chat.id)} className="flex-1">
                {chat.title}
              </span>
              <button
                onClick={() => handleDeleteChat(chat.id)}
                className="ml-2 text-red-500 hover:text-red-600"
                title="Hapus obrolan ini"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <section className="flex-1 flex flex-col">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="absolute top-3 left-3 bg-gray-800 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 z-10"
          >
            <Menu size={18} /> History
          </button>
        )}

        <header className="w-full bg-[#1c1c1c] text-gray-200 py-3 px-4 border-b border-gray-800">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <Image src="/TG.png" alt="Logo" width={60} height={32} />
              <span className="text-emerald-500">Tanjung AI</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl mx-auto flex flex-col gap-6 pb-40 w-full">
          {currentChat?.messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-20 space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/TG.png"
                  alt="Logo"
                  width={80}
                  height={60}
                  className="rounded-lg"
                />
                <h1 className="text-2xl font-bold text-emerald-500">
                  Selamat Datang di Tanjung AI
                </h1>
              </div>
              <p className="text-gray-300 max-w-md">
                Silakan pilih pertanyaan yang sudah tersedia di bawah atau ketik
                pertanyaanmu sendiri.
              </p>

              {showPreset && (
                <div className="flex justify-center gap-3 flex-wrap pt-4">
                  {presetQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowPreset(false);
                        handleSend(q);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentChat?.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative max-w-[75%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap break-words shadow-md leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-[#2a2a2a] text-emerald-100 border border-gray-700 rounded-bl-none"
                }`}
              >
                {msg.text}
                {msg.images && msg.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {msg.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="gambar"
                        className="rounded-lg max-h-40 object-cover"
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleCopy(msg.text, i)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-black/50 p-1 rounded-md"
                  title="Salin teks"
                >
                  {copiedIndex === i ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} className="text-gray-300" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* ✅ Ketikan AI sedang berjalan */}
          {typingMessage && (
            <div className="flex justify-start">
              <div className="bg-[#2a2a2a] text-emerald-100 border border-gray-700 rounded-xl rounded-bl-none shadow-md px-4 py-3 text-sm whitespace-pre-wrap max-w-[75%] leading-relaxed">
                {typingMessage}
              </div>
            </div>
          )}

          {/* Loading dots sebelum mulai ngetik */}
          {loading && !typingMessage && (
            <div className="flex items-start gap-2">
              <div className="bg-[#2a2a2a] px-4 py-3 rounded-xl rounded-bl-none shadow-md">
                <DotTyping />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) handleSend();
          }}
          className={`fixed bottom-0 ${
            showSidebar ? "left-64" : "left-0"
          } right-0 bg-[#1c1c1c] border-t border-gray-800 py-4 flex justify-center px-4`}
        >
          <div className="w-full max-w-3xl relative">
            {selectedImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto mb-2">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt="preview"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImages((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                        setImageBase64((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                      }}
                      className="absolute top-1 right-1 bg-black/70 p-1 rounded-full"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end bg-[#2a2a2a] rounded-xl border border-gray-700 px-3 py-2">
              <label className="cursor-pointer flex items-center justify-center text-gray-400 hover:text-gray-200 transition mr-2">
                <ImageIcon size={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageUpload}
                />
              </label>

              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 resize-none bg-transparent text-gray-100 p-2 focus:outline-none max-h-32"
                placeholder="Ketik pesan di sini..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || (!prompt.trim() && selectedImages.length === 0)}
                className="ml-2 bg-emerald-600 disabled:bg-emerald-700/50 text-white p-2 rounded-lg hover:bg-emerald-700 transition disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}

function DotTyping() {
  return (
    <span className="flex gap-[4px]">
      {[...Array(3)].map((_, i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}
