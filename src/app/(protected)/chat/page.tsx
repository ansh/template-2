"use client";

import { useState } from "react";
import { useChat } from "ai/react";
import Link from "next/link";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <header className="w-full flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <Link href="/templates" className="text-blue-500 hover:underline">
          Back to Templates
        </Link>
      </header>

      <div className="w-full max-w-2xl flex flex-col flex-grow overflow-hidden">
        <div className="flex-grow overflow-y-auto mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {message.content}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex w-full max-w-2xl">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500 transition-colors duration-200"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
