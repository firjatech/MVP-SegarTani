"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminChatInbox() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadInbox() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // Fetch chats where user is the seller
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          buyer_id,
          product_id,
          updated_at,
          profiles!chats_buyer_id_fkey ( full_name ),
          products ( name )
        `)
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error loading chats:", error);
      }

      if (data) {
        // Also fetch latest message for each chat
        const chatsWithMessages = await Promise.all(data.map(async (chat: any) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);
            
          return {
            ...chat,
            latest_message: msgData?.[0]?.content || 'Mulai percakapan',
            buyer_name: chat.profiles?.full_name || 'Pembeli'
          };
        }));
        
        setChats(chatsWithMessages);
      }
      setLoading(false);
    }

    loadInbox();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[#00AA13]" size={40} /></div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-[#00AA13]/10 text-[#00AA13] rounded-2xl flex items-center justify-center">
          <MessageSquare size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Pesan Masuk</h1>
          <p className="text-gray-500 font-medium">Balas pertanyaan dari pelanggan Anda secara langsung</p>
        </div>
      </div>

      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold text-lg">Belum ada pesan masuk.</p>
          </div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => router.push(`/chat?buyer_id=${chat.buyer_id}&product_id=${chat.product_id || ''}`)}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-gray-100 text-[#00AA13] rounded-full flex items-center justify-center font-black text-xl uppercase shadow-inner">
                  {chat.buyer_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900">{chat.buyer_name}</h3>
                  {chat.products && (
                    <p className="text-[10px] font-black text-[#00AA13] bg-[#00AA13]/10 inline-block px-3 py-1 rounded-md mb-2 uppercase tracking-wider">
                      Terkait: {chat.products.name}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm line-clamp-1 font-medium italic">"{chat.latest_message}"</p>
                </div>
              </div>
              <div className="flex items-center text-[#00AA13] font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 px-4 py-2 rounded-xl">
                Balas <ArrowRight size={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
