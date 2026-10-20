'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Send,
  Store,
  User as UserIcon,
  Check,
  CheckCheck,
  Sparkles,
  Loader2,
  Plus,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  X,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  city?: string;
  is_seller?: boolean;
}

interface StoreProfile {
  id: string;
  store_name?: string;
  logo_url?: string;
  store_address?: string;
  store_city?: string;
}

interface ProductInfo {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface ChatRoom {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id?: number | null;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    name: string;
    isSeller: boolean;
    storeName?: string;
    avatarUrl?: string;
    city?: string;
  };
  product?: ProductInfo | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface MessageItem {
  id: number | string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const formatTime = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s/g, '');
};

const BUYER_QUICK_TEMPLATES = [
  'Halo, apakah produk ini masih tersedia?',
  'Kapan pesanan saya bisa dikirim?',
  'Apakah bisa bayar COD di tempat?',
  'Sayur dan buahnya segar hari ini?',
];

const SELLER_QUICK_TEMPLATES = [
  'Halo, produk ready stok dan siap dikirim hari ini ya.',
  'Pesanan Anda sedang kami siapkan dan segera dikirim.',
  'Bisa bayar COD saat kurir tiba di lokasi.',
  'Produk kami dijamin 100% segar dan baru dipanen.',
];

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserSeller, setIsCurrentUserSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Search in chat list
  const [searchQuery, setSearchQuery] = useState('');

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<{
    id: string;
    name: string;
    isSeller: boolean;
    storeName?: string;
    avatarUrl?: string;
    city?: string;
  }[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Mobile layout switch (false = list, true = chat window)
  const [mobileViewChat, setMobileViewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoad = useRef(true);
  const prevMessageCount = useRef(0);
  const tempIdCounter = useRef(0);

  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (force) {
      // Force scroll: used when user sends a message
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Auto-scroll only if user is already near the bottom (within 150px)
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 150) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const currentCount = messages.length;

    if (isInitialLoad.current) {
      // On initial load: jump to bottom instantly without animation, no smooth scroll
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      }
      isInitialLoad.current = false;
    } else if (currentCount > prevMessageCount.current) {
      // New message arrived: only scroll if near bottom
      scrollToBottom();
    }

    prevMessageCount.current = currentCount;
  }, [messages]);


  // 1. Initial auth check & role detection
  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/chat');
        return;
      }
      setCurrentUserId(user.id);

      try {
        const storedRole = localStorage.getItem('segar-tani-role');
        if (storedRole === 'seller') {
          setIsCurrentUserSeller(true);
        } else if (storedRole === 'buyer') {
          setIsCurrentUserSeller(false);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_seller, is_admin')
            .eq('id', user.id)
            .maybeSingle();

          const { data: storeProfile } = await supabase
            .from('store_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.is_seller || profile?.is_admin || storeProfile) {
            setIsCurrentUserSeller(true);
          }
        }
      } catch (err) {
        console.error('Error checking seller role:', err);
      }
    }
    initUser();
  }, [router]);

  // 2. Fetch conversation rooms for current user
  const fetchChatRooms = useCallback(async (userId: string, selectChatId?: string) => {
    try {
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (chatsError || !chatsData) {
        console.error('Failed to fetch chats:', chatsError);
        setLoading(false);
        return;
      }

      // Collect all other user IDs and product IDs
      const otherUserIds = Array.from(new Set(
        chatsData.map(c => c.buyer_id === userId ? c.seller_id : c.buyer_id)
      ));
      const productIds = Array.from(new Set(
        chatsData.map(c => c.product_id).filter(Boolean)
      )) as number[];

      // Fetch profiles of other users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, city, is_seller')
        .in('id', otherUserIds);

      // Fetch store profiles of other users
      const { data: storeProfilesData } = await supabase
        .from('store_profiles')
        .select('id, store_name, logo_url, store_address, store_city')
        .in('id', otherUserIds);

      // Fetch products referenced in chats
      const productsMap: Record<number, ProductInfo> = {};
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, price, image')
          .in('id', productIds);
        if (prods) {
          prods.forEach(p => { productsMap[p.id] = p; });
        }
      }

      const profilesMap: Record<string, Profile> = {};
      profilesData?.forEach(p => { profilesMap[p.id] = p; });

      const storesMap: Record<string, StoreProfile> = {};
      storeProfilesData?.forEach(s => { storesMap[s.id] = s; });

      // Fetch last messages & unread count for each chat
      const formattedRooms: ChatRoom[] = await Promise.all(
        chatsData.map(async (chat) => {
          const otherId = chat.buyer_id === userId ? chat.seller_id : chat.buyer_id;
          const store = storesMap[otherId];
          const prof = profilesMap[otherId];

          const isSeller = prof?.is_seller || Boolean(store?.store_name);
          const name = store?.store_name || prof?.full_name || 'Pengguna SegarTani';

          // Get last message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, is_read')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          return {
            id: chat.id,
            buyer_id: chat.buyer_id,
            seller_id: chat.seller_id,
            product_id: chat.product_id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            otherUser: {
              id: otherId,
              name: name,
              isSeller: isSeller,
              storeName: store?.store_name,
              avatarUrl: store?.logo_url,
              city: store?.store_city || prof?.city,
            },
            product: chat.product_id ? productsMap[chat.product_id] : null,
            lastMessage: lastMsgData?.[0]?.content,
            lastMessageTime: lastMsgData?.[0]?.created_at,
            unreadCount: count || 0,
          };
        })
      );

      setChatRooms(formattedRooms);

      // Select active chat if specified or maintain active chat
      if (selectChatId) {
        const found = formattedRooms.find(r => r.id === selectChatId);
        if (found) {
          setActiveChat(found);
          setMobileViewChat(true);
        }
      } else if (formattedRooms.length > 0 && !activeChat && window.innerWidth >= 1024) {
        setActiveChat(formattedRooms[0]);
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [activeChat]);

  // 3a. Realtime subscription for chat list updates (new messages from any room)
  useEffect(() => {
    if (!currentUserId) return;

    const userId = currentUserId;

    const listChannel = supabase
      .channel('chatrooms-list-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as MessageItem & { chat_id: string };
          // Only update rooms list if this is from a different chat than the active one
          // (active chat already handles updates via its own channel)
          setChatRooms(prev => {
            const updated = prev.map(r => {
              if (r.id === newMsg.chat_id) {
                const isFromOther = newMsg.sender_id !== userId;
                return {
                  ...r,
                  lastMessage: newMsg.content,
                  lastMessageTime: newMsg.created_at,
                  unreadCount: isFromOther ? r.unreadCount + 1 : r.unreadCount,
                };
              }
              return r;
            });
            // Re-sort by latest message
            return updated.sort((a, b) =>
              new Date(b.lastMessageTime || b.updated_at).getTime() -
              new Date(a.lastMessageTime || a.updated_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chats' },
        () => {
          // New chat room created — refresh the full list
          fetchChatRooms(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(listChannel);
    };
  }, [currentUserId, fetchChatRooms]);

  // 3. Handle query params (e.g. /chat?userId=...&productId=...)
  useEffect(() => {
    if (!currentUserId) return;

    const uid = currentUserId;
    const targetUserId = searchParams.get('userId');
    const targetProductId = searchParams.get('productId');

    async function handleTargetUser() {
      if (!targetUserId || targetUserId === uid) {
        fetchChatRooms(uid);
        return;
      }

      // Check if chat already exists
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .or(`and(buyer_id.eq.${uid},seller_id.eq.${targetUserId}),and(buyer_id.eq.${targetUserId},seller_id.eq.${uid})`)
        .maybeSingle();

      let targetChatId = existingChats?.id;

      if (!targetChatId) {
        // Create new chat room
        const parsedProdId = targetProductId ? parseInt(targetProductId, 10) : null;
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            buyer_id: uid,
            seller_id: targetUserId,
            product_id: isNaN(parsedProdId || 0) ? null : parsedProdId,
          })
          .select()
          .single();

        if (!createError && newChat) {
          targetChatId = newChat.id;
        }
      }

      await fetchChatRooms(uid, targetChatId);
    }

    handleTargetUser();
  }, [currentUserId, searchParams, fetchChatRooms]);

  // 4. Fetch messages for active chat
  const fetchMessages = useCallback(async (chatId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);

      // Mark messages as read
      if (currentUserId) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_id', chatId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!activeChat) return;

    // Reset scroll state and fetch messages for this chat
    async function loadChat(chatId: string) {
      // Reset state inside async function to avoid setState in effect body lint error
      isInitialLoad.current = true;
      prevMessageCount.current = 0;
      setMessages([]);
      await fetchMessages(chatId);
    }

    loadChat(activeChat.id);

    // Setup Realtime Subscription
    const channel = supabase
      .channel(`chat-room-${activeChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // If message is from other user, mark as read
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }

          // Update chat rooms list preview
          setChatRooms(prev => prev.map(r => {
            if (r.id === activeChat.id) {
              return {
                ...r,
                lastMessage: newMsg.content,
                lastMessageTime: newMsg.created_at,
                unreadCount: newMsg.sender_id !== currentUserId ? 0 : r.unreadCount,
              };
            }
            return r;
          }).sort((a, b) =>
            new Date(b.lastMessageTime || b.updated_at).getTime() -
            new Date(a.lastMessageTime || a.updated_at).getTime()
          ));
        }
      )
      .subscribe();

    // Fallback Polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(activeChat.id);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [activeChat, currentUserId, fetchMessages]);

  // 5. Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !activeChat || !currentUserId || sending) return;

    setSending(true);
    setInputText('');

    // Optimistic message — gunakan ref counter agar tidak memanggil fungsi impure
    const tempId = -(++tempIdCounter.current);
    const optimisticMsg: MessageItem = {
      id: tempId,
      chat_id: activeChat.id,
      sender_id: currentUserId,
      content: textToSend,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    // Force scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat.id,
          sender_id: currentUserId,
          content: textToSend,
          is_read: false,
        });

      if (error) {
        console.error('Failed to send message:', error);
        alert('Gagal mengirim pesan: ' + error.message);
        // Rollback optimistic
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else {
        // Update updated_at of chat
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeChat.id);

        // Update local room list preview
        setChatRooms(prev => prev.map(r => {
          if (r.id === activeChat.id) {
            return {
              ...r,
              lastMessage: textToSend,
              lastMessageTime: new Date().toISOString(),
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  // 6. Open Directory / All Users to start chat
  const handleOpenNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    setLoadingDirectory(true);

    try {
      // 1. Fetch store profiles (Sellers)
      const { data: stores } = await supabase
        .from('store_profiles')
        .select('id, store_name, logo_url, store_address, store_city');

      // 2. Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, city, is_seller');

      const userMap: Record<string, {
        id: string;
        name: string;
        isSeller: boolean;
        storeName?: string;
        avatarUrl?: string;
        city?: string;
      }> = {};

      // Add stores
      stores?.forEach(st => {
        if (st.id !== currentUserId) {
          userMap[st.id] = {
            id: st.id,
            name: st.store_name || 'Toko SegarTani',
            isSeller: true,
            storeName: st.store_name,
            avatarUrl: st.logo_url || undefined,
            city: st.store_city || undefined,
          };
        }
      });

      // Add profiles
      profiles?.forEach(pr => {
        if (pr.id !== currentUserId) {
          if (!userMap[pr.id]) {
            userMap[pr.id] = {
              id: pr.id,
              name: pr.full_name || 'Pengguna ' + pr.id.slice(0, 6),
              isSeller: Boolean(pr.is_seller),
              city: pr.city || undefined,
            };
          } else if (pr.full_name && !userMap[pr.id].storeName) {
            userMap[pr.id].name = pr.full_name;
          }
        }
      });

      setDirectoryUsers(Object.values(userMap));
    } catch (err) {
      console.error('Failed to load user directory:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  // 7. Start chat with user from directory
  const handleSelectUserFromDirectory = async (targetUser: {
    id: string;
    name: string;
    isSeller: boolean;
    storeName?: string;
    avatarUrl?: string;
    city?: string;
  }) => {
    if (!currentUserId) return;
    setIsNewChatModalOpen(false);

    // Check if chat already exists
    const existing = chatRooms.find(r => r.otherUser.id === targetUser.id);
    if (existing) {
      setActiveChat(existing);
      setMobileViewChat(true);
      return;
    }

    // Otherwise create chat in DB
    try {
      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
          buyer_id: currentUserId,
          seller_id: targetUser.id,
        })
        .select()
        .single();

      if (error) {
        alert('Gagal membuat percakapan: ' + error.message);
        return;
      }

      const newRoom: ChatRoom = {
        id: newChat.id,
        buyer_id: newChat.buyer_id,
        seller_id: newChat.seller_id,
        product_id: null,
        created_at: newChat.created_at,
        updated_at: newChat.updated_at,
        otherUser: targetUser,
        product: null,
        unreadCount: 0,
      };

      setChatRooms(prev => [newRoom, ...prev]);
      setActiveChat(newRoom);
      setMobileViewChat(true);
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const filteredChatRooms = chatRooms.filter(room => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      room.otherUser.name.toLowerCase().includes(q) ||
      (room.otherUser.storeName && room.otherUser.storeName.toLowerCase().includes(q)) ||
      (room.lastMessage && room.lastMessage.toLowerCase().includes(q))
    );
  });

  const filteredDirectoryUsers = directoryUsers.filter(u => {
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.storeName && u.storeName.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={44} />
        <p className="font-bold text-gray-500 text-sm">Menyiapkan percakapan Anda...</p>
      </div>
    );
  }

  const backTarget = isCurrentUserSeller ? '/admin/dashboard' : '/ecommerce';
  const backLabel = isCurrentUserSeller ? 'Kembali ke Dashboard Toko' : 'Kembali ke Katalog Belanja';
  const backTooltip = isCurrentUserSeller ? 'Kembali ke Dashboard Toko Penjual' : 'Kembali ke Halaman Katalog Belanja';
  const activeTemplates = isCurrentUserSeller ? SELLER_QUICK_TEMPLATES : BUYER_QUICK_TEMPLATES;

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-20 pb-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[calc(100vh-7.5rem)] min-h-[550px] flex flex-col">
        
        {/* Top Go Back Bar */}
        <div className="mb-3 flex items-center justify-between shrink-0">
          <Link
            href={backTarget}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-primary transition-all group px-3.5 py-2 rounded-2xl bg-white border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 active:scale-95"
            title={backTooltip}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform text-gray-500 group-hover:text-primary" />
            <span>{backLabel}</span>
          </Link>

          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider bg-white text-gray-600 border border-gray-200 shadow-2xs">
            {isCurrentUserSeller ? '🛍️ Akun Penjual' : '🛒 Akun Pembeli'}
          </span>
        </div>

        {/* Main Chat App Window */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* =========================================================================
              LEFT PANEL: Conversation List & Search (Visible on desktop or when mobileViewChat=false)
             ========================================================================= */}
          <div className={`w-full lg:w-96 border-r border-gray-200 flex flex-col bg-white shrink-0 h-full ${
            mobileViewChat ? 'hidden lg:flex' : 'flex'
          }`}>
            
            {/* Header List */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href={backTarget}
                  className="p-2 -ml-1 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl transition-all"
                  title={backTooltip}
                >
                  <ArrowLeft size={20} />
                </Link>
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h1 className="font-black text-lg text-gray-900 tracking-tight">Pesan & Chat</h1>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    {chatRooms.length} Percakapan
                  </p>
                </div>
              </div>

              {/* Start New Chat Button */}
              <button
                type="button"
                onClick={handleOpenNewChatModal}
                className="bg-primary hover:bg-[#008810] text-white p-2.5 rounded-xl shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-black cursor-pointer"
                title="Mulai Chat Baru"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Chat Baru</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari chat atau nama toko..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Rooms List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 no-scrollbar">
              {filteredChatRooms.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="font-black text-gray-800 text-sm mb-1">Belum Ada Percakapan</h3>
                  <p className="text-xs text-gray-400 max-w-xs mb-5">
                    Mulai percakapan dengan penjual, pembeli, atau pengguna terdaftar lainnya.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewChatModal}
                    className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#008810] transition-colors shadow-sm"
                  >
                    + Cari Akun untuk Chat
                  </button>
                </div>
              ) : (
                filteredChatRooms.map((room) => {
                  const isSelected = activeChat?.id === room.id;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setActiveChat(room);
                        setMobileViewChat(true);
                      }}
                      className={`w-full p-4 flex items-center gap-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary/5 border-l-4 border-primary'
                          : 'hover:bg-gray-50/80 bg-white'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {room.otherUser.avatarUrl ? (
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 relative">
                            <Image
                              src={room.otherUser.avatarUrl}
                              alt={room.otherUser.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-xs ${
                            room.otherUser.isSeller
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {room.otherUser.isSeller ? <Store size={22} /> : <UserIcon size={22} />}
                          </div>
                        )}
                        {/* Online green indicator dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="font-bold text-sm text-gray-900 truncate">
                            {room.otherUser.name}
                          </h4>
                          <span className="text-[10px] font-medium text-gray-400 shrink-0">
                            {formatTime(room.lastMessageTime || room.updated_at)}
                          </span>
                        </div>

                        {/* Badges & previews */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 truncate font-normal">
                            {room.lastMessage || 'Ketuk untuk memulai pesan...'}
                          </p>

                          {room.unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-xs">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Product tag if present */}
                        {room.product && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md w-fit truncate max-w-[180px]">
                            <ShoppingBag size={10} />
                            <span className="truncate">{room.product.name}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* =========================================================================
              RIGHT PANEL: Active Chat Conversation Window (Visible on desktop or mobileViewChat=true)
             ========================================================================= */}
          <div className={`flex-1 flex flex-col bg-[#fcfcfd] h-full ${
            !mobileViewChat ? 'hidden lg:flex' : 'flex'
          }`}>
            {activeChat ? (
              <>
                {/* Chat Room Top Bar */}
                <div className="px-5 py-3.5 bg-white border-b border-gray-200 flex items-center justify-between gap-3 shadow-2xs shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Mobile Back Button */}
                    <button
                      type="button"
                      onClick={() => setMobileViewChat(false)}
                      className="lg:hidden p-1.5 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Kembali ke Daftar Chat"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    {/* Recipient Avatar */}
                    <div className="relative">
                      {activeChat.otherUser.avatarUrl ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 relative">
                          <Image
                            src={activeChat.otherUser.avatarUrl}
                            alt={activeChat.otherUser.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          activeChat.otherUser.isSeller ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                        }`}>
                          {activeChat.otherUser.isSeller ? <Store size={20} /> : <UserIcon size={20} />}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-sm sm:text-base text-gray-900 leading-tight">
                          {activeChat.otherUser.name}
                        </h2>
                        {activeChat.otherUser.isSeller && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            Penjual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif Sekarang • {activeChat.otherUser.city || 'SegarTani Indonesia'}
                      </p>
                    </div>
                  </div>

                  {/* Top Right Action: Back link & store details */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={backTarget}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors"
                      title={backTooltip}
                    >
                      <ArrowLeft size={14} />
                      <span className="hidden sm:inline">{isCurrentUserSeller ? 'Pesanan' : 'Katalog'}</span>
                    </Link>
                    {activeChat.otherUser.isSeller && (
                      <Link
                        href="/ecommerce"
                        className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#008810] bg-primary/10 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Store size={14} />
                        Lihat Toko
                      </Link>
                    )}
                  </div>
                </div>

                {/* Optional Product Header Banner */}
                {activeChat.product && (
                  <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-emerald-200 shrink-0">
                        <Image
                          src={activeChat.product.image}
                          alt={activeChat.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Membahas Produk:</p>
                        <p className="text-xs font-black text-gray-900 truncate">{activeChat.product.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-black text-primary">{formatIDR(activeChat.product.price)}</span>
                      <Link
                        href={`/ecommerce/${activeChat.product.id}`}
                        className="text-xs font-bold bg-white text-gray-700 hover:text-primary px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1 shadow-2xs"
                      >
                        <ExternalLink size={12} /> Buka
                      </Link>
                    </div>
                  </div>
                )}

                {/* Messages Body Scroll Area */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Security / Encrypted Notice */}
                  <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center gap-1.5 bg-gray-100/90 text-gray-500 text-[11px] font-medium px-3 py-1 rounded-full shadow-2xs">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Percakapan terenkripsi dan aman di platform SegarTani</span>
                    </div>
                  </div>

                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                        <MessageSquare size={30} />
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm">Mulai Kirim Pesan</h4>
                      <p className="text-xs text-gray-400 max-w-sm mt-1">
                        Tanyakan stok, kualitas produk sayur/buah, atau konfirmasi pengiriman langsung ke {activeChat.otherUser.name}.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender_id === currentUserId;

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium shadow-xs leading-relaxed ${
                              isMe
                                ? 'bg-primary text-white rounded-br-xs'
                                : 'bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                            <div
                              className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                                isMe ? 'text-white/80' : 'text-gray-400'
                              }`}
                            >
                              <span>{formatTime(msg.created_at)}</span>
                              {isMe && (
                                msg.is_read ? (
                                  <CheckCheck size={14} className="text-emerald-200" />
                                ) : (
                                  <Check size={14} className="text-white/70" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Template Chips */}
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" /> Balas Cepat:
                  </span>
                  {activeTemplates.map((tmpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendMessage(tmpl)}
                      className="text-xs font-semibold bg-white text-gray-700 hover:text-primary hover:border-primary/40 border border-gray-200 px-3 py-1.5 rounded-full shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>

                {/* Bottom Input Area */}
                <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    <input
                      type="text"
                      placeholder={`Ketik pesan untuk ${activeChat.otherUser.name}...`}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={sending}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />

                    <button
                      type="submit"
                      disabled={!inputText.trim() || sending}
                      className="bg-primary hover:bg-[#008810] disabled:bg-gray-200 disabled:text-gray-400 text-white p-3 sm:px-5 sm:py-3 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          <span className="hidden sm:inline text-xs font-black">Kirim</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // Empty State when no conversation is active
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                  <MessageSquare size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Pilih Percakapan untuk Memulai</h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6">
                  Pilih salah satu kontak di sisi kiri atau klik tombol &quot;Chat Baru&quot; untuk mengirim pesan ke penjual maupun pembeli.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleOpenNewChatModal}
                    className="bg-primary hover:bg-[#008810] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={18} />
                    Mulai Chat Baru Sekarang
                  </button>
                  <Link
                    href={backTarget}
                    className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl border border-gray-200 transition-all flex items-center gap-2 shadow-2xs"
                  >
                    <ArrowLeft size={18} />
                    {backLabel}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Direct Directory of All Registered Accounts (Start New Chat)
         ========================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Mulai Chat Baru</h3>
                  <p className="text-[11px] text-gray-400">Pilih akun penjual atau pembeli</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama akun atau nama toko..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Users / Stores List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 -mx-2 px-2 no-scrollbar">
              {loadingDirectory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 size={28} className="animate-spin text-primary" />
                  <span className="text-xs font-bold">Memuat daftar akun...</span>
                </div>
              ) : filteredDirectoryUsers.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs font-medium">
                  Tidak ada akun yang sesuai dengan pencarian.
                </div>
              ) : (
                filteredDirectoryUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUserFromDirectory(u)}
                    className="w-full py-3 px-3 rounded-2xl hover:bg-gray-50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatarUrl ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 relative shrink-0">
                          <Image src={u.avatarUrl} alt={u.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          u.isSeller ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                        }`}>
                          {u.isSeller ? <Store size={18} /> : <UserIcon size={18} />}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">
                          {u.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {u.isSeller ? '🏪 Toko / Penjual' : '👤 Pembeli'} {u.city ? `• ${u.city}` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Chat
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-gray-100 mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-11 w-11 border-4 border-primary border-t-transparent" />
        <p className="font-bold text-gray-500 text-sm">Memuat halaman chat...</p>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
