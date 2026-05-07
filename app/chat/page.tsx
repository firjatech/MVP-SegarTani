"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2, Store, User as UserIcon } from "lucide-react";

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sellerId = searchParams.get('seller_id');
  const productId = searchParams.get('product_id');
  const buyerId = searchParams.get('buyer_id');

  const [user, setUser] = useState<any>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("Memuat...");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      let chatBuyerId = user.id;
      let chatSellerId = sellerId;
      let displayPartnerName = "Pengguna";

      // Determine roles based on URL params
      if (buyerId) {
        // Current user is the SELLER chatting with a BUYER
        chatBuyerId = buyerId;
        chatSellerId = user.id;
        const { data: buyerData } = await supabase.from('profiles').select('full_name').eq('id', buyerId).single();
        if (buyerData?.full_name) displayPartnerName = buyerData.full_name;
      } else if (sellerId) {
        // Current user is the BUYER chatting with a SELLER
        const { data: sellerData } = await supabase.from('profiles').select('full_name').eq('id', sellerId).single();
        if (sellerData?.full_name) displayPartnerName = sellerData.full_name;
      }

      setPartnerName(displayPartnerName);

      if (chatSellerId && chatBuyerId) {
        // Try to find existing chat
        let { data: chatData, error } = await supabase
          .from('chats')
          .select('id')
          .eq('buyer_id', chatBuyerId)
          .eq('seller_id', chatSellerId)
          .eq('product_id', productId ? parseInt(productId) : null)
          .single();

        if (error && error.code === 'PGRST116') {
          // Chat doesn't exist, create it (usually buyer initiates this)
          const { data: newChat, error: createError } = await supabase
            .from('chats')
            .insert({
              buyer_id: chatBuyerId,
              seller_id: chatSellerId,
              product_id: productId ? parseInt(productId) : null
            })
            .select()
            .single();
            
          if (!createError && newChat) {
            chatData = newChat;
          }
        }

        if (chatData) {
          setChatId(chatData.id);
          fetchMessages(chatData.id);
          subscribeToMessages(chatData.id);
        }
      }
      setLoading(false);
    };

    initializeChat();

    return () => {
      supabase.removeAllChannels();
    };
  }, [sellerId, productId, buyerId, router]);

  const fetchMessages = async (cId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', cId)
      .order('created_at', { ascending: true });
      
    if (data) setMessages(data);
  };

  const subscribeToMessages = (cId: string) => {
    supabase
      .channel(`chat_${cId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${cId}`
      }, payload => {
        setMessages(current => [...current, payload.new]);
      })
      .subscribe();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user) return;

    const msgText = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: msgText
      });

    if (error) {
      console.error("Failed to send message", error);
      alert("Gagal mengirim pesan");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00AA13]" size={40} /></div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-3xl h-20 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#00AA13]/10 text-[#00AA13] rounded-full flex items-center justify-center">
              {buyerId ? <UserIcon size={20} /> : <Store size={20} />}
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-lg">{partnerName}</h1>
              <p className="text-xs font-bold text-gray-400">
                {buyerId ? "Pelanggan SegarTani" : "Penjual SegarTani"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl mt-6 mb-24">
        <div className="flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Belum ada pesan. Mulai percakapan sekarang!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl ${isMine ? 'bg-[#00AA13] text-white rounded-tr-sm shadow-md' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                    <p className="font-medium text-sm md:text-base leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] font-bold mt-2 ${isMine ? 'text-white/70 text-right' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={sendMessage} className="flex gap-3 items-center">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan..." 
              className="flex-1 bg-gray-50 border-none rounded-full px-6 py-4 focus:ring-4 focus:ring-[#00AA13]/10 outline-none font-medium text-gray-700"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-14 h-14 bg-[#00AA13] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:bg-[#008810] active:scale-90 shadow-lg shadow-[#00AA13]/20"
            >
              <Send size={20} className="-ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#00AA13]" size={40} /></div>}>
      <ChatContent />
    </Suspense>
  )
}
